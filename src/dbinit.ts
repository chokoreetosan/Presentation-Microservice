// You should not need to use this file, because the development database has been initialized on RDS

import {createConnection, QueryError, RowDataPacket} from 'mysql2';
import * as dotenv from "dotenv"
dotenv.config();
import * as bluebird from "bluebird"
import {createPresentation,state, getAllPresentations, getPresentation, modifyPresentationState, storeEvent, changeMax, incrementApproved, getEvent} from "./dbcontroller"

const dbHost = process.env.DB_HOST || 'localhost';

async function init(){
    // connects to database
    const connection = await createConnection({
        host: dbHost,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database:"mysql",
        Promise:bluebird
    });
    connection.connect((err)=>{
        if (err) {
          console.error('error connecting: ' + err.stack);
          return;
        }

        console.log('connected as id ' + connection.threadId);
    });

    // destroys the old database if it exists
    await connection.promise().query('DROP DATABASE IF EXISTS presentationproposals')
    .catch(console.log)
    .then(()=>{
        console.log("presentationproposals database dropped")
    });
    // creates a new database called presentationproposals
    await connection.promise().query('CREATE DATABASE presentationproposals')
    .catch(console.log)
    .then(()=>{
        console.log("presentationproposals database created")
    });
    // switches to database we just created
    await connection.promise().query("USE presentationproposals")
    .catch(console.log)
    .then(()=>{
        console.log("presentationproposals database selected");
    })
    // creates the table to store the presentations, called presentations
    await connection.promise().query("CREATE TABLE presentations (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, event varchar(125), speakername varchar(125), email varchar(125), company varchar(125), title varchar(125), synopsis LONGTEXT, state enum('submitted', 'approved', 'not this year'))")
    .catch(console.log)
    .then(()=>{
        console.log("presentations table created")
    })


    // Creates a sample presentation at at sample event
    await createPresentation(connection, {
        event:"sampleevent",
        email:"asdf@asdf.com",
        name:"asdfman",
        company:"asdfcompany",
        title:"asdftitle",
        synopsis:"this isa  syopsis of asdfasdfasdf asdftitle presentation",
        state:state.submitted
    })

    // Retrieves all presentations
    const presentations = await getAllPresentations(connection, "sampleevent");
    console.log("retreiving the presentations for sampleevent",presentations[0]);

    // Retrieves just the sample presentation we just created
    let presentation = await getPresentation(connection, "sampleevent", "asdftitle")
    console.log("retreiving the presentation asdftitle taking place at sampleevent", presentation[0]);

    // Approves just the sample presentation we just created
    await modifyPresentationState(connection,"sampleevent", "asdftitle",state.approved);

    // Retrieves the sample presentation again
    presentation = await getPresentation(connection, "sampleevent", "asdftitle")
    console.log("presentation asdftitle at sampleevent should be approved", presentation[0]);

    await connection.promise().query("CREATE TABLE events (id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, eventId INT, event varchar(125), maxpresentations integer, approvedpresentations integer)")
    .catch(console.log)
    .then(()=>{
        console.log("event table created")
    });

    await storeEvent(connection,"id1234", "sampleevent", 3);
    let event = await getEvent(connection,"sampleevent")
    console.log("event gotten",event[0])
    await changeMax(connection,"id1234","sampleevent", 3);
    event = await getEvent(connection,"sampleevent")
    console.log("event gotten",event[0])
    await incrementApproved(connection,"sampleevent");
    event = await getEvent(connection,"sampleevent")
    console.log("event gotten",event[0])


    // Kills the connection
    await connection.end();
}
init();