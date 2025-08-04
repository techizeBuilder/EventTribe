import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCheckCircle } from 'react-icons/fi';
import { useLocation } from 'wouter';
import { formatPrice } from '../utils/priceUtils';

export default function PaymentSuccess({ 
  eventTitle, 
  ticketDetails, 
  paymentIntent, 
  booking,
  onClose 
}) {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Auto-redirect to attendee dashboard after 3 seconds
    const timer = setTimeout(() => {
      onClose();
      navigate('/attendee-dashboard/my-bookings');
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose, navigate]);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-700 text-center"
      >
        <div className="mb-6">
          <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
          <p className="text-gray-300">
            Your tickets for <span className="font-semibold">{eventTitle}</span> have been purchased.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
          <h3 className="text-white font-semibold mb-3">Order Summary</h3>
          {ticketDetails.map((ticket, index) => (
            <div key={index} className="flex justify-between items-center text-sm text-gray-300 mb-2">
              <span>{ticket.name} x {ticket.quantity}</span>
              <span>{formatPrice(ticket.total)}</span>
            </div>
          ))}
          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="flex justify-between items-center text-white font-semibold">
              <span>Total Paid</span>
              <span>{formatPrice(paymentIntent.amount / 100)}</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-400 text-sm mb-4">
            You can view your tickets in the attendee dashboard
          </p>
          <p className="text-gray-500 text-xs">
            Redirecting to your dashboard in a few seconds...
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}