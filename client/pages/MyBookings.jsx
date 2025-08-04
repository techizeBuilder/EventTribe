import { useState, useEffect } from "react";
import {
  FiCalendar,
  FiMapPin,
  FiClock,
  FiUser,
  FiEye,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { formatPrice } from "../utils/priceUtils";
import { toast } from "react-hot-toast";

export default function MyBookings() {
  const { userEmail } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [userEmail]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('Fetching bookings for user email:', userEmail);
      const response = await fetch(`/api/attendee/bookings?userEmail=${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      console.log('Bookings response:', data);
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.message);
      toast.error('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (bookingId) => {
    // Open PDF ticket in new tab (can be viewed and downloaded)
    window.open(`/api/ticket/download/${bookingId}`, '_blank');
    toast.success('Opening your ticket...');
  };

  const handleCancelBooking = (bookingId) => {
    // TODO: Implement cancel booking logic
    toast.error('Booking cancellation not available yet');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalTickets = (ticketDetails) => {
    if (!ticketDetails || !Array.isArray(ticketDetails)) return 0;
    return ticketDetails.reduce((total, ticket) => total + ticket.quantity, 0);
  };

  const getTicketTypes = (ticketDetails) => {
    if (!ticketDetails || !Array.isArray(ticketDetails)) return 'General';
    return ticketDetails.map(ticket => ticket.name).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">Failed to load bookings</div>
        <button
          onClick={fetchBookings}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-bold">My Bookings</h2>
        <span className="text-gray-400 text-sm">{bookings.length} bookings</span>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">No bookings found</div>
          <p className="text-sm text-gray-500">Your ticket purchases will appear here</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">{booking.eventTitle}</h3>
                    <div className="flex items-center space-x-4 text-gray-300 text-sm mb-2">
                      <span>{formatDate(booking.bookingDate)}</span>
                      <span>•</span>
                      <span>{booking.userName}</span>
                    </div>
                    <p className="text-gray-400 text-sm">Booking ID: {booking.bookingId}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Ticket Type</p>
                    <p className="text-white font-medium">{getTicketTypes(booking.ticketDetails)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Quantity</p>
                    <p className="text-white font-medium">{getTotalTickets(booking.ticketDetails)} ticket{getTotalTickets(booking.ticketDetails) > 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Total Amount</p>
                    <p className="text-white font-medium">{formatPrice(booking.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Payment Status</p>
                    <p className="text-white font-medium">{booking.currency.toUpperCase()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => handleViewTicket(booking.bookingId)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <FiEye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleCancelBooking(booking.bookingId)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}