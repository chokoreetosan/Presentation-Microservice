import {connect, Connection, ConfirmChannel, Channel, credentials}  from  'amqplib/callback_api';
import {Presentation} from "./dbcontroller"

// Connects to RabbitMQ

export function send(msg:Presentation){
console.log(msg,"trying to send message")

return new Promise((resolve,reject)=>{
  connect('amqp://localhost', (error0, rabbitconnection)=>{
    if(error0){
        reject(error0)
    }else{
        console.log("sending")
    }
    rabbitconnection.createChannel((error1,channel)=>{
        if (error1) {
          reject(error1)
        }
        const exchange = 'presentation.approved';

        channel.assertExchange(exchange,"fanout", {
          durable: false
        });
        channel.publish(exchange, '', Buffer.from(msg));
        console.log(" [x] Sent %s", msg);
        channel.close((err)=>{
          if(err){
            console.log(err);
            resolve();
          }
        })
      });
})
})


};