export enum state {
    submitted="submitted",
    approved="approved",
    not_this_year="not this year"
}

export interface Presentation {
    event:string,
    email:string,
    name:string,
    company:string,
    title:string,
    synopsis:string,
    state:state
}

// All of these functions must accept a mysql2 connection object that has been connected to the presentationproposals database that is initialized by the dbinit.ts file

// This function must accept a connection object, and an object matching the Presentation interface
export async function createPresentation(connection:any,data:Presentation){
    return connection.promise().query("INSERT INTO presentations (event,speakername,email,company,title,synopsis,state) VALUES(?,?,?,?,?,?,?)",[data.event,data.name,data.email,data.company,data.title,data.synopsis,state.submitted])
    .catch(console.log)
    .then(()=>{
        console.log("presentation created")
    })

}

// This function must accept a connection object, and an string with the name of the event.
// It returns a tuple of form [rows,columns] where rows and colums are both arrays.
// The rows array contains the presentations in row objects.
export async function getAllPresentations(connection:any,event:string){
    return connection.promise().query("SELECT * FROM presentations WHERE event=?",[event])
    .catch(console.log)
    .then((result:any)=>{
        return result
    });
}

// This function must accept a connection object, and a string containing the event name, and a string containing the title of the presentation
// It returns a tuple of form [rows,colums] where rows and columns are both arrays
// The rows array should contain a single presentation row object.
export async function getPresentation(connection:any,event:string,title:string){
    return connection.promise().query("SELECT * FROM presentations WHERE event=? AND title=?",[event,title])
    .catch(console.log)
    .then((result:any)=>{
        return result;
    });
}
// This function must accept a connection object, and a string containing the event name, a string containing the title of a presentation, and one of the three enums from the state type.
// It sets the presentation state value as the provided enum from the state type.

export async function modifyPresentationState(connection:any,event:string,title:string, newstate:state){
    return connection.promise().query("UPDATE presentations SET state=? WHERE event=? AND title=?",[newstate,event,title])
    .catch(console.log)
    .then((result:any)=>{
        return result;
    });
}

export async function storeEvent(connection:any,eventId:string, eventname:string, presentationMax:number){
   return connection.promise().query("INSERT INTO events (eventId, event,maxpresentations,approvedpresentations) VALUES(?,?,?,?)",[eventId,eventname,presentationMax,0]).catch(console.log)
}

export async function getEvent(connection:any,eventname:string){
    return connection.promise().query("SELECT * FROM events where event=?",[eventname]).catch(console.log);
}

export async function changeMax(connection:any,eventId:string, eventname:string,presentationMax:number){
    return connection.promise().query("UPDATE events SET maxpresentations=? WHERE event=?",[presentationMax,eventname]).catch(console.log);
}
export async function incrementApproved(connection:any,eventname:string){
    return connection.promise().query("UPDATE events SET approvedpresentations = approvedpresentations+1 WHERE event=?",[eventname]).catch(console.log)
}