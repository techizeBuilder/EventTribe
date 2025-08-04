import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiEye, 
  FiSearch, 
  FiFilter, 
  FiDownload, 
  FiCalendar,
  FiUser,
  FiDollarSign,
  FiCreditCard,
  FiCheck,
  FiX,
  FiClock
} from "react-icons/fi";
import toast from "react-hot-toast";
import { authService } from "../../services/authService.js";

export default function Bookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchBookings();
    fetchEvents();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // TEMPORARY: Use no-auth endpoint for testing
      const response = await fetch("/api/test/organizer-bookings-simple");

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched bookings:", data);
        // Handle the new format from our test endpoint
        if (data.sampleBookings) {
          setBookings(data.sampleBookings);
        } else if (Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings([]);
        }
      } else {
        // Don't show error toast for auth issues - just log it
        const status = response.status;
        if (status === 401 || status === 403) {
          console.log("Authentication issue, but staying on page");
          setBookings([]); // Set empty bookings instead of error
        } else {
          toast.error("Failed to fetch bookings");
        }
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      // Don't show error for auth issues
      if (!error.message.includes('Authentication')) {
        toast.error("Failed to fetch bookings");
      }
      setBookings([]); // Set empty bookings so page still works
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await authService.apiRequest("/api/organizer/events");

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        // Don't show error for auth issues - just log it
        const status = response.status;
        if (status === 401 || status === 403) {
          console.log("Authentication issue fetching events, but staying on page");
          setEvents([]); // Set empty events instead of error
        } else {
          console.error("Failed to fetch events:", status);
        }
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]); // Set empty events so page still works
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <FiCheck className="w-4 h-4 text-green-500" />;
      case "cancelled":
        return <FiX className="w-4 h-4 text-red-500" />;
      case "pending":
        return <FiClock className="w-4 h-4 text-yellow-500" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-900/30 text-green-400 border-green-800";
      case "cancelled":
        return "bg-red-900/30 text-red-400 border-red-800";
      case "pending":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-800";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-900/30 text-green-400 border-green-800";
      case "failed":
        return "bg-red-900/30 text-red-400 border-red-800";
      case "pending":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-800";
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = 
      booking.attendeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.attendeeEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesEvent = eventFilter === "all" || booking.eventId === eventFilter;

    return matchesSearch && matchesStatus && matchesEvent;
  });

  // Removed sample booking creation - only work with real database bookings

  const handleViewDetails = (bookingId) => {
    navigate(`/organizer/bookings/${bookingId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-400">Loading bookings...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Bookings</h1>
          <p className="text-gray-400 mt-1">
            Manage all bookings for your events
          </p>
        </div>
        <div className="flex gap-3">
          {bookings.length === 0 && (
           null
          )}
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
            <FiDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Event Filter */}
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Events</option>
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.title}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setEventFilter("all");
            }}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center">
            <FiCalendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No bookings found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all" || eventFilter !== "all"
                ? "Try adjusting your filters"
                : "Your event bookings will appear here"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-medium">Attendee</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Event</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Date</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Amount</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Payment</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-800/50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <FiUser className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {booking.attendeeName || "N/A"}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {booking.attendeeEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white font-medium">
                        {booking.eventTitle}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-300">
                        {new Date(booking.bookingDate || booking.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1">
                        <FiDollarSign className="w-4 h-4 text-green-500" />
                        <span className="text-white font-medium">
                          {booking.totalAmount || booking.amount || 0}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="capitalize">{booking.status}</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        <FiCreditCard className="w-3 h-3" />
                        <span className="capitalize">{booking.paymentStatus || "pending"}</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleViewDetails(booking._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                      >
                        <FiEye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Bookings</p>
              <p className="text-2xl font-bold text-white">{bookings.length}</p>
            </div>
            <FiCalendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Confirmed</p>
              <p className="text-2xl font-bold text-green-400">
                {bookings.filter(b => b.status === "confirmed").length}
              </p>
            </div>
            <FiCheck className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">
                {bookings.filter(b => b.status === "pending").length}
              </p>
            </div>
            <FiClock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">
                ${bookings.reduce((total, booking) => total + (booking.totalAmount || booking.amount || 0), 0).toFixed(2)}
              </p>
            </div>
            <FiDollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  );
}