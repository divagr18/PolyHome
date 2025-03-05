import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Home, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:8000';

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

const AppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
    const [newAppointment, setNewAppointment] = useState({
        property_name: '',
        client: 1, // Replace with dynamic options
        agent: 1, // Agent is always 1, set default value
        date_time: '',
        notes: '',
    });


    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                setLoading(true);
                const response = await axios.get<Appointment[]>('/api/appointments/');
                console.log("Fetched Appointments:", response.data); // Log the fetched data
                setAppointments(response.data);
                setError(null);
            } catch (error: any) {
                console.error("Error fetching appointments:", error);
                setError("Failed to load appointments. Please try again.");
                setAppointments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const handlePrevMonth = () => {
        setSelectedDate((prevDate) => {
            const newDate = new Date(prevDate);
            newDate.setMonth(prevDate.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setSelectedDate((prevDate) => {
            const newDate = new Date(prevDate);
            newDate.setMonth(prevDate.getMonth() + 1);
            return newDate;
        });
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

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

    const isSameDate = (date1: Date, date2: Date): boolean => {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    };
    const getUniqueAppointments = (appointments: Appointment[]): Appointment[] => {
        const uniqueAppointments: Appointment[] = [];
        const seen = new Set<string>(); // Use a Set to track unique appointments

        for (const appointment of appointments) {
            const key = `${appointment.property_name}-${appointment.client}-${formatDate(appointment.date_time)}`; // Create a unique key by combining property name, client, and date
            if (!seen.has(key)) {
                uniqueAppointments.push(appointment);
                seen.add(key);
            }
        }

        return uniqueAppointments;
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(selectedDate);
        const firstDayOfMonth = getFirstDayOfMonth(selectedDate);
        const paddingDays = firstDayOfMonth;
        const totalDays = paddingDays + daysInMonth;

        const calendarDays = [];

        for (let i = 0; i < paddingDays; i++) {
            calendarDays.push(<div key={`padding-${i}`} className="bg-white p-2 min-h-[100px] border-t" />);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);

            const appointmentsOnDay = getUniqueAppointments(appointments).filter((appt) => {
                const apptDate = new Date(appt.date_time);
                return isSameDate(apptDate, currentDate);
            });

            calendarDays.push(
                <div
                    key={day}
                    className={`bg-white p-2 min-h-[100px] border-t ${appointmentsOnDay.length > 0 ? 'bg-blue-50' : ''}`}
                >
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-medium text-gray-700`}>{day}</span>
                        {appointmentsOnDay.length > 0 && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    {appointmentsOnDay.map((appt) => (
                        <div
                            key={appt.id}
                            className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800 border-l-2 border-blue-500"
                        >
                            <div className="font-medium">{appt.property_name}</div>
                            <div className="flex items-center mt-1">
                                <Clock size={12} className="mr-1" />
                                <span>{formatTime(appt.date_time)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // Add trailing padding days
        const trailingPaddingDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
        for (let i = 0; i < trailingPaddingDays; i++) {
            calendarDays.push(<div key={`trailing-${i}`} className="bg-white p-2 min-h-[100px] border-t" />);
        }

        return calendarDays;
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setNewAppointment({
            ...newAppointment,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true); // Start loading during API call
            setError(null); // Clear previous errors
            await axios.post('/api/appointments/', newAppointment);

            // Refresh appointments after successful creation
            const response = await axios.get<Appointment[]>('/api/appointments/');
            setAppointments(response.data);

            // Reset form and close modal
            setNewAppointment({
                property_name: '',
                client: 1, // Reset to default value or null
                agent: 1, // Agent is always 1, set default value
                date_time: '',
                notes: '',
            });
            handleCloseModal();
        } catch (error: any) {
            console.error("Error creating appointment:", error);
            setError("Failed to create appointment. Please try again.");
        } finally {
            setLoading(false); // End loading
        }
    };


    const upcomingAppointments = appointments.map(appointment => ({
        ...appointment,
        date: formatDate(new Date(appointment.date_time)),
        time: formatTime(appointment.date_time),
        type: 'viewing', // or 'meeting', 'signing' depending on your needs
    }));

    return (
        <div className="container mx-auto">
            <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
                    <p className="text-gray-600">Manage your schedule and property viewings</p>
                </div>
                <button
                    className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors duration-200"
                    onClick={handleOpenModal} // Open the modal
                >
                    <Plus size={18} className="mr-2" />
                    Schedule Appointment
                </button>
            </header>

            {/* Calendar Navigation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between"
            >
                <button className="p-2 rounded-md hover:bg-gray-100" onClick={handlePrevMonth}>
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-lg font-semibold">
                    {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button className="p-2 rounded-md hover:bg-gray-100" onClick={handleNextMonth}>
                    <ChevronRight size={20} />
                </button>
            </motion.div>

            {/* Calendar Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-lg shadow-md overflow-hidden mb-6"
            >
                <div className="grid grid-cols-7 gap-px bg-gray-200">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="bg-gray-50 p-4 text-center font-medium text-gray-700">
                            {day}
                        </div>
                    ))}
                    {renderCalendarDays()}
                </div>
            </motion.div>

            {/* Upcoming Appointments */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
            >
                <div className="p-4 bg-gray-50 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Upcoming Appointments</h3>
                </div>
                {loading && <div className="p-4 text-gray-600">Loading appointments...</div>}
                {error && <div className="p-4 text-red-500">{error}</div>}
                {!loading && !error && (
                    <div className="divide-y divide-gray-200">
                        {upcomingAppointments.map((appointment, index) => (
                            <div key={index} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start">
                                    <div className={`p-3 rounded-full mr-4 ${
                                        appointment.type === 'viewing' ? 'bg-blue-100 text-blue-600' :
                                            appointment.type === 'meeting' ? 'bg-green-100 text-green-600' :
                                                'bg-purple-100 text-purple-600'
                                    }`}>
                                        {appointment.type === 'viewing' ? <Home size={20} /> :
                                            appointment.type === 'meeting' ? <Users size={20} /> :
                                                <Calendar size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-lg font-medium text-gray-800">{appointment.property_name}</h4>
                                        <p className="text-gray-600">Client: {appointment.client_name}</p>
                                        <div className="flex items-center mt-2 text-sm text-gray-500">
                                            <Calendar size={16} className="mr-1" />
                                            <span className="mr-3">{appointment.date}</span>
                                            <Clock size={16} className="mr-1" />
                                            <span>{appointment.time}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                            Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>


            {/* Appointment Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Schedule New Appointment</h3>
                            <div className="mt-2">
                                {/* Appointment Form */}
                                <form onSubmit={handleSubmit} className="mt-4">
                                    <div className="mb-4">
                                        <label htmlFor="property_name" className="block text-gray-700 text-sm font-bold mb-2">Property Name:</label>
                                        <input
                                            type="text"
                                            id="property_name"
                                            name="property_name"
                                            value={newAppointment.property_name}
                                            onChange={handleInputChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="client" className="block text-gray-700 text-sm font-bold mb-2">Client ID:</label>
                                        <select
                                            id="client"
                                            name="client"
                                            value={newAppointment.client}
                                            onChange={handleInputChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        >
                                            {/* Replace with a dynamic list of clients from your API */}
                                            <option value={1}>Client 1</option>
                                            <option value={2}>Client 2</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="date_time" className="block text-gray-700 text-sm font-bold mb-2">Date/Time:</label>
                                        <input
                                            type="datetime-local"
                                            id="date_time"
                                            name="date_time"
                                            value={newAppointment.date_time}
                                            onChange={handleInputChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">Notes:</label>
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            value={newAppointment.notes}
                                            onChange={handleInputChange}
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>
                                    <div className="flex justify-between">
                                        <button
                                            type="submit"
                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                        >
                                            Create Appointment
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentsPage;