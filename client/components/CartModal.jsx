import { motion } from 'framer-motion';
import { FiX, FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../utils/priceUtils';
import { useState } from 'react';
import MultiEventPaymentModal from './MultiEventPaymentModal';

export default function CartModal({ isOpen, onClose }) {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    setShowPaymentModal(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Shopping Cart</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-96 p-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Your cart is empty</p>
                <p className="text-gray-500 text-sm mt-2">Add some tickets to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-white font-medium text-sm">{item.eventTitle}</h3>
                        <p className="text-gray-400 text-xs">{item.ticketType.name}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <FiMinus className="w-3 h-3" />
                        </button>
                        <span className="text-white font-medium text-sm w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <FiPlus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-white font-medium">
                        {formatPrice(item.ticketType.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="p-6 border-t border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <span className="text-white font-bold">Total:</span>
                <span className="text-white font-bold text-lg">
                  {formatPrice(getTotalPrice())}
                </span>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Proceed to Checkout
                </button>
                <button
                  onClick={clearCart}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      <MultiEventPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          clearCart();
          setShowPaymentModal(false);
          onClose();
        }}
      />
    </>
  );
}