import { useDispatch } from "react-redux";
import { initializedsocketconnection } from "../service/chat.socket";
import { sendmessage, getchats, getmessages, uploadpdf } from "../service/chat.api.js"; // ✅ uploadpdf added
import {
  setcurrentchatId,
  setisLoading,
  seterror,
  createnewchat,
  addnewmessage, setchats, addMessages
} from "../chat.slice.js";

export const useChat = () => {
  const dispatch = useDispatch();

  const startnewchat = () => {
    dispatch(setcurrentchatId(null));
  };

  const sendmessagehandler = async ({ message, chatId, image }) => {   // ✅ image add kiya
    dispatch(setisLoading(true));

    try {
      const data = await sendmessage({ message, chatId, image });   // ✅ aage bheja
      const { chat, usermessage, aimessage } = data;                 // ✅ usermessage bhi liya

      if (!chatId) {
        dispatch(
          createnewchat({
            chatId: chat.id || chat._id,
            title: chat.title,
          })
        );
      }


      dispatch(
        addnewmessage({
          chatId: chat.id || chat._id,
          content: message,
          imageurl: usermessage?.imageurl || null,   // ✅ ye add karo
          role: "user",
        })
      );

     
      dispatch(
        addnewmessage({
          chatId: chat.id || chat._id,
          content: aimessage.content,
          role: aimessage.role,
        })
      );

      dispatch(setcurrentchatId(chat.id || chat._id));
    } catch (error) {
      dispatch(
        seterror(
          error.response?.data?.message || "Failed to send message."
        )
      );
    } finally {
      dispatch(setisLoading(false));
    }
  };

  const handleGetChats = async () => {
    dispatch(setisLoading(true));

    try {
      const data = await getchats();

      const chatsObj = data.chats.reduce((acc, chat) => {
        acc[chat._id || chat.id] = {
          id: chat._id || chat.id,
          title: chat.title,
          messages: chat.messages || [],
          lastUpdated: chat.updatedAt || new Date().toISOString(),
        };
        return acc;
      }, {});

      dispatch(setchats({ chats: chatsObj }));
    } catch (error) {
      dispatch(
        seterror(error.response?.data?.message || "Failed to fetch chats")
      );
    } finally {
      dispatch(setisLoading(false));
    }
  };

  async function handleOpenChat(chatId, chats) {
    if (chats[chatId]?.messages.length === 0) {
      const data = await getmessages(chatId);
      const { messages } = data;

      const formattedMessages = messages.map((msg) => ({
        content: msg.content,
        role: msg.role,
        imageurl: msg.imageurl || null,   // ✅ ye add karo, warna purani images gayab rahengi
      }));

      dispatch(
        addMessages({
          chatId,
          messages: formattedMessages,
        })
      );
    }
    dispatch(setcurrentchatId(chatId));
  }

  const uploadPdfHandler = async ({ file, chatId }) => {
    dispatch(setisLoading(true));

    try {
      const data = await uploadpdf({ file, chatId });
      return data; 
    } catch (error) {
      dispatch(
        seterror(error.response?.data?.message || "Failed to upload PDF.")
      );
      throw error; 
    } finally {
      dispatch(setisLoading(false));
    }
  };

  return {
    initializedsocketconnection,
    sendmessagehandler, handleGetChats, handleOpenChat, startnewchat,
    uploadPdfHandler   
  };
};