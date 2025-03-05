import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, BookOpen, ExternalLink, Home, DollarSign, MapPin, Users, Calendar, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

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

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: 'active' | 'inactive' | 'lead';
}

interface BuyerInfo {
    buyer?: {
        first_name?: string | null;
        last_name?: string | null;
        phone?: string | null;
        email?: string | null;
        desired_location?: string | null;
        property_type?: string | null;
        bedrooms?: number | null;
        budget?: number | null;
        special_notes?: string | null;
    }[] | null;
    key_points?: string[] | null;
}

const ClientChatPage: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // Get query parameters
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false); // NEW: Loading state for initial messages
    const [client, setClient] = useState<Client | null>(null);
    const [recommendedProperties, setRecommendedProperties] = useState<Property[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const API_BASE_URL = 'http://127.0.0.1:8000/api/';

    // Extract language from URL
    const preferredLanguage = searchParams.get('language') || "en"; // Default to English

    const [buyerInformation, setBuyerInformation] = useState<BuyerInfo>({});

    // Mock clients data - in a real app, this would come from the Django backend
    const mockClients: Record<string, Client> = {
        '2': {
            id: 2,
            name: "Sarah Joshi",
            email: "sarah.joshi@example.in",
            phone: "+91 98765 43210",
            status: "active"
        },
        '3': {
            id: 3,
            name: "Mihir Chawla",
            email: "mihir.chawla@example.in",
            phone: "+91 87654 32109",
            status: "active"
        },
        '4': {
            id: 4,
            name: "Esha Reddy",
            email: "esha.reddy@example.in",
            phone: "+91 76543 21098",
            status: "active"
        },
        '5': {
            id: 5,
            name: "Deepak Verma",
            email: "deepak.verma@example.in",
            phone: "+91 65432 10987",
            status: "lead"
        },
        '6': {
            id: 6,
            name: "Juhi Bansal",
            email: "juhi.bansal@example.in",
            phone: "+91 54321 09876",
            status: "inactive"
        }
    };



    // Mock properties - in a real app, these would come from Django backend
    const mockProperties: Record<string, Property[]> = {
        '2': [
            {
                id: 1,
                name: "Riverside Apartments",
                price: "$1,950/mo",
                location: "123 River St, Downtown",
                bedrooms: 2,
                bathrooms: 2,
                sqft: 1200,
                image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
                description: "Modern apartment with river views, walking distance to Lincoln Elementary School.",
                features: ["In-unit laundry", "Fitness center", "Pet friendly", "Balcony"]
            },
            {
                id: 2,
                name: "The Parkview",
                price: "$2,100/mo",
                location: "456 Park Ave, Downtown",
                bedrooms: 2,
                bathrooms: 2,
                sqft: 1100,
                image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
                description: "Luxury apartment with modern amenities, near Central Park and top-rated schools.",
                features: ["Rooftop terrace", "Concierge", "Smart home features", "Walk-in closets"]
            },
            {
                id: 3,
                name: "Urban Lofts",
                price: "$1,875/mo",
                location: "789 Main St, Downtown",
                bedrooms: 2,
                bathrooms: 1,
                sqft: 950,
                image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
                description: "Industrial-style loft with high ceilings, 0.3 miles from Washington Elementary.",
                features: ["Exposed brick", "Stainless appliances", "Hardwood floors", "Large windows"]
            }
        ],
        '3': [
            {
                id: 4,
                name: "Skyline Towers",
                price: "$3,500/mo",
                location: "100 Skyline Blvd, Downtown",
                bedrooms: 2,
                bathrooms: 2,
                sqft: 1500,
                image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
                description: "Luxury high-rise with panoramic city views and premium finishes.",
                features: ["Floor-to-ceiling windows", "Private balcony", "24/7 concierge", "Spa and fitness center"]
            }
        ],
        '4': [
            {
                id: 5,
                name: "Willow Creek Estates",
                price: "$2,800/mo",
                location: "250 Willow Dr, Suburbs",
                bedrooms: 3,
                bathrooms: 2.5,
                sqft: 2200,
                image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80",
                description: "Spacious family home with large backyard and modern amenities.",
                features: ["Fenced yard", "Attached garage", "Updated kitchen", "Finished basement"]
            }
        ]
    };

    useEffect(() => {
        const fetchClientAndMessages = async () => {
            if (clientId) {
                setLoadingMessages(true); // START LOADING ANIMATION
                try {
                    // Fetch client data from mock data
                    setClient(mockClients[clientId]);

                    // Fetch combined chat history AND buyer info AND key_points from AgentClientChatHistoryView
                    const chatHistoryResponse = await axios.get(`${API_BASE_URL}agent-client-chat-history/?client_id=${clientId}&language=${preferredLanguage}`);

                    console.log("Combined API Response Data:", chatHistoryResponse.data);

                    setMessages(chatHistoryResponse.data.chat_history);
                    setBuyerInformation(chatHistoryResponse.data.buyer_info);
                    setBuyerInformation(prevInfo => ({ // Update buyerInformation to include key_points
                        ...prevInfo,
                        key_points: chatHistoryResponse.data.key_points || [] // Ensure key_points is always an array
                    }));
                    console.log("Buyer Information State after update:", buyerInformation);

                    // Fetch recommended properties from mock data (remains the same)
                    setRecommendedProperties(mockProperties[clientId] || []);


                } catch (error: any) {
                    console.error('Error fetching data:', error.message);
                } finally {
                    setLoadingMessages(false); // STOP LOADING ANIMATION
                }
            }
        };

        fetchClientAndMessages();


    }, [clientId, preferredLanguage]); // RE-FETCH WHEN clientId OR preferredLanguage changes


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
            // Send the message to the backend (still using POST to /api/chats/)
            const response = await axios.post(`${API_BASE_URL}chats/`, {
                recipient: Number(clientId), // Client ID is the recipient
                message: inputMessage,
                sender: 1 //Agent ID is 1
            });

            // After sending a new message, re-fetch the *combined* chat history, buyer info, and key points
            const chatHistoryResponse = await axios.get(`${API_BASE_URL}agent-client-chat-history/?client_id=${clientId}&language=${preferredLanguage}`);

            console.log("Combined API Response Data (after send):", chatHistoryResponse.data);

            setMessages(chatHistoryResponse.data.chat_history);
            setBuyerInformation(chatHistoryResponse.data.buyer_info);
            setBuyerInformation(prevInfo => ({ // Update buyerInformation to include key_points
                ...prevInfo,
                key_points: chatHistoryResponse.data.key_points || [] // Ensure key_points is always an array
            }));
            console.log("Buyer Information State after update (after send):", buyerInformation);


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
        const keyPoints = buyerInformation.key_points || [];
        console.log("Key Points being returned by extractKeyPoints:", keyPoints);
        return keyPoints;
    };


    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };


    if (!client) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto">
            <header className="mb-6 flex items-center">
                <button
                    onClick={() => navigate('/clients')}
                    className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Chat with {client.name}</h1>
                    <p className="text-gray-600">Client ID: {client.id} • {client.status.charAt(0).toUpperCase() + client.status.slice(1)}</p>
                    <p className="text-gray-600">Preferred Language: {preferredLanguage}</p> {/* Display the language */}
                </div>
            </header>

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

                        {/* Chat Messages Area */}
                        <div
                            id="message-display-area"
                            className="p-4 h-[400px] overflow-y-auto bg-gray-50 relative" // ADD relative positioning
                        >
                            {loadingMessages && ( // Conditional rendering for loading animation
                                <div className="absolute top-0 left-0 w-full h-full bg-gray-50 opacity-75 flex justify-center items-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                </div>
                            )}
                            {!loadingMessages && messages.map((message, index) => ( // Render messages only when not loading
                                <div
                                    key={index}
                                    className={`mb-4 ${message.sender === 1 ? 'text-right' : ''}`}
                                >
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
                                        <p className="text-gray-800">{message.translated_message}</p>
                                        <span className="text-xs text-gray-500 mt-1 block">
                                            {message.sender === 1 ? message.sender_name : message.sender_name} - {formatTime(message.timestamp)}
                                        </span>
                                    </motion.div>
                                </div>
                            ))}
                            {!loadingMessages && <div ref={messagesEndRef} />} {/* Scroll to bottom div, only when not loading */}
                        </div>

                        {/* Message Input Area */}
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

                {/* Right Column: Conversation Notebook & Property Details */}
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
                                {extractKeyPoints().map((point, index) => ( // extractKeyPoints function is unchanged
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.1 }}
                                        className="text-gray-700"
                                    >
                                        {point}
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>

                    {/* Property Recommendations */}
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
                                                <span key={index} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                                    {feature}
                                                </span>
                                            ))}

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

export default ClientChatPage;