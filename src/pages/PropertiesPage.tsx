import React, { useState, useEffect } from 'react';
import { Building, Search, Filter, Plus, Loader2, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

// Set up axios base URL - Good practice to keep this here
axios.defaults.baseURL = 'http://127.0.0.1:8000';

interface Property {
    id: number;
    name: string;
    price: string;
    location: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    image: string; // Expecting filename (e.g., "property1.jpg") from backend
    description: string;
    features: string[];
    offers: Offer[]; // Add offers property to property interface
    appointments: Appointment[];
}

interface Offer {
    id: number;
    price: number;
    client_id: number;
    client_name: string; //  Include client name in interface
}

interface Appointment {
    id: number;
    property_name: string;
    client: number;
    agent: number;
    date_time: string;
    notes: string;
    client_name: string;
    agent_username: string;
}


const PropertiesPage: React.FC = () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loadingProperties, setLoadingProperties] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                // Use the relative path now that baseURL is set - Correct URL
                const response = await axios.get('/api/properties/random-properties/', {
                    headers: {
                        'Accept': 'application/json' // Explicitly accept JSON - Good practice
                    }
                });

                // Validate response data - Important check
                if (Array.isArray(response.data)) {
                    setProperties(response.data);
                    setError(null); // Clear any previous errors on successful load
                } else {
                    // Handle case where API returns unexpected data format
                    throw new Error('Invalid data format received from API');
                }
            } catch (error: any) { // Use 'any' type for error to handle AxiosError properly
                console.error("Error fetching properties:", error);

                // More detailed error handling using axios.isAxiosError - Robust error handling
                if (axios.isAxiosError(error)) {
                    if (error.response) {
                        // The request was made and the server responded with a status code (e.g., 404, 500)
                        setError(`Server error: ${error.response.status} - ${error.response.data?.message || 'Details unavailable'}`);
                        console.error("Server Response Data:", error.response.data); // Log server response for more info
                    } else if (error.request) {
                        // The request was made but no response was received (e.g., network error, server down)
                        setError('No response received from server. Please check your network and server.');
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        setError(`Error setting up request: ${error.message}`);
                    }
                } else {
                    // Non-Axios error (e.g., error in code)
                    setError(`An unexpected error occurred: ${error.message}`);
                }

                // Set properties to empty array to prevent .map() errors in rendering
                setProperties([]);
            } finally {
                setLoadingProperties(false); // Stop loading indicator in finally block
            }
        };

        fetchProperties();
    }, []); // Empty dependency array - Fetch properties only once on component mount


    const formatDate = (dateTimeString: string): string => {
        const date = new Date(dateTimeString);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        return date.toLocaleDateString(undefined, options);
    };

    const formatTime = (dateTimeString: string): string => {
        const date = new Date(dateTimeString);
        const options: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        };
        return date.toLocaleTimeString(undefined, options);
    };

    const getUniqueAppointments = (appointments: Appointment[]): Appointment[] => {
        const uniqueAppointments: Appointment[] = [];
        const seen = new Set<string>(); // Use a Set to track unique appointments

        for (const appointment of appointments) {
            const key = `${appointment.property_name}-${appointment.client}-${appointment.date_time}`; // Create a unique key
            if (!seen.has(key)) {
                uniqueAppointments.push(appointment);
                seen.add(key);
            }
        }

        return uniqueAppointments;
    };

  // Render error state - User-friendly error display
  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h2 className="text-2xl text-red-600 mb-4">Error Loading Properties</h2>
        <p className="text-gray-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Properties</h1>
          <p className="text-gray-600">Manage your property listings</p>
        </div>
        <button className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors duration-200">
          <Plus size={18} className="mr-2" />
          Add New Property
        </button>
      </header>

      {/* Search and Filter - Unchanged */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white p-4 rounded-lg shadow-md mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search properties..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center transition-colors duration-200">
            <Filter size={18} className="mr-2" />
            Filters
          </button>
        </div>
      </motion.div>

      {/* Properties Grid - Loading and Empty State Handling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingProperties ? (
          <div className="col-span-full flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
          </div>
        ) : properties.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-600">
            No properties found. Please check back later.
          </div>
        ) : (
          properties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                <img
                  src={`${property.image}`} // Correct static image URL - Using filename from backend
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 left-0 bg-blue-600 text-white px-3 py-1 m-2 rounded-md text-sm font-semibold">
                  For Rent
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">{property.name}</h3>
                <p className="text-gray-600 mt-1">{property.location}</p>
                <div className="flex justify-between mt-3">
                  <span className="text-blue-600 font-bold">{property.price}</span>
                  <div className="flex items-center text-gray-600 text-sm">
                    <span className="mr-2">{property.bedrooms} bed</span>
                    <span className="mr-2">{property.bathrooms} bath</span>
                    <span>{property.sqft} sqft</span>
                  </div>
                </div>

                {/* Render Offers */}
                {property.offers && property.offers.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold text-gray-700">Offers:</h4>
                    <ul>
                      {property.offers.map((offer) => (
                        <li key={offer.id} className="text-sm text-gray-600">
                          Offer Price: {offer.price} by {offer.client_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Render Appointments */}
                {property.appointments && property.appointments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold text-gray-700">Appointments:</h4>
                    <ul>
                      {getUniqueAppointments(property.appointments).map((appointment) => (
                        <li key={appointment.id} className="text-sm text-gray-600 flex items-center">
                          <Calendar size={12} className="mr-1" />
                          {formatDate(appointment.date_time)}
                          <Clock size={12} className="ml-2 mr-1" />
                          {formatTime(appointment.date_time)} with {appointment.client_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default PropertiesPage;