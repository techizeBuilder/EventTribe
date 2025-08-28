import { FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../hooks/useCart';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function CartIcon() {
  const { cartCount, fetchCartCount } = useCart();
  const [displayCount, setDisplayCount] = useState(cartCount);
  const navigate = useNavigate();

  // Update display count whenever cartCount changes
  useEffect(() => {
    setDisplayCount(cartCount);
  }, [cartCount]);

  useEffect(() => {
    const handleCartUpdate = async () => {
      // Add a small delay to ensure backend operations are complete
      setTimeout(async () => {
        await fetchCartCount();
      }, 200);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [fetchCartCount]);

  const handleClick = () => {
    navigate('/cart');
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-300 hover:text-white transition-colors"
    >
      <FiShoppingCart className="w-6 h-6" />
      {displayCount > 0 && (
        <motion.span
          key={displayCount} // Force re-render on count change
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
        >
          {displayCount > 99 ? '99+' : displayCount}
        </motion.span>
      )}
    </button>
  );
}