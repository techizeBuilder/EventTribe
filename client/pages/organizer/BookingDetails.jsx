
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  FiArrowLeft,
  FiUser,
  FiCalendar,
  FiMapPin,
  FiDollarSign,
  FiCreditCard,
  FiMail,
  FiPhone,
  FiCheck,
  FiX,
  FiClock,
  FiDownload
} from "react-icons/fi";
import toast from "react-hot-toast";
import { authService } from "../../services/authService.js";

export default function BookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await authService.apiRequest(`/api/organizer/bookings/${bookingId}`);

      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      } else {
        toast.error("Failed to fetch booking details");
        navigate("/organizer/bookings");
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      toast.error("Failed to fetch booking details");
      navigate("/organizer/bookings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <FiCheck className="w-5 h-5 text-green-500" />;
      case "cancelled":
        return <FiX className="w-5 h-5 text-red-500" />;
      case "pending":
        return <FiClock className="w-5 h-5 text-yellow-500" />;
      default:
        return <FiClock className="w-5 h-5 text-gray-500" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-400">Loading booking details...</span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-white mb-4">Booking not found</h2>
        <button
          onClick={() => navigate("/organizer/bookings")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/organizer/bookings")}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FiArrowLeft className="w-6 h-6 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Booking Details</h1>
            <p className="text-gray-400">Booking ID: {booking._id}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Booking Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Information */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Event Information</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FiCalendar className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-white font-medium">{booking.eventTitle}</p>
                  <p className="text-gray-400 text-sm">
                    {booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : "Date TBD"}
                  </p>
                </div>
              </div>
              {booking.eventLocation && (
                <div className="flex items-center space-x-3">
                  <FiMapPin className="w-5 h-5 text-red-500" />
                  <p className="text-gray-300">{booking.eventLocation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Attendee Information */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Attendee Information</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <FiUser className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {booking.attendeeName || booking.firstName || "N/A"}
                  </p>
                  <p className="text-gray-400 text-sm">Attendee</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FiMail className="w-5 h-5 text-green-500" />
                <p className="text-gray-300">{booking.attendeeEmail || booking.email}</p>
              </div>

              {booking.phone && (
                <div className="flex items-center space-x-3">
                  <FiPhone className="w-5 h-5 text-purple-500" />
                  <p className="text-gray-300">{booking.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Details */}
          {booking.ticketDetails && booking.ticketDetails.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Ticket Details</h3>
              <div className="space-y-3">
                {booking.ticketDetails.map((ticket, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{ticket.type}</p>
                      <p className="text-gray-400 text-sm">Quantity: {ticket.quantity}</p>
                    </div>
                    <p className="text-green-400 font-medium">${ticket.price * ticket.quantity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Status */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Status</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-2">Booking Status</p>
                <span className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm border ${getStatusColor(booking.status)}`}>
                  {getStatusIcon(booking.status)}
                  <span className="capitalize">{booking.status}</span>
                </span>
              </div>
              
              <div>
                <p className="text-gray-400 text-sm mb-2">Payment Status</p>
                <span className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm border ${getStatusColor(booking.paymentStatus || "pending")}`}>
                  <FiCreditCard className="w-4 h-4" />
                  <span className="capitalize">{booking.paymentStatus || "pending"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Payment</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount</span>
                <span className="text-white font-medium">
                  ${booking.totalAmount || booking.amount || 0}
                </span>
              </div>
              
              {booking.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Method</span>
                  <span className="text-white capitalize">{booking.paymentMethod}</span>
                </div>
              )}
              
              {booking.transactionId && (
                <div>
                  <span className="text-gray-400 text-sm">Transaction ID</span>
                  <p className="text-white text-sm font-mono bg-gray-800 p-2 rounded mt-1">
                    {booking.transactionId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Timeline */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-white text-sm">Booking Created</p>
                  <p className="text-gray-400 text-xs">
                    {new Date(booking.createdAt || booking.bookingDate).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="text-white text-sm">Last Updated</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(booking.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
