
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiDollarSign, 
  FiUsers, 
  FiEdit, 
  FiArrowLeft,
  FiCalendar,
  FiTrendingUp,
  FiBarChart,
  FiDownload
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function OrganizationEarnings() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarningsData();
  }, [userId]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      
      // Fetch user details
      const userResponse = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
        
        // Only fetch earnings if user is an organizer
        if (userData.role === 'organizer') {
          const earningsResponse = await fetch(`/api/admin/organizations/${userId}/earnings`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (earningsResponse.ok) {
            const earningsData = await earningsResponse.json();
            setEarnings(earningsData);
          } else {
            toast.error("Failed to fetch earnings data");
          }
        } else {
          toast.error("This user is not an organization");
          navigate(-1);
        }
      } else {
        toast.error("Failed to fetch user details");
        navigate(-1);
      }
    } catch (error) {
      console.error("Error fetching earnings data:", error);
      toast.error("Failed to fetch earnings data");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!user || user.role !== 'organizer') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-6">This user is not an organization.</p>
          <button
            onClick={handleGoBack}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGoBack}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Organization Earnings</h1>
              <p className="text-gray-400 text-sm">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}'s Organization` 
                  : user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <FiDownload className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </header>

      <div className="px-8 py-6">
        {earnings ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl p-6 border border-green-500/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <FiDollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">
                      ${(earnings.totalRevenue || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-6 border border-blue-500/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FiUsers className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Tickets Sold</p>
                    <p className="text-2xl font-bold text-white">
                      {(earnings.totalTicketsSold || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl p-6 border border-purple-500/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FiEdit className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Total Events</p>
                    <p className="text-2xl font-bold text-white">
                      {earnings.totalEvents || 0}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 rounded-xl p-6 border border-orange-500/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <FiTrendingUp className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Avg. Revenue/Event</p>
                    <p className="text-2xl font-bold text-white">
                      ${earnings.totalEvents > 0 ? Math.round((earnings.totalRevenue || 0) / earnings.totalEvents).toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Organization Details */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Organization Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Organization Name</p>
                    <p className="text-white font-medium">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}'s Organization` 
                        : 'Unnamed Organization'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Contact Email</p>
                    <p className="text-white font-medium">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400">Member Since</p>
                    <p className="text-white font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      user?.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {user?.status || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Events Earnings Table */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Event Earnings Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left p-4 text-gray-300 font-medium">Event Name</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Revenue</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Tickets Sold</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Created Date</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.events && earnings.events.length > 0 ? (
                      earnings.events.map((event, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-t border-gray-700 hover:bg-gray-700/30"
                        >
                          <td className="p-4">
                            <div>
                              <p className="text-white font-medium">{event.title}</p>
                              <p className="text-gray-400 text-sm">{event.category || 'General'}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-green-400 font-semibold text-lg">
                              ${(event.revenue || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4 text-gray-300">
                            {event.ticketsSold || 0}
                          </td>
                          <td className="p-4 text-gray-400">
                            {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              event.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                              event.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }`}>
                              {event.status || 'Draft'}
                            </span>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-400">
                          No events found for this organization
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FiBarChart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Earnings Data Available</h3>
              <p className="text-gray-400">This organization hasn't generated any revenue yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
