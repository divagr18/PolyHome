import React from 'react';
import { Settings, User, Bell, Lock, Globe, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const SettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </header>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Settings Navigation */}
          <div className="md:w-1/4 bg-gray-50 p-4 md:p-6 border-r border-gray-200">
            <nav>
              {[
                { icon: <User size={18} />, text: 'Profile' },
                { icon: <Bell size={18} />, text: 'Notifications' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`flex items-center px-4 py-3 rounded-md cursor-pointer mb-1 ${
                    index === 0 ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="mr-3">{item.icon}</div>
                  <span className="font-medium">{item.text}</span>
                </motion.div>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="md:w-3/4 p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Profile Settings</h2>
              
              <div className="mb-8">
                <div className="flex items-center">
                  <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold">
                    JD
                  </div>
                  <div className="ml-6">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200">
                      Change Photo
                    </button>
                    <button className="ml-3 text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md text-sm transition-colors duration-200">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    defaultValue="John"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    defaultValue="Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    defaultValue="john.doe@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    defaultValue="(555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  rows={4}
                  defaultValue="Real estate agent with 5+ years of experience in residential properties."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Django Backend API URL</label>
                <input
                  type="url"
                  defaultValue="http://localhost:8000/api/"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">Enter the URL of your Django backend API</p>
              </div>
              
              <div className="border-t border-gray-200 pt-6 flex justify-end">
                <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-3 transition-colors duration-200">
                  Cancel
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors duration-200">
                  <Save size={18} className="mr-2" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;