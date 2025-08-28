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
  FiClock,
  FiChevronLeft,
  FiChevronRight,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchBookings();
    fetchEvents();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Use proper authenticated endpoint
      const response = await authService.apiRequest("/api/organizer/bookings");

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched bookings:", data);
        // Data should be an array of bookings with enhanced user details
        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings([]);
        }
      } else {
        // Handle auth issues
        const status = response.status;
        if (status === 401 || status === 403) {
          console.log("Authentication issue:", status);
          toast.error("Please login to view bookings");
          // Redirect to login
          navigate("/organizer/login");
        } else {
          toast.error("Failed to fetch bookings");
          setBookings([]);
        }
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to fetch bookings");
      setBookings([]);
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
          console.log(
            "Authentication issue fetching events, but staying on page",
          );
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
      booking.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.eventTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter;
    const matchesEvent =
      eventFilter === "all" || booking.eventId === eventFilter;

    return matchesSearch && matchesStatus && matchesEvent;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, eventFilter]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Removed sample booking creation - only work with real database bookings

  const handleViewDetails = async (bookingId) => {
    try {
      // Fetch detailed booking information
      const response = await authService.apiRequest(`/api/organizer/bookings/${bookingId}`);
      
      if (response.ok) {
        const bookingDetails = await response.json();
        console.log("Booking details:", bookingDetails);
        // You can navigate to a details page or open a modal
        // For now, we'll navigate to a details page
        navigate(`/organizer/bookings/${bookingId}`, { state: { booking: bookingDetails } });
      } else {
        const status = response.status;
        if (status === 403) {
          toast.error("Access denied to this booking");
        } else if (status === 404) {
          toast.error("Booking not found");
        } else {
          toast.error("Failed to fetch booking details");
        }
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      toast.error("Failed to fetch booking details");
    }
  };

  const handleExportToExcel = () => {
    if (filteredBookings.length === 0) {
      toast.error("No bookings to export");
      return;
    }

    try {
      // Define CSV headers with all booking fields
      const headers = [
        "Booking ID",
        "Attendee Name",
        "Attendee Email",
        "Event Title",
        "Event ID",
        "Booking Date",
        "Amount",
        "Total Amount",
        "Status",
        "Payment Status",
        "Payment Intent ID",
        "Created At",
        "Updated At",
        "Ticket Details",
        "User Email",
        "User Name",
      ];

      // Convert booking data to CSV rows
      const csvData = filteredBookings.map((booking) => [
        booking.bookingId || booking._id || "",
        booking.attendeeName || booking.userName || "",
        booking.attendeeEmail || booking.userEmail || "",
        booking.eventTitle || "",
        booking.eventId || "",
        booking.bookingDate
          ? new Date(booking.bookingDate).toLocaleString()
          : "",
        booking.amount || "",
        booking.totalAmount || "",
        booking.status || "",
        booking.paymentStatus || "pending",
        booking.paymentIntentId || "",
        booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "",
        booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : "",
        booking.ticketDetails ? JSON.stringify(booking.ticketDetails) : "",
        booking.userEmail || "",
        booking.userName || "",
      ]);

      // Combine headers and data
      const allRows = [headers, ...csvData];

      // Convert to CSV format
      const csvContent = allRows
        .map((row) =>
          row
            .map((field) =>
              // Escape quotes and wrap in quotes if contains comma, quote, or newline
              typeof field === "string" &&
              (field.includes(",") ||
                field.includes('"') ||
                field.includes("\n"))
                ? `"${field.replace(/"/g, '""')}"`
                : field,
            )
            .join(","),
        )
        .join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);

      // Generate filename with current date
      const currentDate = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `bookings-export-${currentDate}.csv`);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${filteredBookings.length} bookings to Excel`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export bookings");
    }
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Bookings
          </h1>
          <p className="text-gray-400 mt-1">
            Manage all bookings for your events
          </p>
        </div>
        <div className="flex gap-3">
          {bookings.length === 0 && null}
          <button
            onClick={handleExportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
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
                {bookings.filter((b) => b.status === "confirmed").length}
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
                {bookings.filter((b) => b.status === "pending").length}
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
                $
                {bookings
                  .reduce(
                    (total, booking) =>
                      total + (booking.totalAmount || booking.amount || 0),
                    0,
                  )
                  .toFixed(2)}
              </p>
            </div>
            <FiDollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {paginatedBookings.length === 0 ? (
          <div className="p-8 text-center">
            <FiCalendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              No bookings found
            </h3>
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
                  <th className="text-left p-4 text-gray-300 font-medium">
                    Attendee
                  </th>
                  <th className="text-left p-4 text-gray-300 font-medium">
                    Event
                  </th>
                  <th className="text-left p-4 text-gray-300 font-medium">
                    Date
                  </th>
                  <th className="text-left p-4 text-gray-300 font-medium">
                    Amount
                  </th>
                  <th className="text-left p-4 text-gray-300 font-medium">
                    Status
                  </th>
                  <th className="text-left p-4 text-gray-300 font-medium">
                    Payment
                  </th>
                  <th className="text-left p-4 text-gray-300 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-800/50">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {booking.user?.profileImage ? (
                          <img 
                            src={booking.user.profileImage} 
                            alt={booking.user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <FiUser className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">
                            {booking.user?.name || booking.customerName || booking.userName || "Unknown User"}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {booking.user?.email || booking.customerEmail || booking.userEmail || "N/A"}
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
                        {new Date(
                          booking.bookingDate || booking.createdAt,
                        ).toLocaleDateString()}
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
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(booking.status)}`}
                      >
                        {getStatusIcon(booking.status)}
                        <span className="capitalize">{booking.status}</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getPaymentStatusColor(booking.paymentStatus)}`}
                      >
                        <FiCreditCard className="w-3 h-3" />
                        <span className="capitalize">
                          {booking.paymentStatus || "pending"}
                        </span>
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
        
        {/* Pagination Controls */}
        {filteredBookings.length > itemsPerPage && (
          <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} results
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === 1
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current page
                    const shouldShow = 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1);
                    
                    if (!shouldShow) {
                      // Show ellipsis for gaps
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="text-gray-500 px-2">...</span>;
                      }
                      return null;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                {/* Next Button */}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-colors ${
                    currentPage === totalPages
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
