import React, { useState } from 'react';
import { useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import { FiCreditCard, FiLock } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';

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

export default function PaymentForm({ 
  amount, 
  eventId, 
  eventTitle, 
  ticketDetails, 
  onSuccess, 
  onError,
  loading,
  setLoading 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardErrors, setCardErrors] = useState({});
  const { userEmail, userName } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          eventId,
          eventTitle,
          ticketDetails
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const { clientSecret, paymentIntentId } = data;

      console.log('Payment intent created:', { clientSecret, paymentIntentId });

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
        onError(error);
      } else if (paymentIntent.status === 'succeeded') {
        // Save booking to backend
        try {
          console.log('Saving booking with data:', {
            paymentIntentId: paymentIntent.id,
            eventId,
            eventTitle,
            ticketDetails,
            userEmail: userEmail,
            userName: userName
          });
          
          const bookingResponse = await fetch('/api/save-booking', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              eventId,
              eventTitle,
              ticketDetails,
              userEmail: userEmail,
              userName: userName
            }),
          });

          const bookingData = await bookingResponse.json();
          
          if (bookingData.success) {
            toast.success('Payment successful! Booking confirmed.');
            onSuccess({ ...paymentIntent, booking: bookingData.booking });
          } else {
            throw new Error('Failed to save booking');
          }
        } catch (bookingError) {
          console.error('Booking save error:', bookingError);
          toast.success('Payment successful!');
          onSuccess(paymentIntent);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      onError(error);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <FiCreditCard className="inline w-4 h-4 mr-2" />
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
      </div>

      <div className="flex items-center text-gray-400 text-sm mt-4">
        <FiLock className="w-4 h-4 mr-2" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <FiLock className="w-4 h-4 mr-2" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </button>
    </form>
  );
}