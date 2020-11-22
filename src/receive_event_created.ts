import {connect, Connection, ConfirmChannel, Channel, credentials}  from  'amqplib/callback_api';
import {storeEvent} from "./dbcontroller";


export function receive_event_created(dbconnection:any){
connect('amqp://localhost', (error0, connection) =>{
  if (error0) {
    throw error0;
  }else{
    console.log("receive event created connected to server")
  }
  connection.createChannel((error1, channel) =>{
    if (error1) {
      throw error1;
    }else{
      console.log("recieve event created connected to channel")
    }
    const exchange = "event.create"

    channel.assertExchange(exchange, 'fanout', {durable:false});

    channel.assertQueue('', {
      exclusive:true
    }, (error2,q)=>{
      if(error2){
        throw error2;
      }
      else{
        console.log("queue asserted")
      }
      channel.bindQueue(q.queue,exchange,'');

      channel.consume(q.queue, (msg)=>{
        console.log("event created message recieved")
        if(msg.content){
          console.log(" [x] %s", msg.content.toString());
          const msgcontent = JSON.parse(msg.content.toString())
          storeEvent(dbconnection,msgcontent._id,msgcontent.name, msgcontent.presentations.maxPresentations);
        }else{
          console.log("create event message empty")
        }
      },{
        noAck:true
      })

    })


  });
})

};