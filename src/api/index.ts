import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000/api/',  // Default Django backend URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


export default {
  getChats: () => api.get('chat/'),
  createChat: (data: { name: string }) => api.post('chat/', data),
  getChatMessages: (chatId: number) => api.get(`chat/${chatId}/messages/`),
  createChatMessage: (chatId: number, data: { content: string, sender: string }) => api.post(`chat/${chatId}/messages/`, data),
  // Remove getProperty and getRecommendedProperties
  // getProperty: (id: number) => api.get(`properties/${id}/`),
  // getRecommendedProperties: (clientId: number) => api.get(`clients/${clientId}/recommended-properties/`),


  // Add the new sendMessageToChatbot function later
  sendMessageToChatbot: (message: string, image?: File): Promise<any> => {
    const formData = new FormData();
    formData.append('text', message);
    if (image) {
      formData.append('image', image);
    }

    return api.post('chat/message/', formData, { // Adjust endpoint if needed
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};