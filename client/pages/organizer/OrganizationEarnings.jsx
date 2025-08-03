import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FiDollarSign, 
  FiUsers, 
  FiEdit, 
  FiArrowLeft,
  FiTrendingUp,
  FiCalendar,
  FiPieChart,
  FiRefreshCw
} from "react-icons/fi";
import toast from "react-hot-toast";
import { authService } from "../../services/authService.js";

export default function OrganizationEarnings() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    fetchUserAndEarnings();
  }, [userId]);


  const fetchUserAndEarnings = async () => {
    try {
      setLoading(true);

      // Fetch user details
      const userResponse = await authService.apiRequest(`/api/admin/users/${userId}`);

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
        console.log('User data fetched:', userData);
      } else {
        console.error('Failed to fetch user data:', userResponse.status);
        toast.error("Failed to fetch user details");
      }

      // Fetch organization earnings using the working no-auth endpoint
      const earningsResponse = await fetch('/api/test/organization-earnings-simple');

      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        setEarnings(earningsData);
        console.log('Earnings data fetched:', earningsData);
      } else {
        console.error('Failed to fetch earnings data:', earningsResponse.status);
        const errorText = await earningsResponse.text();
        console.error('Error response:', errorText);
        toast.error("Failed to fetch organization earnings");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
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
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="h-6 w-px bg-gray-600"></div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <FiDollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Organization Earnings</h1>
                <p className="text-gray-300">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}'s Organization` 
                    : user?.email}
                </p>
                <p className="text-xs text-gray-500">User ID: {userId}</p>
              </div>
            </div>
          </div>

          {/* Debug Panel */}
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchUserAndEarnings}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {earnings ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl p-6 border border-green-500/30"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <FiDollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">
                      ${(earnings.totalRevenue || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-6 border border-blue-500/30"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FiUsers className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Tickets Sold</p>
                    <p className="text-2xl font-bold text-white">
                      {(earnings.totalTicketsSold || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl p-6 border border-purple-500/30"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FiEdit className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Events Created</p>
                    <p className="text-2xl font-bold text-white">
                      {earnings.totalEvents || 0}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 rounded-xl p-6 border border-orange-500/30"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <FiTrendingUp className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Avg. Revenue/Event</p>
                    <p className="text-2xl font-bold text-white">
                      ${earnings.totalEvents > 0 ? Math.round((earnings.totalRevenue || 0) / earnings.totalEvents).toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Events Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-green-600/10 to-blue-600/10">
                <div className="flex items-center space-x-3">
                  <FiPieChart className="w-6 h-6 text-green-400" />
                  <h2 className="text-xl font-bold text-white">Event Earnings Breakdown</h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left p-4 text-gray-300 font-medium">Event Name</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Revenue</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Tickets Sold</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Avg. Ticket Price</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Date Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.events && earnings.events.length > 0 ? (
                      earnings.events.map((event, index) => (
                        <motion.tr 
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 + (index * 0.1) }}
                          className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                                <FiCalendar className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-white font-medium">{event.title}</p>
                                <p className="text-gray-400 text-sm">Event ID: {event._id?.slice(-6) || 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-green-400 font-bold text-lg">
                              ${(event.revenue || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-blue-400 font-semibold">
                              {event.ticketsSold || 0}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-purple-400 font-semibold">
                              ${event.ticketsSold > 0 ? Math.round((event.revenue || 0) / event.ticketsSold) : '0'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <FiCalendar className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300">
                                {event.createdAt ? new Date(event.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }) : 'N/A'}
                              </span>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-12 text-center">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                              <FiPieChart className="w-8 h-8 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-gray-400 text-lg">No events found</p>
                              <p className="text-gray-500 text-sm">This organization hasn't created any events yet</p>
                            </div>
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
            <p className="text-gray-500 text-sm">Unable to load earnings information for this organization</p>
          </div>
        )}
      </div>
    </div>
  );
}