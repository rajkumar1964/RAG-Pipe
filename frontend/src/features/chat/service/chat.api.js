import axios from "axios";

// const api = axios.create({
//  baseURL:"http://localhost:3000","https://rag-pipe-86ej.onrender.com",
//   withCredentials: true
// });
const api = axios.create({
 baseURL:"https://rag-pipe-86ej.onrender.com",
  withCredentials: true
});

export const sendmessage = async ({ message, chatId, image }) => {
  const formData = new FormData();
  formData.append("message", message);

  if (chatId) {
    formData.append("chat", chatId);
  }

  if (image) {
    formData.append("image", image);   
  }

  const response = await api.post("/api/chat/message", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};


export const getchats = async ()=>{
    const response = await api.get("/api/chat/getchat")

    return response.data

}

export const getmessages = async (chatId)=>{
    const response = await api.get(`/api/chat/${chatId}/getmessages`)
    return response.data
}

export const deletechat = async (chatId)=>{
    const response = await api.delete(`/api/chat/${chatId}`)
    return response.data
}

export const uploadpdf = async ({ file, chatId }) => {
  const formData = new FormData();
  formData.append("pdf", file);
  formData.append("chat", chatId);

  const response = await api.post("/api/chat/upload-pdf", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
 console.log(response);
 
  return response.data;
};