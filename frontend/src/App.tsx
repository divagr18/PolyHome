import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { MessageSquare, Menu, X, ChevronRight, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from './pages/ChatInterface';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const location = useLocation();

  const sidebarLinks = [
    { path: '/', icon: <MessageSquare size={20} />, text: 'Chat Assistant' },
  ];

  useEffect(() => {
    const handleResize = () => {
      const desktopCheck = window.innerWidth >= 768;
      setIsDesktop(desktopCheck);
      if (desktopCheck) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    // Use h-screen and overflow-hidden on the root container
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      {/* Mobile menu button - only renders on non-desktop screens */}
      {!isDesktop && (
         <button
           aria-label="Toggle menu" // Added aria-label for accessibility
           className="fixed top-4 left-4 z-20 md:hidden bg-gray-800 text-white p-2 rounded-md"
           onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
         >
           {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      )}


      {/* Sidebar */}
      <AnimatePresence>
        {(mobileMenuOpen || isDesktop) && (
          <motion.div
            key="sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            // Use fixed positioning for mobile overlay, relative for desktop integration
            // Added overflow-y-auto in case sidebar content gets long
            className={`${isDesktop ? 'relative' : 'fixed inset-y-0 left-0'} z-10 bg-gray-900 text-white w-64 md:w-72 shadow-lg flex flex-col flex-shrink-0 overflow-y-auto`}
          >
            <div className="p-6 border-b border-gray-800 flex-shrink-0"> {/* Prevent header shrink */}
              <h1 className="text-2xl font-bold flex items-center">
                <Home className="mr-2" size={24} />
                <span>Real Estate Chat</span>
              </h1>
            </div>

            {/* Added overflow-y-auto here too, more specific than on parent */}
            <nav className="mt-6 flex-grow overflow-y-auto">
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

            <div className="w-full p-6 border-t border-gray-800 mt-auto flex-shrink-0"> {/* Prevent footer shrink */}
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  DA
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">Divyansh Agrawal</p>
                  <p className="text-xs text-gray-400">Real Estate Chatbot</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {/* Apply top padding only on mobile screens (when !isDesktop) */}
      {/* Ensure overflow-y-auto allows internal scrolling */}
      <div className={`flex-1 overflow-y-auto ${!isDesktop ? 'pt-20 p-4' : 'p-6'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full" // Ensure it takes up space
          >
            <Routes>
              <Route path="/" element={<ChatInterface />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;