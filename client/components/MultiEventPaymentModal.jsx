import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiLoader } from 'react-icons/fi';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#fff',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
    },
  },
};

function MultiEventPaymentForm({ onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const { getCartSummary, getTotalPrice, clearCart } = useCart();
  const { userEmail, userName } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cardErrors, setCardErrors] = useState({});

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const cartItems = getCartSummary();
      const totalAmount = getTotalPrice();

      console.log('Processing multi-event payment:', {
        cartItems,
        totalAmount,
        userEmail,
        userName
      });

      // Create payment intent for multiple events
      const response = await fetch('/api/create-multi-event-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems,
          amount: totalAmount,
          userEmail,
          userName
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const { clientSecret, paymentIntentId } = data;

      console.log('Multi-event payment intent created:', { clientSecret, paymentIntentId });

      if (!clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
        }
      });

      if (error) {
        console.error('Payment failed:', error);
        toast.error(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        // Save multi-event booking to backend
        try {
          console.log('Saving bookings with data:', {
            paymentIntentId: paymentIntent.id,
            items: cartItems,
            userEmail,
            userName
          });

          const bookingResponse = await fetch('/api/save-multi-event-booking', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              items: cartItems,
              userEmail,
              userName
            }),
          });

          const bookingData = await bookingResponse.json();

          if (bookingData.success) {
            toast.success('Payment successful! All tickets confirmed.');
            clearCart();
            onSuccess({ ...paymentIntent, bookings: bookingData.bookings });
          } else {
            throw new Error('Failed to save bookings');
          }
        } catch (bookingError) {
          console.error('Booking save error:', bookingError);
          toast.success('Payment successful!');
          clearCart();
          onSuccess(paymentIntent);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (field) => (event) => {
    setCardErrors(prev => ({
      ...prev,
      [field]: event.error ? event.error.message : null
    }));
  };

  const cartItems = getCartSummary();
  const totalAmount = getTotalPrice();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-gray-700"
      >
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Checkout</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-96 p-6">
          {/* Order Summary */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-3">Order Summary</h3>
            {cartItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm text-gray-300 mb-2">
                <span>{item.eventTitle} - {item.name} x {item.quantity}</span>
                <span>${item.total.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between items-center text-white font-semibold">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Card Number
              </label>
              <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 focus-within:border-blue-500 transition-colors">
                <CardNumberElement
                  options={CARD_ELEMENT_OPTIONS}
                  onChange={handleCardChange('cardNumber')}
                />
              </div>
              {cardErrors.cardNumber && (
                <p className="text-red-400 text-sm mt-1">{cardErrors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expiry Date
                </label>
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 focus-within:border-blue-500 transition-colors">
                  <CardExpiryElement
                    options={CARD_ELEMENT_OPTIONS}
                    onChange={handleCardChange('cardExpiry')}
                  />
                </div>
                {cardErrors.cardExpiry && (
                  <p className="text-red-400 text-sm mt-1">{cardErrors.cardExpiry}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CVC
                </label>
                <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 focus-within:border-blue-500 transition-colors">
                  <CardCvcElement
                    options={CARD_ELEMENT_OPTIONS}
                    onChange={handleCardChange('cardCvc')}
                  />
                </div>
                {cardErrors.cardCvc && (
                  <p className="text-red-400 text-sm mt-1">{cardErrors.cardCvc}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!stripe || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Pay ${totalAmount.toFixed(2)}</span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MultiEventPaymentModal({ isOpen, onClose }) {
  const { clearCart } = useCart();

  if (!isOpen) return null;

  const handleSuccess = (paymentResult) => {
    console.log('Payment successful:', paymentResult);
    toast.success('Payment successful! All tickets confirmed.');

    // Clear the cart after successful payment
    clearCart();

    onClose();
  };

  return (
    <Elements stripe={stripePromise}>
      <MultiEventPaymentForm onSuccess={handleSuccess} onClose={onClose} />
    </Elements>
  );
}