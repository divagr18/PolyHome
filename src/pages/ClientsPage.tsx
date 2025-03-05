import React, { useState } from 'react';
import { Users, Search, Plus, MessageSquare, Phone, Calendar, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'lead';
  lastContact: string;
  avatar?: string;
  unreadMessages?: number;
}

const ClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en'); // Default language is English


  // Mock clients data - using IDs starting from 2
  const clients: Client[] = [
    {
      "id": 2,
      "name": "Sarah Joshi",
      "email": "sarah.joshi@example.in",
      "phone": "+91 98765 43210",
      "status": "active",
      "lastContact": "Today",
      
  },
  {
      "id": 3,
      "name": "Mihir Chawla",
      "email": "mihir.chawla@example.in",
      "phone": "+91 87654 32109",
      "status": "active",
      "lastContact": "Yesterday"
  },
  {
      "id": 4,
      "name": "Esha Reddy",
      "email": "esha.reddy@example.in",
      "phone": "+91 76543 21098",
      "status": "active",
      "lastContact": "2 days ago",
      
  },
  {
      "id": 5,
      "name": "Deepak Verma",
      "email": "deepak.verma@example.in",
      "phone": "+91 65432 10987",
      "status": "lead",
      "lastContact": "3 days ago"
  },
  {
      "id": 6,
      "name": "Juhi Bansal",
      "email": "juhi.bansal@example.in",
      "phone": "+91 54321 09876",
      "status": "inactive",
      "lastContact": "1 week ago"
  }
  ];

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClientClick = (clientId: number) => {
    navigate(`/clients/${clientId}`);
  };

    const handleLanguageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPreferredLanguage(e.target.value);
    };

    const handleChatClick = (clientId: number) => {
        navigate(`/chat/${clientId}?language=${preferredLanguage}`); // Navigate to ChatPage with language
    }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'lead':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
          <p className="text-gray-600">Manage your client relationships and communications</p>
        </div>
        
      </header>

      {/* Search */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-4 rounded-lg shadow-md mb-6"
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

          {/* Language Selection Textbox */}
          <div className="mt-4">
              <label htmlFor="language" className="block text-gray-700 text-sm font-bold mb-2">Preferred Language Code:</label>
              <input
                  type="text"
                  id="language"
                  onChange={handleLanguageChange}
                  value={preferredLanguage}
                  placeholder="Enter language code (e.g., en, fr, es)"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
          </div>
      </motion.div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => handleClientClick(client.id)}
          >
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl font-bold">
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">{client.name}</h3>
                    {client.unreadMessages && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {client.unreadMessages}
                      </span>
                    )}
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(client.status)}`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                  <div className="mt-3 text-sm text-gray-600">
                    <div className="flex items-center mb-1">
                      <MessageSquare size={14} className="mr-2" />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone size={14} className="mr-2" />
                      <span>{client.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  <span>Last contact: {client.lastContact}</span>
                </div>
                <div className="flex space-x-2">
                  <button 
                    className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the outer div's onClick from firing
                      handleChatClick(client.id);
                    }}
                  >
                    <MessageSquare size={16} />
                  </button>
                  <button className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors duration-200">
                    <Phone size={16} />
                  </button>
                  <button className="p-2 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors duration-200">
                    <Calendar size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ClientsPage;