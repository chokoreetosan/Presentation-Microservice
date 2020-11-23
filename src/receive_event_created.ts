// import {connect, Connection, ConfirmChannel, Channel, credentials}  from  'amqplib/callback_api';
import {storeEvent} from "./dbcontroller";
import {connect} from 'amqplib';
import { join } from "bluebird";

const mqHost = process.env.RABBITMQ_HOST || 'localhost';

export async function receive_event_created(dbconnection:any){
  return connect(`amqp://${mqHost}`)
  .then((connection)=>{
    return connection.createChannel()
  })
  .then( async (channel)=>{
    const exchange = "event.create"
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
          console.log("event created message sent via rabbit [x] %s", msg.content.toString());
          const msgcontent = JSON.parse(msg.content.toString())
          storeEvent(dbconnection,msgcontent._id,msgcontent.name, msgcontent.presentations.maxPresentations);
      }else{
        console.log("receive event create message empty")
      }
    },{
      noAck:true
    })
  })
}


// export function receive_event_created(dbconnection:any){
// connect('amqp://localhost', (error0, connection) =>{
//   if (error0) {
//     throw error0;
//   }else{
//     console.log("receive event created connected to server")
//   }
//   connection.createChannel((error1, channel) =>{
//     if (error1) {
//       throw error1;
//     }else{
//       console.log("recieve event created connected to channel")
//     }
//     const exchange = "event.create"

//     channel.assertExchange(exchange, 'fanout', {durable:false});

//     channel.assertQueue('', {
//       exclusive:true
//     }, (error2,q)=>{
//       if(error2){
//         throw error2;
//       }
//       else{
//         console.log("queue asserted")
//       }
//       channel.bindQueue(q.queue,exchange,'');

//       channel.consume(q.queue, (msg)=>{
//         console.log("event created message recieved")
//         if(msg.content){
//           console.log(" [x] %s", msg.content.toString());
//           const msgcontent = JSON.parse(msg.content.toString())
//           storeEvent(dbconnection,msgcontent._id,msgcontent.name, msgcontent.presentations.maxPresentations);
//         }else{
//           console.log("create event message empty")
//         }
//       },{
//         noAck:true
//       })

//     })


//   });
// })

// };