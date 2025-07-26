import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiBarChart, 
  FiTrendingUp,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiActivity,
  FiDownload,
  FiRefreshCw
} from "react-icons/fi";

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalRevenue: 125000,
      totalEvents: 342,
      totalUsers: 2847,
      avgTicketPrice: 45.50,
      conversionRate: 12.5,
      growthRate: 23.8
    },
    revenueData: [
      { month: "Jan", revenue: 8500 },
      { month: "Feb", revenue: 12000 },
      { month: "Mar", revenue: 15500 },
      { month: "Apr", revenue: 18000 },
      { month: "May", revenue: 21000 },
      { month: "Jun", revenue: 25000 },
      { month: "Jul", revenue: 25000 }
    ],
    userGrowth: [
      { month: "Jan", users: 180 },
      { month: "Feb", users: 245 },
      { month: "Mar", users: 320 },
      { month: "Apr", users: 410 },
      { month: "May", users: 520 },
      { month: "Jun", users: 650 },
      { month: "Jul", users: 780 }
    ],
    eventCategories: [
      { category: "Technology", count: 85, percentage: 25 },
      { category: "Music", count: 68, percentage: 20 },
      { category: "Business", count: 58, percentage: 17 },
      { category: "Sports", count: 45, percentage: 13 },
      { category: "Art", count: 42, percentage: 12 },
      { category: "Food", count: 44, percentage: 13 }
    ],
    topEvents: [
      { name: "Tech Conference 2025", attendees: 850, revenue: 12750 },
      { name: "Music Festival", attendees: 1200, revenue: 18000 },
      { name: "Business Summit", attendees: 650, revenue: 9750 },
      { name: "Art Exhibition", attendees: 420, revenue: 6300 },
      { name: "Food Festival", attendees: 380, revenue: 5700 }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics");
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(prev => ({
          ...prev,
          overview: {
            totalRevenue: data.totalRevenue,
            totalEvents: data.totalEvents,
            totalUsers: data.totalUsers,
            avgTicketPrice: data.avgTicketPrice,
            conversionRate: data.conversionRate,
            growthRate: data.growthRate
          }
        }));
      } else {
        console.error("Failed to fetch analytics data");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Create CSV data
    const csvData = [
      ['Metric', 'Value'],
      ['Total Revenue', `$${analyticsData.overview.totalRevenue.toLocaleString()}`],
      ['Total Events', analyticsData.overview.totalEvents],
      ['Total Users', analyticsData.overview.totalUsers],
      ['Average Ticket Price', `$${analyticsData.overview.avgTicketPrice}`],
      ['Conversion Rate', `${analyticsData.overview.conversionRate}%`],
      ['Growth Rate', `${analyticsData.overview.growthRate}%`]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Track platform performance and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-white">${analyticsData.overview.totalRevenue.toLocaleString()}</p>
              <p className="text-green-400 text-sm mt-1">+{analyticsData.overview.growthRate}% from last month</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Events</p>
              <p className="text-2xl font-bold text-white">{analyticsData.overview.totalEvents}</p>
              <p className="text-blue-400 text-sm mt-1">+12% from last month</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <FiCalendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Users</p>
              <p className="text-2xl font-bold text-white">{analyticsData.overview.totalUsers.toLocaleString()}</p>
              <p className="text-purple-400 text-sm mt-1">+18% from last month</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Avg Ticket Price</p>
              <p className="text-2xl font-bold text-white">${analyticsData.overview.avgTicketPrice}</p>
              <p className="text-orange-400 text-sm mt-1">+5% from last month</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-lg">
              <FiActivity className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Conversion Rate</p>
              <p className="text-2xl font-bold text-white">{analyticsData.overview.conversionRate}%</p>
              <p className="text-cyan-400 text-sm mt-1">+2% from last month</p>
            </div>
            <div className="bg-cyan-500 p-3 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Growth Rate</p>
              <p className="text-2xl font-bold text-white">{analyticsData.overview.growthRate}%</p>
              <p className="text-green-400 text-sm mt-1">+3% from last month</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <FiBarChart className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-end space-x-2">
            {analyticsData.revenueData.map((item, index) => (
              <div key={item.month} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-green-500 rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${(item.revenue / Math.max(...analyticsData.revenueData.map(d => d.revenue))) * 200}px`
                  }}
                ></div>
                <span className="text-gray-400 text-xs mt-2">{item.month}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* User Growth Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
          <div className="h-64 flex items-end space-x-2">
            {analyticsData.userGrowth.map((item, index) => (
              <div key={item.month} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${(item.users / Math.max(...analyticsData.userGrowth.map(d => d.users))) * 200}px`
                  }}
                ></div>
                <span className="text-gray-400 text-xs mt-2">{item.month}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Event Categories & Top Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Event Categories</h3>
          <div className="space-y-4">
            {analyticsData.eventCategories.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-red-500' :
                    index === 1 ? 'bg-blue-500' :
                    index === 2 ? 'bg-green-500' :
                    index === 3 ? 'bg-yellow-500' :
                    index === 4 ? 'bg-purple-500' : 'bg-orange-500'
                  }`}></div>
                  <span className="text-gray-300">{category.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{category.count}</span>
                  <span className="text-gray-400 text-sm">({category.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing Events</h3>
          <div className="space-y-4">
            {analyticsData.topEvents.map((event, index) => (
              <div key={event.name} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <p className="text-white font-medium">{event.name}</p>
                  <p className="text-gray-400 text-sm">{event.attendees} attendees</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-medium">${event.revenue.toLocaleString()}</p>
                  <p className="text-gray-400 text-sm">#{index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}