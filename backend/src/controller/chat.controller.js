import { generateresponse, genratechattitle, invalidateAgentCache } from "../services/ai.service.js"
import uploadimage from "../services/Storage.service.js";
import chatmodel from "../model/chat.model.js"
import messagemodel from "../model/message.model.js"
import { extractTextFromPdf, chunkText } from "../services/pdf.services.js"
import { addChunksToVectorStore, deleteChatCollection } from "../services/vectorstore.services.js"


export async function sendmessage(req, res) {
    try {
        console.log(req.file)
        const { message, chat: chatId } = req.body;
        let title = null;
        let chat = null;
        let imageurl = null;

        if (req.file) {
            const uploaded = await uploadimage({
                buffer: req.file.buffer,
                filename: `chat_${Date.now()}_${req.file.originalname}`,
                folder: "/chat-images",
            });
            imageurl = uploaded.url;
        }

        if (!chatId) {
            title = await genratechattitle(message);
            title = title?.replace(/"/g, "").trim();
            chat = await chatmodel.create({
                user: req.user.id,
                title
            })
        } else {
            chat = await chatmodel.findById(chatId);
        }

        const usermessage = await messagemodel.create({
            chat: chat._id || chatId,
            content: message,
            imageurl: imageurl || null,
            role: "user"
        })

        const messages = await messagemodel.find({ chat: chatId || chat._id })
        console.log("Calling generateresponse...")
        const result = await generateresponse(messages, chat._id || chatId);
        console.log("Got result:", result)

        const aimessage = await messagemodel.create({
            chat: chat._id || chatId,
            content: result,
            role: "ai"
        })

        res.status(201).json({
            title,
            chat,
            aimessage,
            usermessage
        });
    } catch (err) {
        console.error("sendmessage error:", err);
        res.status(500).json({ message: "Failed to send message", error: err.message });
    }
}


export async function getchat(req, res) {
    const userid = req.user.id
    const chats = await chatmodel.find({ user: userid })

    res.status(200).json({
        message: "chat recieved succesfully",
        chats
    })
}


export async function getmessages(req, res) {
    const { chatId } = req.params;
    const chat = await chatmodel.findOne({
        _id: chatId,
        user: req.user.id
    })

    if (!chat) {
        return res.status(404).json({
            message: "chat not found "
        })
    }
    const messages = await messagemodel.find({
        chat: chatId
    })
    res.status(200).json({
        message: "Message recieved succefully",
        messages
    })
}


export async function deletechat(req, res) {
    const { chatId } = req.params;

    const chat = await chatmodel.findOneAndDelete({
        _id: chatId,
        user: req.user.id
    })

    if (!chat) {
        return res.status(404).json({
            message: "chat not found"
        })
    }

    await messagemodel.deleteMany({
        chat: chatId
    })

    await deleteChatCollection(chatId);

    res.status(200).json({
        message: "chat deleted successfully"
    })
}


export async function uploadpdf(req, res) {
    try {
        const { chat: chatId } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "PDF file is required" });
        }

        const chat = await chatmodel.findOne({ _id: chatId, user: req.user.id });
        if (!chat) {
            return res.status(404).json({ message: "chat not found" });
        }

        const text = await extractTextFromPdf(req.file.buffer);
        const chunks = await chunkText(text);
        await addChunksToVectorStore(chatId, chunks, req.file.originalname);

        chat.hasDocument = true;
        await chat.save();

        invalidateAgentCache(chatId);

        res.status(200).json({
            message: "PDF processed and stored successfully",
            chunkCount: chunks.length,
        });
    } catch (err) {
        console.error("uploadpdf error:", err);
        res.status(500).json({ message: "PDF upload failed", error: err.message });
    }
}