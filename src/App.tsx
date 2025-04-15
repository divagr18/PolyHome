import React, { useState } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
// Updated Icon imports - removed unused ones
import { MessageSquare, Settings, Menu, X, ChevronRight, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Import the main chat interface page (will be created)
import ChatInterface from './pages/ChatInterface';
import SettingsPage from './pages/SettingsPage';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const sidebarLinks = [
    { path: '/', icon: <MessageSquare size={20} />, text: 'Chat Assistant' }, // Link to the main chat
    { path: '/settings', icon: <Settings size={20} />, text: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu button */}
      <button 
        className="fixed top-4 left-4 z-20 md:hidden bg-gray-800 text-white p-2 rounded-md"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {(mobileMenuOpen || window.innerWidth >= 768) && (
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
            className={`fixed inset-y-0 left-0 md:relative z-10 bg-gray-900 text-white w-64 md:w-72 shadow-lg`}
          >
            <div className="p-6 border-b border-gray-800">
              <h1 className="text-2xl font-bold flex items-center">
                <Home className="mr-2" size={24} />
                <span>RealEstate Pro</span>
              </h1>
            </div>
            
            <nav className="mt-6">
              {sidebarLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-6 py-4 cursor-pointer transition-colors duration-200 ${
                    location.pathname === link.path 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="mr-3">{link.icon}</div>
                  <span>{link.text}</span>
                  {location.pathname === link.path && (
                    <ChevronRight className="ml-auto" size={16} />
                  )}
                </Link>
              ))}
            </nav>
            
            <div className="absolute bottom-0 w-full p-6 border-t border-gray-800">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  DA
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">Divyansh Agrawal</p>
                  <p className="text-xs text-gray-400">Real Estate Agent</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-6 w-full"
          >
            <Routes>
            <Route path="/" element={<ChatInterface />} />
            <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
    
  );

}

export default App;