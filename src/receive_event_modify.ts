import {connect, Connection, ConfirmChannel, Channel, credentials}  from  'amqplib';
import {changeMax} from "./dbcontroller"


export async function receive_event_modify(dbconnection:any){
  return connect("amqp://localhost")
  .then((connection)=>{
    return connection.createChannel()
  })
  .then( async (channel)=>{
    const exchange = "event.modify"
    channel.assertExchange(exchange,'fanout',{durable:false});
    const q = await channel.assertQueue('',{
      exclusive:true
    })
    channel.bindQueue(q.queue,exchange,'');
    return {channel,q};
  })
  .then(({channel,q})=>{
    channel.consume(q.queue,(msg)=>{
      if(msg.content){
          console.log("event modify message sent via rabbit [x] %s", msg.content.toString());
          const msgcontent = JSON.parse(msg.content.toString())
          changeMax(dbconnection,msgcontent._id,msgcontent.name, msgcontent.presentations.maxPresentations)
      }else{
        console.log("receive event modify message empty")
      }
    },{
      noAck:true
    })
  })
}

