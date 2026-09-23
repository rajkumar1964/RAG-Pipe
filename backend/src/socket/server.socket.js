import {Server} from 'socket.io';


// ye sab server.js pe karna ai import app chala dena hia http server pe 
let io;
// export function initSocket(httpServer){
//    io = new Server(httpServer, {
//   cors: {
//     origin: "http://localhost:5173","https://rag-pipe-86ej.onrender.com",
//     credentials: true,
//   }
export function initSocket(httpServer){
   io = new Server(httpServer, {
  cors: {
    origin:"https://rag-pipe-86ej.onrender.com",
    credentials: true,
  }
});
    console.log("socket io server is running ");
    
    
    
    io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("disconnect", (reason) => {
        console.log("Disconnected:", socket.id, reason);
    });
});

}


export function getid(){
    if(!io){
        throw new Error("socketio is not initialized")
    }
    return io
}

