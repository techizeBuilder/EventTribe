import { useState, useEffect } from "react";
import { FiCalendar, FiMapPin, FiUsers, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";

export default function MyReservations() {
  const { userEmail } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, [userEmail]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendee/bookings?userEmail=${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }
      
      const data = await response.json();
      setReservations(data.bookings || []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err.message);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <FiCheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <FiAlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'cancelled':
        return <FiXCircle className="w-5 h-5 text-red-400" />;
      default:
        return <FiAlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-900 text-green-300';
      case 'pending':
        return 'bg-yellow-900 text-yellow-300';
      case 'cancelled':
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  };

  const getTotalTickets = (ticketDetails) => {
    if (!ticketDetails || !Array.isArray(ticketDetails)) return 0;
    return ticketDetails.reduce((total, ticket) => total + ticket.quantity, 0);
  };

  const handleCancelReservation = (reservationId) => {
    // TODO: Implement cancel reservation logic
    toast.error('Reservation cancellation not available yet');
  };

  const handleModifyReservation = (reservationId) => {
    // TODO: Implement modify reservation logic
    toast.error('Reservation modification not available yet');
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
        <div className="text-red-400 mb-4">Failed to load reservations</div>
        <button
          onClick={fetchReservations}
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
        <h2 className="text-white text-xl font-bold">My Reservations</h2>
        <span className="text-gray-400 text-sm">{reservations.length} reservations</span>
      </div>

      {/* Reservation Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              {reservations.length}
            </div>
            <div className="text-gray-400 text-sm">Total Reservations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">
              {reservations.filter(r => r.status === 'confirmed').length}
            </div>
            <div className="text-gray-400 text-sm">Confirmed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-2">
              {reservations.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-gray-400 text-sm">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              {reservations.reduce((total, r) => total + getTotalTickets(r.ticketDetails), 0)}
            </div>
            <div className="text-gray-400 text-sm">Total Tickets</div>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      {reservations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">No reservations found</div>
          <p className="text-sm text-gray-500">Your event reservations will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div key={reservation._id} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(reservation.status)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{reservation.eventTitle}</h3>
                    <div className="flex items-center space-x-4 text-gray-300 text-sm mb-2">
                      <span className="flex items-center">
                        <FiCalendar className="w-4 h-4 mr-1" />
                        {formatDate(reservation.bookingDate)}
                      </span>
                      <span className="flex items-center">
                        <FiClock className="w-4 h-4 mr-1" />
                        {formatTime(reservation.bookingDate)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-gray-400 text-sm">
                      <span className="flex items-center">
                        <FiUsers className="w-4 h-4 mr-1" />
                        {getTotalTickets(reservation.ticketDetails)} tickets
                      </span>
                      <span>Booking ID: {reservation.bookingId}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                  </span>
                  <div className="text-white font-bold text-lg mt-2">
                    ${reservation.totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <div className="text-gray-400">Customer</div>
                  <div className="text-white">{reservation.userName}</div>
                </div>
                <div>
                  <div className="text-gray-400">Email</div>
                  <div className="text-white">{reservation.userEmail}</div>
                </div>
                <div>
                  <div className="text-gray-400">Payment</div>
                  <div className="text-white">{reservation.currency.toUpperCase()}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => handleModifyReservation(reservation.bookingId)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  Modify
                </button>
                <button
                  onClick={() => handleCancelReservation(reservation.bookingId)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => window.open(`/api/ticket/download/${reservation.bookingId}`, '_blank')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                >
                  Download Ticket
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}