import express from "express";
const app = express();
const port = 8081; // default port to listen
import {config} from "dotenv";
import { resolve } from "path";
config({path:resolve(__dirname,".env")})
import {send} from "./send_approvals.js";
import {receive_event_created} from "./receive_event_created.js"
import {receive_event_modify} from "./receive_event_modify.js"
import {createConnection, QueryError, RowDataPacket} from 'mysql2';
import CircuitBreaker from "opossum";

import * as dotenv from "dotenv"
dotenv.config();
import * as bluebird from "bluebird"
import {createPresentation,state, getAllPresentations, getPresentation, modifyPresentationState, storeEvent,changeMax,incrementApproved,getEvent} from "./dbcontroller"




// Connects to database
const connection = createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database:"presentationproposals",
        Promise:bluebird
});
connection.connect((err)=>{
        if (err) {
          console.error('error connecting to database: ' + err.stack);
          return;
        }
        console.log('connected as id ' + connection.threadId);
});

const receiveCreate = new CircuitBreaker(receive_event_created);
const receiveModify = new CircuitBreaker(receive_event_modify);
receiveCreate.fallback(()=>{
console.log("event.create service seems to be down right now'")
});
receiveModify.fallback(()=>{
console.log("event.modify service seems to be down right now")
});

receiveCreate.fire(connection);
receiveModify.fire(connection);


app.use(express.urlencoded({type:"application/x-www-form-urlencoded"}))

// Check the readme for more details on how to use these endpoints.

// This endpoint retrieves a single presentation.
app.get("/presentation", async (req,res)=>{
    const data = await getPresentation(connection,req.body.event,req.body.title)
    res.send(data[0])
})

// This endpoint creates a presentation.
// Right now, it will create a presentation without checking if one already exists at the event with the same title
app.post("/presentation",async (req,res)=>{
    const data = await createPresentation(connection,req.body)
    res.send(req.body.event)
})

// This endpoint retrieves a list of all the presentations.
app.get("/allpresentations",async (req,res)=>{
    const data = await getAllPresentations(connection,req.body.event)
    res.send(data[0])
})

// This endpoint changes the state of an existing presentation proposal
app.patch("/presentation",async (req,res)=>{
    if(req.body.newstate ==="submitted" || req.body.newstate ==="approved" || req.body.newstate === "not-this-year"){
        if(req.body.newstate === "approved"){
            let toBeModified = await getEvent(connection,req.body.event)
            toBeModified = toBeModified[0][0];
            if(parseInt(toBeModified.approvedpresentations,10) < parseInt(toBeModified.maxpresentations,10)){
                await modifyPresentationState(connection,req.body.event,req.body.title, req.body.newstate);
                await incrementApproved(connection,req.body.event);
                let tobesent = await getPresentation(connection,req.body.event,req.body.title)
                tobesent = JSON.parse(JSON.stringify(tobesent))[0][0];
                const breaker = new CircuitBreaker(send,{
                    timeout:3000,
                })
                breaker.fallback(()=>{
                    console.log("presentations.approvals channel out of service")
                });
                breaker.on('fallback',(result)=>{
                    console.log("should probably record failures in a database")
                })
                breaker.fire(tobesent).then(console.log).catch(console.log);
                res.send("presentation approved")
            }else{
                res.send("this event has had it's maximum number of presentations approved");
            }
        }else if(req.body.newstate ==="not-this-year"){
            res.send("too bad, maybe next year")
        }
    }else{
        res.send("invalid argument")
    }
})

// start the Express server
const server = app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );
