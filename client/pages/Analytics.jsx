
import { useState } from "react";
import { FiTrendingUp, FiUsers, FiCalendar, FiDollarSign } from "react-icons/fi";

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
            <p className="text-gray-400 text-sm">
              Track your event performance and audience insights
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </header>

      <div className="px-8 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Total Events</h3>
              <FiCalendar className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">12</p>
            <p className="text-xs text-green-400 mt-1">+20% from last period</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Total Attendees</h3>
              <FiUsers className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-white">1,234</p>
            <p className="text-xs text-green-400 mt-1">+15% from last period</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Revenue</h3>
              <FiDollarSign className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-white">₹45,678</p>
            <p className="text-xs text-green-400 mt-1">+8% from last period</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Conversion Rate</h3>
              <FiTrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white">12.5%</p>
            <p className="text-xs text-red-400 mt-1">-2% from last period</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Event Performance */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Performing Events</h3>
            <div className="space-y-4">
              {[
                { name: "Summer Music Festival", attendees: 450, revenue: "₹18,500" },
                { name: "Tech Conference 2024", attendees: 320, revenue: "₹12,800" },
                { name: "Food & Wine Expo", attendees: 280, revenue: "₹9,600" },
              ].map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{event.name}</p>
                    <p className="text-gray-400 text-sm">{event.attendees} attendees</p>
                  </div>
                  <p className="text-green-400 font-semibold">{event.revenue}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Audience Demographics */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Audience Demographics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Age 18-25</span>
                  <span className="text-white">35%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-400 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Age 26-35</span>
                  <span className="text-white">45%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Age 36-45</span>
                  <span className="text-white">15%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Age 45+</span>
                  <span className="text-white">5%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-400 h-2 rounded-full" style={{ width: '5%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-700">
                  <th className="text-left py-3">Event</th>
                  <th className="text-left py-3">Date</th>
                  <th className="text-left py-3">Tickets Sold</th>
                  <th className="text-left py-3">Revenue</th>
                  <th className="text-left py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="5" className="text-center text-gray-500 py-8">
                    No recent activity to display
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
