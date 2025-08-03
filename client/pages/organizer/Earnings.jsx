
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiDollarSign, 
  FiUsers, 
  FiCalendar, 
  FiTrendingUp,
  FiRefreshCw,
  FiBarChart,
  FiEye
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function Earnings() {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/organizer/earnings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const earningsData = await response.json();
        setEarnings(earningsData);
        console.log('Earnings data fetched:', earningsData);
      } else {
        console.error('Failed to fetch earnings data:', response.status);
        toast.error("Failed to fetch earnings data");
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
      toast.error("Failed to fetch earnings data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-400">Loading earnings data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <FiDollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Earnings Overview</h1>
              <p className="text-gray-300">Track your revenue and event performance</p>
            </div>
          </div>
          
          <button
            onClick={fetchEarnings}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      <div className="px-8 py-6">
        {earnings ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 border border-gray-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <FiDollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <FiTrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  ${earnings.totalRevenue?.toFixed(2) || '0.00'}
                </h3>
                <p className="text-gray-400 text-sm">Total Revenue</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-900 border border-gray-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FiUsers className="w-5 h-5 text-blue-400" />
                  </div>
                  <FiBarChart className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {earnings.totalTicketsSold || 0}
                </h3>
                <p className="text-gray-400 text-sm">Tickets Sold</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-900 border border-gray-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FiCalendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <FiEye className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {earnings.totalBookings || 0}
                </h3>
                <p className="text-gray-400 text-sm">Total Bookings</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900 border border-gray-700 rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <FiCalendar className="w-5 h-5 text-orange-400" />
                  </div>
                  <FiBarChart className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {earnings.totalEvents || 0}
                </h3>
                <p className="text-gray-400 text-sm">Active Events</p>
              </motion.div>
            </div>

            {/* Event Performance Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6">Event Performance</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-sm border-b border-gray-700">
                      <th className="text-left py-3 px-4">Event Title</th>
                      <th className="text-left py-3 px-4">Revenue</th>
                      <th className="text-left py-3 px-4">Tickets Sold</th>
                      <th className="text-left py-3 px-4">Bookings</th>
                      <th className="text-left py-3 px-4">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.events && earnings.events.length > 0 ? (
                      earnings.events.map((event, index) => (
                        <motion.tr
                          key={event._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="font-medium text-white">{event.title}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-green-400 font-semibold">
                              ${event.revenue?.toFixed(2) || '0.00'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-blue-400 font-medium">
                              {event.ticketsSold || 0}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-purple-400 font-medium">
                              {event.bookingsCount || 0}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-400 text-sm">
                              {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-8">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                              <FiBarChart className="w-8 h-8 text-gray-500" />
                            </div>
                            <p className="text-gray-400 text-lg">No events found</p>
                            <p className="text-gray-500 text-sm">Create your first event to start tracking earnings</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FiDollarSign className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg">No earnings data available</p>
            <p className="text-gray-500 text-sm">Unable to load earnings information</p>
          </div>
        )}
      </div>
    </div>
  );
}
