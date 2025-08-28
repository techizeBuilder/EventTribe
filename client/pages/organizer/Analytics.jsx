import React, { useState, useEffect } from 'react';
import {
  FiTrendingUp,
  FiUsers,
  FiEye,
  FiMousePointer,
  FiShare2,
  FiCalendar,
  FiBarChart,
  FiPieChart,
  FiDownload,
  FiRefreshCw,
  FiFilter,
} from 'react-icons/fi';

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData();
    fetchEvents();
  }, [selectedEvent, dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedEvent !== 'all') {
        params.append('eventId', selectedEvent);
      }
      
      if (dateRange !== 'all') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(dateRange));
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }

      const response = await fetch(`/api/organizer/analytics/summary?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/organizer/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const exportAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedEvent !== 'all') params.append('eventId', selectedEvent);
      if (dateRange !== 'all') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(dateRange));
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }
      params.append('format', 'csv');

      const response = await fetch(`/api/organizer/analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Track your event performance and audience insights</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base w-full sm:w-auto"
          >
            <option value="all">All Events</option>
            {events.map(event => (
              <option key={event._id} value={event._id}>{event.title}</option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base w-full sm:w-auto"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={fetchAnalyticsData}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={exportAnalytics}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <FiDownload className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-900 rounded-lg">
              <FiEye className="w-6 h-6 text-blue-400" />
            </div>
            <FiTrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-gray-400 text-xs sm:text-sm">Page Views</h3>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {(analyticsData?.pageViews || 0).toLocaleString()}
          </p>
          <p className="text-green-400 text-xs sm:text-sm mt-1">
            +{analyticsData?.pageViewsGrowth || 0}% vs last period
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-900 rounded-lg">
              <FiUsers className="w-6 h-6 text-purple-400" />
            </div>
            <FiTrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-gray-400 text-xs sm:text-sm">Unique Visitors</h3>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {(analyticsData?.uniqueVisitors || 0).toLocaleString()}
          </p>
          <p className="text-green-400 text-xs sm:text-sm mt-1">
            +{analyticsData?.visitorsGrowth || 0}% vs last period
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-900 rounded-lg">
              <FiMousePointer className="w-6 h-6 text-orange-400" />
            </div>
            <FiTrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-gray-400 text-xs sm:text-sm">Conversion Rate</h3>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {((analyticsData?.conversionRate || 0) * 100).toFixed(1)}%
          </p>
          <p className="text-green-400 text-xs sm:text-sm mt-1">
            +{analyticsData?.conversionGrowth || 0}% vs last period
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-900 rounded-lg">
              <FiShare2 className="w-6 h-6 text-green-400" />
            </div>
            <FiTrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-gray-400 text-xs sm:text-sm">Social Shares</h3>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {(analyticsData?.socialShares || 0).toLocaleString()}
          </p>
          <p className="text-green-400 text-xs sm:text-sm mt-1">
            +{analyticsData?.sharesGrowth || 0}% vs last period
          </p>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="border-b border-gray-800">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: FiBarChart },
              { id: 'traffic', label: 'Traffic', icon: FiEye },
              { id: 'sales', label: 'Sales', icon: FiTrendingUp },
              { id: 'engagement', label: 'Engagement', icon: FiUsers },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Traffic Sources */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Traffic Sources</h3>
                  <div className="space-y-3">
                    {(analyticsData?.trafficSources || []).map((source, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                          <span className="text-gray-300 text-sm sm:text-base">{source.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold text-sm sm:text-base">{source.visitors.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{source.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Top Events</h3>
                  <div className="space-y-3">
                    {(analyticsData?.topEvents || []).map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium text-sm sm:text-base truncate">{event.title}</div>
                          <div className="text-xs sm:text-sm text-gray-400">{event.views.toLocaleString()} views</div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-green-400 font-semibold text-sm sm:text-base">{event.ticketsSold || 0} tickets</div>
                          <div className="text-xs text-gray-500">${event.revenue.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Geographic Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Geographic Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(analyticsData?.topCountries || []).map((country, index) => (
                    <div key={index} className="p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300">{country.name}</span>
                        <span className="text-white font-semibold">{country.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${country.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {country.visitors.toLocaleString()} visitors
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'traffic' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Traffic Analytics</h3>
              
              {/* Traffic Chart Placeholder */}
              <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FiBarChart className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">Traffic chart would be displayed here</p>
                  <p className="text-sm text-gray-500">Showing {analyticsData?.pageViews || 0} total page views</p>
                </div>
              </div>

              {/* Traffic Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Bounce Rate</h4>
                  <div className="text-2xl font-bold text-white">
                    {((analyticsData?.bounceRate || 0) * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-400">Visitors who left after one page</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Avg. Session Duration</h4>
                  <div className="text-2xl font-bold text-white">
                    {Math.round((analyticsData?.avgSessionDuration || 0) / 60)}m {((analyticsData?.avgSessionDuration || 0) % 60).toFixed(0)}s
                  </div>
                  <p className="text-sm text-gray-400">Time spent on your events</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Sales Analytics</h3>
              
              {/* Sales Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Total Revenue</h4>
                  <div className="text-2xl font-bold text-green-400">
                    ${(analyticsData?.totalRevenue || 0).toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-400">From {analyticsData?.totalTicketsSold || 0} tickets sold</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Avg. Order Value</h4>
                  <div className="text-2xl font-bold text-blue-400">
                    ${(analyticsData?.avgOrderValue || 0).toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-400">Per transaction</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Revenue Growth</h4>
                  <div className="text-2xl font-bold text-purple-400">
                    +{analyticsData?.revenueGrowth || 0}%
                  </div>
                  <p className="text-sm text-gray-400">Compared to last period</p>
                </div>
              </div>

              {/* Top Performing Events by Revenue */}
              <div>
                <h4 className="font-medium text-white mb-3">Top Performing Events</h4>
                <div className="space-y-3">
                  {(analyticsData?.topEventsByRevenue || []).map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold">#{index + 1}</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">{event.title}</div>
                          <div className="text-sm text-gray-400">{event.ticketsSold} tickets sold</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-semibold">${event.revenue.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">${event.avgTicketPrice} avg</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Engagement Analytics</h3>
              
              {/* Engagement Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Social Shares</h4>
                  <div className="text-2xl font-bold text-blue-400">
                    {(analyticsData?.socialShares || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Email Opens</h4>
                  <div className="text-2xl font-bold text-green-400">
                    {(analyticsData?.emailOpens || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Click Rate</h4>
                  <div className="text-2xl font-bold text-purple-400">
                    {((analyticsData?.clickRate || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Repeat Visitors</h4>
                  <div className="text-2xl font-bold text-orange-400">
                    {((analyticsData?.repeatVisitorRate || 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Most Shared Events */}
              <div>
                <h4 className="font-medium text-white mb-3">Most Shared Events</h4>
                <div className="space-y-3">
                  {(analyticsData?.mostSharedEvents || []).map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <div className="text-white font-medium">{event.title}</div>
                        <div className="text-sm text-gray-400">{event.shares} shares across all platforms</div>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">
                          Facebook: {event.facebookShares}
                        </span>
                        <span className="px-2 py-1 bg-blue-800 text-blue-200 rounded text-xs">
                          Twitter: {event.twitterShares}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}