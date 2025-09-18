import { FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../hooks/useCart';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function CartIcon() {
  const { cartCount, fetchCart } = useCart();
  const navigate = useNavigate();

  // Debug logging
  console.log('[CartIcon] Rendering - cartCount:', cartCount);

  // Listen for cart events
  useEffect(() => {
    const handleCartEvent = async () => {
      console.log('[CartIcon] Cart event received, refreshing...');
      await fetchCart();
    };

    window.addEventListener('cartCleared', handleCartEvent);
    window.addEventListener('cartUpdated', handleCartEvent);

    return () => {
      window.removeEventListener('cartCleared', handleCartEvent);
      window.removeEventListener('cartUpdated', handleCartEvent);
    };
  }, [fetchCart]);

  const handleClick = () => {
    navigate('/cart');
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-300 hover:text-white transition-colors"
      title={`Cart (${cartCount} items)`}
    >
      <FiShoppingCart className="w-6 h-6" />

      {/* TEMPORARY DEBUG BADGE - Always shows if cartCount exists */}
      <div
        className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 rounded"
        style={{ zIndex: 1000 }}
      >
      </div>

      {cartCount > 0 && (
        <motion.span
          key={cartCount}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
          style={{ zIndex: 999 }}
        >
          {cartCount > 99 ? '99+' : cartCount}
        </motion.span>
      )}
    </button>
  );
}