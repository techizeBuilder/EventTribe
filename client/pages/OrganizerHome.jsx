import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  FiTrendingUp,
  FiUsers,
  FiEye,
  FiCreditCard,
  FiPlus,
  FiArrowRight,
  FiStar,
  FiLifeBuoy,
  FiZap,
  FiVideo,
  FiDollarSign,
  FiCalendar,
  FiSearch,
  FiMessageSquare,
  FiMail,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";

export default function OrganizerHome() {
  const { user, userName, userEmail } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [eventsData, setEventsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch dashboard overview
        const dashboardResponse = await fetch("/api/organizer/dashboard", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });

        if (dashboardResponse.ok) {
          const dashboard = await dashboardResponse.json();
          setDashboardData(dashboard);
        }

        // Fetch recent events
        const eventsResponse = await fetch("/api/organizer/events?limit=5", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });

        if (eventsResponse.ok) {
          const events = await eventsResponse.json();
          setEventsData(events);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleViewEvent = (eventId) => {
    alert(`Viewing event: ${eventId}`);
  };

  const handleEditEvent = (eventId) => {
    alert(`Editing event: ${eventId}`);
  };

  const handleManageTickets = (eventId) => {
    alert(`Managing tickets for event: ${eventId}`);
  };

  const handleViewAnalytics = (eventId) => {
    alert(`Viewing analytics for event: ${eventId}`);
  };

  const handleGenerateSampleData = async () => {
    try {
      await fetch("/api/organizer/sample-data/all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      // Refresh dashboard data
      window.location.reload();
    } catch (error) {
      console.error("Error generating sample data:", error);
    }
  };

  // Build stats from dashboard data
  const stats = [
    {
      icon: <FiDollarSign className="w-5 h-5" />,
      value: dashboardData?.finances?.totalRevenue
        ? `$${dashboardData.finances.totalRevenue.toLocaleString()}`
        : "$0.00",
      label: "Total Revenue",
      subtitle: "Total revenue from all events",
      trend:
        dashboardData?.finances?.pendingPayouts > 0
          ? `${dashboardData.finances.pendingPayouts} pending`
          : null,
    },
    {
      icon: <FiUsers className="w-5 h-5" />,
      value: dashboardData?.attendees?.totalAttendees?.toString() || "0",
      label: "Total Attendees",
      subtitle: "Total registrations across all events",
      trend: dashboardData?.attendees?.checkedInAttendees
        ? `${dashboardData.attendees.checkedInAttendees} checked in`
        : null,
    },
    {
      icon: <FiCalendar className="w-5 h-5" />,
      value: dashboardData?.events?.totalEvents?.toString() || "0",
      label: "Total Events",
      subtitle: "Published and draft events",
      trend: dashboardData?.events?.publishedEvents
        ? `${dashboardData.events.publishedEvents} published`
        : null,
    },
    {
      icon: <FiCreditCard className="w-5 h-5" />,
      value: dashboardData?.audience?.totalContacts?.toString() || "0",
      label: "Audience Contacts",
      subtitle: "Total contacts in your audience",
      trend: dashboardData?.audience?.subscribedContacts
        ? `${dashboardData.audience.subscribedContacts} subscribed`
        : null,
    },
  ];

  const features = [
    {
      icon: <FiLifeBuoy className="w-5 h-5 text-orange-400" />,
      title: "Support Center",
      description:
        "View and respond to support tickets directly in Event Tribe.",
    },
    {
      icon: <FiZap className="w-5 h-5 text-blue-400" />,
      title: "Launch Ads with Event Tribe",
      description:
        "Create and submit ad campaigns with Event Tribe's dedicated ads manager.",
    },
    {
      icon: <FiVideo className="w-5 h-5 text-purple-400" />,
      title: "Event Tribe Moments",
      description:
        "Upload short videos to give attendees a preview of your events.",
    },
    {
      icon: <FiDollarSign className="w-5 h-5 text-green-400" />,
      title: "Vendor Payments",
      description: "Manage and process vendor payments seamlessly.",
    },
  ];

  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white mb-1">
              Welcome Back, {user?.name || user?.email?.split("@")[0] || "User"}
            </h1>
            <p className="text-gray-400 text-sm">
              Here's what's happening with your events today
            </p>
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Link
              to="/organizer/createEvent"
              className="px-3 sm:px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg transition-colors duration-200 flex items-center space-x-2 font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Event</span>
              <span className="sm:hidden">Create</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 hover:bg-gray-800/50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="p-2 bg-gray-800 rounded-lg">{stat.icon}</div>
                {stat.trend && (
                  <FiTrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-bold text-white">{stat.value}</h3>
                <p className="text-white text-xs sm:text-sm font-medium">{stat.label}</p>
                <p className="text-gray-400 text-xs">{stat.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          {/* Main CTA Card */}
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            {/* Background decoration */}

            <div className="relative">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">
                  Bring Your Event Dreams to Life
                </h2>
                <p className="text-gray-300 text-sm sm:text-lg leading-relaxed">
                  With Event Tribe, set up, sell out, and fly high. Your perfect event
                  is just a few clicks away.
                </p>
              </div>

              <Link
                to="/organizer/createEvent"
                className="inline-flex items-center space-x-2 sm:space-x-3 bg-white hover:bg-gray-100 text-black font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg text-sm sm:text-base"
              >
                <span>Start Creating</span>
                <FiArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </div>
          </div>

          {/* What's New Section */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">What's New</h3>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Stay updated with new tools and features
              </p>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer"
                  >
                    <div className="p-1.5 bg-gray-800 rounded-lg flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm font-semibold mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  to="/organizer/events"
                  className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-left"
                >
                  <span className="text-gray-300 text-sm">View All Events</span>
                  <FiArrowRight className="w-4 h-4 text-gray-500" />
                </Link>
                <Link
                  to="/organizer/finances"
                  className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-left"
                >
                  <span className="text-gray-300 text-sm">Check Finances</span>
                  <FiArrowRight className="w-4 h-4 text-gray-500" />
                </Link>
                <Link
                  to="/organizer/marketing"
                  className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-left"
                >
                  <span className="text-gray-300 text-sm">Marketing Tools</span>
                  <FiArrowRight className="w-4 h-4 text-gray-500" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Events</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Manage your upcoming and past events
            </p>

            {/* Event Tabs */}
            <div className="flex mb-6">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`px-4 py-2 text-sm font-medium rounded-lg mr-2 transition-colors duration-200 ${
                  activeTab === "upcoming"
                    ? "bg-white text-black"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                UPCOMING
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeTab === "past"
                    ? "bg-white text-black"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                PAST
              </button>
            </div>

            {/* Recent Events */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-400">Loading events...</div>
                </div>
              ) : eventsData.length > 0 ? (
                eventsData.map((event) => (
                  <div
                    key={event._id || event.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold">
                        {event.title}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          event.status === "published"
                            ? "bg-green-900 text-green-300"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {event.status?.charAt(0).toUpperCase() +
                          event.status?.slice(1) || "Draft"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                      <span>
                        {new Date(
                          event.date || event.startDate,
                        ).toLocaleDateString()}{" "}
                        at{" "}
                        {event.time ||
                          new Date(event.startDate).toLocaleTimeString()}
                      </span>
                      <span>•</span>
                      <span>
                        {event.location || event.venue || "Location TBD"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">
                        {event.attendeeCount || 0} registered
                      </span>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">
                          ${(event.revenue || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Revenue</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t border-gray-700 flex gap-3">
                      <button
                        onClick={() => handleViewEvent(event._id || event.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditEvent(event._id || event.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleManageTickets(event._id || event.id)
                        }
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Tickets
                      </button>
                      <button
                        onClick={() =>
                          handleViewAnalytics(event._id || event.id)
                        }
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Analytics
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <FiCalendar className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">
                    No events yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Get started by creating your first event
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      to="/organizer/events/create"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Create Event
                    </Link>
                    <button
                      onClick={handleGenerateSampleData}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Generate Sample Data
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Orders Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Recent Orders</h3>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                View your latest ticket sales
              </p>

              <div className="space-y-3">
                {[
                  {
                    id: "#ORD-2024-1234",
                    customer: "John Smith",
                    event: "Summer Music Festival",
                    amount: "$150.00",
                    date: "Dec 25, 2024",
                    status: "Completed",
                  },
                  {
                    id: "#ORD-2024-1235",
                    customer: "Sarah Johnson",
                    event: "Tech Conference",
                    amount: "$299.99",
                    date: "Dec 24, 2024",
                    status: "Completed",
                  },
                  {
                    id: "#ORD-2024-1236",
                    customer: "Mike Davis",
                    event: "Food & Wine Expo",
                    amount: "$85.50",
                    date: "Dec 23, 2024",
                    status: "Pending",
                  },
                ].map((order) => (
                  <div
                    key={order.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-white font-medium">{order.id}</h4>
                      <p className="text-gray-400 text-sm">
                        {order.customer} • {order.event}
                      </p>
                      <p className="text-gray-500 text-xs">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{order.amount}</p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === "Completed"
                            ? "bg-green-900 text-green-300"
                            : "bg-yellow-900 text-yellow-300"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search Recent Orders"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-gray-600"
                />
              </div>

              {/* No Orders State */}
              <div className="text-center py-12">
                <div className="text-gray-400 text-sm">
                  No matching records were found
                </div>
              </div>

              {/* Order Actions */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800">
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded transition-colors duration-200">
                    Affiliate
                  </button>
                  <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded transition-colors duration-200">
                    List
                  </button>
                  <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded transition-colors duration-200">
                    CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Support Center Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Support Center</h3>
                <Link
                  to="/organizer/support-center"
                  className="bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  View Desk
                </Link>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                View and respond to support tickets directly in Flite
              </p>

              {/* No Messages State */}
              <div className="text-center py-12">
                <FiMessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h4 className="text-white text-lg font-medium mb-2">
                  No Messages Yet
                </h4>
                <p className="text-gray-400 text-sm">
                  When users send messages they will appear here.
                </p>
              </div>
            </div>

            {/* Additional Support Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Get Help</h3>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                Need assistance? We're here to help you succeed
              </p>

              <div className="space-y-4">
                <a
                  href="mailto:support@flite.city"
                  className="flex items-center space-x-3 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors duration-200"
                >
                  <FiMail className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="text-white font-medium">Email Support</h4>
                    <p className="text-gray-400 text-sm">
                      Get help via email within 24 hours
                    </p>
                  </div>
                </a>

                <div className="flex items-center space-x-3 p-4 bg-gray-800 rounded-lg">
                  <FiLifeBuoy className="w-5 h-5 text-green-400" />
                  <div>
                    <h4 className="text-white font-medium">Help Center</h4>
                    <p className="text-gray-400 text-sm">
                      Browse our knowledge base and FAQs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
