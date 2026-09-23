import { io } from "socket.io-client";

export const initializedsocketconnection = () => {
    console.log("Initializing socket connection...");

//    const socket = io("http://localhost:3000","https://rag-pipe-86ej.onrender.com", {
//   withCredentials: true,
// });
   const socket = io("https://rag-pipe-86ej.onrender.com", {
  withCredentials: true,
});

    socket.on("connect", () => {
        console.log("Connected to Socket.IO:", socket.id);
    });

    socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message);
    });

    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
    });

    return socket;
};