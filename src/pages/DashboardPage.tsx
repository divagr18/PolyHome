import React from 'react';
import { BarChart, Users, Home, Calendar, DollarSign, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardPage: React.FC = () => {
  return (
    <div className="container mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's an overview of your real estate business</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Active Listings', value: '6', icon: <Home />, color: 'blue' },
          { title: 'Active Clients', value: '5', icon: <Users />, color: 'green' },
          { title: 'Appointments', value: '7', icon: <Calendar />, color: 'purple' },
          { title: 'Conversations', value: '5', icon: <DollarSign />, color: 'amber' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-${stat.color}-500`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-500`}>
                {stat.icon}
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpRight className="text-green-500 mr-1" size={16} />
              <span className="text-green-500 font-medium">12%</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts and Tables */}


      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="bg-white p-6 rounded-lg shadow-md mb-8"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { activity: 'Property Viewing', client: 'Sarah Johnson', property: 'Riverside Apartments', date: 'Today, 2:30 PM', status: 'Scheduled' },
                { activity: 'Offer Submitted', client: 'Michael Chen', property: 'The Parkview', date: 'Yesterday', status: 'Pending' },
                { activity: 'Contract Signed', client: 'Emily Rodriguez', property: 'Urban Lofts', date: '2 days ago', status: 'Completed' },
                { activity: 'New Inquiry', client: 'David Wilson', property: 'Harbor Heights', date: '3 days ago', status: 'New' }
              ].map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.activity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.client}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.property}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${item.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                        item.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        item.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : 
                        'bg-purple-100 text-purple-800'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;