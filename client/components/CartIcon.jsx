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

    </button>
  );
}