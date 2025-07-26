import { useState, useEffect } from "react";
import { FiCreditCard, FiDollarSign, FiCalendar, FiCheck, FiX } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";

export default function PaymentDetails() {
  const { userEmail } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, [userEmail]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attendee/bookings?userEmail=${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment details');
      }
      
      const data = await response.json();
      setPayments(data.bookings || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message);
      toast.error('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalSpent = () => {
    return payments.reduce((total, payment) => total + payment.totalAmount, 0);
  };

  const getPaymentMethod = (paymentIntentId) => {
    // In a real app, you'd fetch this from Stripe
    return 'Card ending in ****';
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
        <div className="text-red-400 mb-4">Failed to load payment details</div>
        <button
          onClick={fetchPayments}
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
        <h2 className="text-white text-xl font-bold">Payment Details</h2>
        <span className="text-gray-400 text-sm">{payments.length} transactions</span>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              ${getTotalSpent().toFixed(2)}
            </div>
            <div className="text-gray-400 text-sm">Total Spent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              {payments.length}
            </div>
            <div className="text-gray-400 text-sm">Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-2">
              {payments.filter(p => p.status === 'confirmed').length}
            </div>
            <div className="text-gray-400 text-sm">Successful</div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {payments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">No payment history found</div>
          <p className="text-sm text-gray-500">Your payment transactions will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-white text-lg font-semibold">Payment History</h3>
          {payments.map((payment) => (
            <div key={payment._id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    payment.status === 'confirmed' ? 'bg-green-900' : 'bg-yellow-900'
                  }`}>
                    {payment.status === 'confirmed' ? (
                      <FiCheck className="w-4 h-4 text-green-400" />
                    ) : (
                      <FiX className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium">{payment.eventTitle}</div>
                    <div className="text-gray-400 text-sm">{formatDate(payment.bookingDate)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">${payment.totalAmount.toFixed(2)}</div>
                  <div className="text-gray-400 text-sm">{payment.currency.toUpperCase()}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Payment ID</div>
                  <div className="text-white font-mono">{payment.paymentIntentId}</div>
                </div>
                <div>
                  <div className="text-gray-400">Booking ID</div>
                  <div className="text-white">{payment.bookingId}</div>
                </div>
                <div>
                  <div className="text-gray-400">Status</div>
                  <div className={`font-medium ${
                    payment.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}