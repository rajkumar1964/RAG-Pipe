import {Router} from "express"
import { sendmessage, getchat, getmessages,deletechat, uploadpdf} from "../controller/chat.controller.js"
import { authmiddleware } from "../middleware/auth.middleware.js"
import upload from "../middleware/uploadmiddleware.js"
const chatrouter= Router()

chatrouter.post("/message",authmiddleware,upload.single("image"),sendmessage)
chatrouter.get("/getchat",authmiddleware,getchat)
chatrouter.get("/:chatId/getmessages",authmiddleware,getmessages)
chatrouter.delete("/:chatId",authmiddleware, deletechat)
chatrouter.post("/upload-pdf",authmiddleware,upload.single("pdf"),uploadpdf)
export default chatrouter