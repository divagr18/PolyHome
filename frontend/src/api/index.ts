import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/';

const api = axios.create({
  baseURL: API_BASE_URL, 
  timeout: 10000, 
  headers: {
    'Accept': 'application/json',
    
  },
  
});

api.interceptors.request.use(
  (config) => {
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('authToken'); 
      if (token) {
        
        config.headers = config.headers || {};
        
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error) 
);

export default {
  
  getChats: () => api.get('chat/'), 

  createChat: (data: { name: string }) => api.post('chat/', data), 

  createChatMessage: (chatId: number, data: { content: string, sender: string }) =>
    api.post(`chat/${chatId}/messages/`, data),

  sendMessageToChatbotForm: (message: string, history?: any[], image?: File): Promise<any> => {
    const formData = new FormData();
    formData.append('text', message);
    if (history) {
        formData.append('history', JSON.stringify(history)); 
    }
    if (image) {
      formData.append('image', image);
    }
    
    return api.post('multiagent/chat/', formData); 
  },

  sendMessageToChatbotStream: (
    message: string,
    history: any[], 
    image?: File
  ): Promise<Response> => { 
    const formData = new FormData();
    formData.append('text', message);
    formData.append('history', JSON.stringify(history)); 
    if (image) {
      formData.append('image', image);
    }

    const streamUrl = `${API_BASE_URL}multiagent/stream/`; 

    return fetch(streamUrl, {
      method: 'POST',
      body: formData,
      
      headers: {
        
      },
      
    });
  },
};