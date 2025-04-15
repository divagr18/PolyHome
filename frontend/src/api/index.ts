import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/', // Or your Django backend URL
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
  },
});

// Optional: add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// Classic REST calls (still using axios)
export default {
  getChats: () => api.get('chat/'),
  createChat: (data: { name: string }) => api.post('chat/', data),
  getChatMessages: (chatId: number) => api.get(`chat/${chatId}/messages/`),
  createChatMessage: (chatId: number, data: { content: string, sender: string }) =>
    api.post(`chat/${chatId}/messages/`, data),

  // For non-streaming chatbot message (rarely used, kept for reference)
  sendMessageToChatbotForm: (message: string, image?: File): Promise<any> => {
    const formData = new FormData();
    formData.append('text', message);
    if (image) {
      formData.append('image', image);
    }
    // NOTE: Do not set Content-Type header manually for FormData in axios! It handles it.
    return api.post('chat/message/', formData);
  },

  // **For streaming agent chat, use fetch!**
  sendMessageToChatbotStream: (
    message: string,
    image?: File
  ): Promise<Response> => {
    const formData = new FormData();
    formData.append('text', message);
    if (image) {
      formData.append('image', image);
    }
    // It's important to NOT set the Content-Type header here: fetch + FormData does it for you
    return fetch('http://localhost:8000/api/multiagent/stream/', {
      method: 'POST',
      body: formData,
      credentials: 'include', // optional, for Django auth
      headers: {
        // 'Accept': 'text/event-stream', // Not required, but for clarity if needed
        // Do not set Content-Type
      },
    });
  },
};