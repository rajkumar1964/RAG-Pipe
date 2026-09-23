import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: {}, // array of chat objects
    currentchatId: null,
    isLoading: false,
    error: null,
  },

  reducers: {
    createnewchat: (state, action) => {
      const { chatId, title } = action.payload;

      // DO NOT overwrite existing chat
      if (!state.chats[chatId]) {
        state.chats[chatId] = {
          id: chatId,
          title,
          messages: [],
          lastUpdated: new Date().toISOString(),
        };
      }

      state.currentchatId = chatId;
    },
    
    addMessages: (state, action) => {
      const { chatId, messages } = action.payload;
      state.chats[chatId].messages.push(...messages);
    },

    addnewmessage: (state, action) => {
      const { chatId, content, role ,imageurl } = action.payload;
      state.chats[chatId].messages.push({
        content,
        role,
       imageurl: imageurl || null,
      });

      state.chats[chatId].lastUpdated = new Date().toISOString();
    },

    setchats: (state, action) => {
      const incoming = action.payload.chats;
      if (Array.isArray(incoming)) {
        incoming.forEach((chat) => {
          state.chats[chat.id] = chat;
        });
      } else {
        state.chats = incoming;
      }
    },

    setcurrentchatId: (state, action) => {
      state.currentchatId = action.payload;
    },

    setisLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    seterror: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setchats,
  setcurrentchatId,
  setisLoading,
  seterror,
  createnewchat,
  addnewmessage, addMessages
} = chatSlice.actions;

export default chatSlice.reducer;