// src/components/ChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  BookOpen,
  ExternalLink,
  Home,
  DollarSign,
  MapPin,
  Users,
  Calendar,
} from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useParams, useSearchParams } from 'react-router-dom';

interface Message {
  id?: number;
  sender: number;
  recipient: number;
  text: string;
  timestamp: string;
  sender_name: string;
  recipient_name: string;
  translated_message: string;
}

interface Property {
  id: number;
  name: string;
  price: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  image: string;
  description: string;
  features: string[];
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendedProperties, setRecommendedProperties] = useState<Property[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_BASE_URL = 'http://127.0.0.1:8000/api/'; // Replace with your actual API base URL
  const { clientId: clientIdParam } = useParams(); // Get clientId from URL path
  const [searchParams, setSearchParams] = useSearchParams(); // Get query params
  const [preferredLanguage, setPreferredLanguage] = useState('en'); // Default language is English
  const clientId = clientIdParam ? parseInt(clientIdParam, 10) : null; // Safely check for client ID

  useEffect(() => {
    // Set preferred language from query parameter if available
    const languageFromURL = searchParams.get('language');
    if (languageFromURL) {
      setPreferredLanguage(languageFromURL);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchMessagesAndProperties = async () => {
      if (!clientId) return; // Wait for client ID to be available

      try {
        setLoading(true);
        // Fetch chat history with language parameter
        const messagesResponse = await axios.get<Message[]>(
          `${API_BASE_URL}agent-client-chat-history/?client_id=${clientId}&language=${preferredLanguage}`
        );
        setMessages(messagesResponse.data);

        // Fetch recommended properties (replace with your logic)
        // const propertiesResponse = await axios.get(`${API_BASE_URL}properties/?client_id=${clientId}`);
        // setRecommendedProperties(propertiesResponse.data);
      } catch (error: any) {
        console.error('Error fetching data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessagesAndProperties();
  }, [clientId, preferredLanguage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    setLoading(true);
    try {
      // Send the message to the backend
      const response = await axios.post(`${API_BASE_URL}chats/`, {
        recipient: clientId, // Client ID is the recipient
        message: inputMessage,
        sender: 1, // Agent ID is 1
      });

      // Add the new message to the state
      setMessages(prevMessages => [...prevMessages, response.data]);
      setInputMessage(''); // Clear the input
    } catch (error: any) {
      console.error('Error sending message:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const extractKeyPoints = () => {
    // In a real app, these would be processed by the backend with NLP
    return [
      'Client is looking for a 2-bedroom apartment',
      'Desired location is near good schools',
      'Budget is around $2,000 per month',
      'Interested in downtown area',
      'Wants parking space',
      'Timeline: Move-in within 2 months',
    ];
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferredLanguage(e.target.value);
    setSearchParams({ language: e.target.value }); // Update URL
  };

  return (
    <div className="container mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Client Communication</h1>
        <p className="text-gray-600">
          Manage your client conversations and property recommendations
        </p>
      </header>

      {/* Language Selection */}
      <div className="mb-4">
        <label htmlFor="language" className="block text-gray-700 text-sm font-bold mb-2">
          Preferred Language Code (e.g., en, fr, es):
        </label>
        <input
          type="text"
          id="language"
          onChange={handleLanguageChange}
          value={preferredLanguage}
          placeholder="Enter language code"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Chat Interface */}
        <div className="flex-1 lg:w-2/3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white flex items-center">
              <MessageSquare className="mr-2" size={20} />
              <h2 className="text-xl font-semibold">Chat with Client</h2>
              <div className="ml-auto flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                <span className="text-sm">Online</span>
              </div>
            </div>

            {/* Chat Messages */}
            <div id="message-display-area" className="p-4 h-[400px] overflow-y-auto bg-gray-50">
              {messages.map((message, index) => (
                <div key={index} className={`mb-4 ${message.sender === 1 ? 'text-right' : ''}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`rounded-lg p-3 inline-block max-w-[80%] text-left shadow-sm ${
                      message.sender === 1
                        ? 'bg-blue-100 border-l-4 border-blue-500'
                        : 'bg-white border-l-4 border-gray-300'
                    }`}
                  >
                    <p className="text-gray-800">
                      {message.translated_message ? message.translated_message : message.text}
                    </p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {message.sender === 1 ? 'You' : 'Client'} - {message.timestamp}
                    </span>
                  </motion.div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex">
                <input
                  id="message-input"
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  id="send-button"
                  onClick={handleSendMessage}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-r-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center disabled:opacity-50"
                >
                  <span className="mr-2">Send</span>
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Notebook & Property Details */}
        <div className="lg:w-1/3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden mb-6"
          >
            <div className="p-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white flex items-center">
              <BookOpen className="mr-2" size={20} />
              <h2 className="text-xl font-semibold">Conversation Notebook</h2>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Key Points</h3>
              <ul id="notebook-bullet-points" className="list-disc pl-5 space-y-2">
                {extractKeyPoints().map((point, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                    className="text-gray-700"
                  >
                    {point}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-green-600 to-green-800 text-white flex items-center">
              <Home className="mr-2" size={20} />
              <h2 className="text-xl font-semibold">Recommended Properties</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {recommendedProperties.map((property) => (
                  <motion.div
                    key={property.id}
                    whileHover={{ y: -5 }}
                    className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="relative h-40 mb-3 overflow-hidden rounded-lg">
                      <img
                        src={property.image}
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md text-sm font-semibold">
                        {property.price}
                      </div>
                    </div>
                    <h4 className="font-bold text-lg text-gray-800">{property.name}</h4>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin size={16} className="mr-1" />
                      <p className="text-sm">{property.location}</p>
                    </div>
                    <div className="flex justify-between mt-3 text-sm">
                      <div className="flex items-center">
                        <span className="font-semibold">{property.bedrooms}</span>
                        <span className="mx-1">bed</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold">{property.bathrooms}</span>
                        <span className="mx-1">bath</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold">{property.sqft}</span>
                        <span className="mx-1">sqft</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">{property.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {property.features.slice(0, 3).map((feature, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                      {property.features.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                          +{property.features.length - 3} more
                        </span>
                      )}
                    </div>
                    <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md flex items-center justify-center transition-colors duration-200">
                      <span className="mr-2">View Details</span>
                      <ExternalLink size={16} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
