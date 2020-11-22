import {connect, Connection, ConfirmChannel, Channel, credentials}  from  'amqplib/callback_api';
import {changeMax} from "./dbcontroller"


export function receive_event_modify(dbconnection:any){
connect('amqp://localhost', (error0, connection) =>{
  if (error0) {
    throw error0;
  }else {
    console.log("receive event modify connected to server")
  }
  connection.createChannel((error1, channel) =>{
    if (error1) {
      throw error1;
    }else{
      console.log("recieve event modify connected to channel")
    }
    const exchange = "event.modify"

    channel.assertExchange(exchange, 'fanout', {durable:false});

    channel.assertQueue('', {
      exclusive:true
    }, (error2,q)=>{
      if(error2){
        throw error2;
      }
      channel.bindQueue(q.queue,exchange,'');

      channel.consume(q.queue, (msg)=>{
        if(msg.content){
          console.log(" [x] %s", msg.content.toString());
          const msgcontent = JSON.parse(msg.content.toString());
          changeMax(dbconnection,msgcontent._id,msgcontent.name, msgcontent.presentations.maxPresentations)
        }else{
          console.log("empty modify message")
        }
      },{
        noAck:true
      })

    })


  });
})

};