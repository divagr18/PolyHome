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

// API endpoints
export const messagesApi = {
  getMessages: () => api.get('messages/'),
  sendMessage: (text: string) => api.post('messages/', { text }),
  getConversationSummary: (conversationId: number) => api.get(`conversations/${conversationId}/summary/`)
};

export const propertiesApi = {
  getProperties: () => api.get('properties/'),
  getProperty: (id: number) => api.get(`properties/${id}/`),
  getRecommendedProperties: (clientId: number) => api.get(`clients/${clientId}/recommended-properties/`)
};

export const clientsApi = {
  getClients: () => api.get('clients/'),
  getClient: (id: number) => api.get(`clients/${id}/`),
  createClient: (clientData: any) => api.post('clients/', clientData)
};

export const appointmentsApi = {
  getAppointments: () => api.get('appointments/'),
  createAppointment: (appointmentData: any) => api.post('appointments/', appointmentData),
  updateAppointment: (id: number, appointmentData: any) => api.put(`appointments/${id}/`, appointmentData)
};

export default api;