import express from "express"
import path from "path"
import { fileURLToPath } from 'url'
import morgan from 'morgan'
import connecttodb from "./config/database.js"
import cookieParser from "cookie-parser"
import authrouter from "./routes/auth.routes.js"
import handleerror from "./middleware/handleerror.js"
import cors from "cors"
import chatrouter from "./routes/chat.routes.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'dist')))

const allowedOrigins = [
    "http://localhost:5173",
    "https://rag-pipe-86ej.onrender.com"
];
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(cookieParser())

// app.get("/health", (req, res) => {
//     res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
// })

app.use("/api/auth", authrouter)
app.use("/api/chat", chatrouter)
app.use(morgan("dev"))

app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
})

connecttodb()

app.use(handleerror)
export default app;