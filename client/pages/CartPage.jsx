import { useState } from 'react'
import { motion } from 'framer-motion'
import { useCart } from '../hooks/useCart'
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import MultiEventPaymentModal from '../components/MultiEventPaymentModal'

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart()
  const navigate = useNavigate()
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(itemId)
    } else {
      await updateQuantity(itemId, newQuantity)
    }
  }

  const handleRemoveItem = async (itemId) => {
    await removeFromCart(itemId)
  }

  const handleClearCart = async () => {
    await clearCart()
  }

  const calculateTotal = () => {
    return cartItems?.reduce((total, item) => {
      return total + (item.ticketType.price * item.quantity)
    }, 0) || 0
  }

  const handleCheckout = () => {
    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    
    // Show payment modal for checkout
    setShowPaymentModal(true)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Back to Events
              </button>
              <h1 className="text-2xl font-bold">Shopping Cart</h1>
            </div>
            <div className="flex items-center space-x-2">
              <FiShoppingBag className="w-6 h-6" />
              <span className="text-lg font-semibold">
                {cartItems?.length || 0} items
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!cartItems || cartItems.length === 0 ? (
          /* Empty Cart */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <FiShoppingBag className="w-24 h-24 mx-auto text-slate-600 mb-6" />
            <h2 className="text-2xl font-bold text-slate-300 mb-4">Your cart is empty</h2>
            <p className="text-slate-400 mb-8">
              Looks like you haven't added any tickets to your cart yet.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Events
            </button>
          </motion.div>
        ) : (
          /* Cart Items */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Cart Items</h2>
                <button
                  onClick={handleClearCart}
                  className="text-red-400 hover:text-red-300 transition-colors flex items-center space-x-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Clear Cart</span>
                </button>
              </div>

              {cartItems?.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {item.eventTitle}
                      </h3>
                      <p className="text-slate-400 text-sm mb-2">
                        Ticket Type: {item.ticketType.name}
                      </p>
                      <p className="text-slate-400 text-sm mb-4">
                        {item.ticketType.description}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
                          >
                            <FiMinus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
                          >
                            <FiPlus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveItem(item._id)}
                          className="text-red-400 hover:text-red-300 transition-colors flex items-center space-x-1"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          <span className="text-sm">Remove</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Price per ticket</p>
                      <p className="text-xl font-bold text-white mb-2">
                        ${item.ticketType.price}
                      </p>
                      <p className="text-slate-400 text-sm">Subtotal</p>
                      <p className="text-xl font-bold text-blue-400">
                        ${(item.ticketType.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-800 rounded-lg p-6 border border-slate-700 sticky top-8"
              >
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Items ({cartItems?.length || 0})</span>
                    <span className="text-white">${calculateTotal().toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service Fee</span>
                    <span className="text-white">$2.50</span>
                  </div>
                  
                  <div className="border-t border-slate-700 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-white">Total</span>
                      <span className="text-lg font-bold text-blue-400">
                        ${(calculateTotal() + 2.50).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors mb-4"
                >
                  Proceed to Checkout
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Continue Shopping
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <MultiEventPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  )
}