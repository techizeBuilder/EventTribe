import { FiShoppingCart } from 'react-icons/fi';
import { useCart } from '../hooks/useCart';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function CartIcon() {
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/cart');
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2 text-gray-300 hover:text-white transition-colors"
    >
      <FiShoppingCart className="w-6 h-6" />
      {cartCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
        >
          {cartCount > 99 ? '99+' : cartCount}
        </motion.span>
      )}
    </button>
  );
}