import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiUsers, 
  FiCalendar, 
  FiDollarSign, 
  FiTrendingUp,
  FiActivity,
  FiBarChart,
  FiClock,
  FiMapPin
} from "react-icons/fi";

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalRevenue: 0,
    activeEvents: 0,
    totalAttendees: 0,
    monthlyGrowth: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      // Fetch overview data from admin API
      const overviewResponse = await fetch("/api/admin/overview");
      const overviewData = await overviewResponse.json();
      
      // Fetch recent activities
      const activitiesResponse = await fetch("/api/admin/activities");
      const activitiesData = await activitiesResponse.json();
      
      if (overviewResponse.ok) {
        setStats({
          totalUsers: overviewData.totalUsers,
          totalEvents: overviewData.totalEvents,
          totalRevenue: overviewData.totalRevenue,
          activeEvents: overviewData.activeEvents,
          totalAttendees: overviewData.totalAttendees,
          monthlyGrowth: overviewData.monthlyGrowth
        });
      }
      
      if (activitiesResponse.ok) {
        const formattedActivities = activitiesData.map(activity => ({
          id: activity.id,
          type: activity.type,
          message: activity.message,
          time: formatTimeAgo(activity.timestamp)
        }));
        setRecentActivities(formattedActivities);
      }
      
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: FiUsers,
      color: "bg-blue-500",
      change: "+15.3%"
    },
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: FiCalendar,
      color: "bg-green-500",
      change: "+8.2%"
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: FiDollarSign,
      color: "bg-purple-500",
      change: "+22.1%"
    },
    {
      title: "Active Events",
      value: stats.activeEvents,
      icon: FiActivity,
      color: "bg-orange-500",
      change: "+5.7%"
    },
    {
      title: "Total Attendees",
      value: stats.totalAttendees,
      icon: FiMapPin,
      color: "bg-red-500",
      change: "+18.9%"
    },
    {
      title: "Monthly Growth",
      value: `${stats.monthlyGrowth}%`,
      icon: FiTrendingUp,
      color: "bg-cyan-500",
      change: "+3.2%"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <div className="flex items-center space-x-2 text-gray-400">
          <FiClock className="w-5 h-5" />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                <p className="text-green-400 text-sm mt-1">{card.change} from last month</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Platform Performance</h3>
            <FiBarChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">User Engagement</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                </div>
                <span className="text-white text-sm">78%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Event Success Rate</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "92%" }}></div>
                </div>
                <span className="text-white text-sm">92%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Payment Success</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: "96%" }}></div>
                </div>
                <span className="text-white text-sm">96%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">System Uptime</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "99%" }}></div>
                </div>
                <span className="text-white text-sm">99%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
            <FiActivity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'user' ? 'bg-blue-500' :
                  activity.type === 'event' ? 'bg-green-500' :
                  'bg-purple-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.message}</p>
                  <p className="text-gray-400 text-xs">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-6 border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors">
            <FiUsers className="w-6 h-6 mb-2" />
            <span className="text-sm">Manage Users</span>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors">
            <FiCalendar className="w-6 h-6 mb-2" />
            <span className="text-sm">View Events</span>
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors">
            <FiBarChart className="w-6 h-6 mb-2" />
            <span className="text-sm">Analytics</span>
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg transition-colors">
            <FiDollarSign className="w-6 h-6 mb-2" />
            <span className="text-sm">Revenue</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}