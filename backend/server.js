import "dotenv/config";
import http from "http"
import app from "./src/app.js"
import { initSocket } from "./src/socket/server.socket.js";

const httpServer = http.createServer(app)
initSocket(httpServer);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`server is running on ${PORT}`);
});