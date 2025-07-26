
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FiShoppingCart } from 'react-icons/fi'
import { useCart } from '../hooks/useCart'

export default function EventCard({ event, index }) {
  const { addToCart } = useCart()

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Create a default ticket if none exists
    let defaultTicket;
    if (event.tickets && event.tickets.length > 0) {
      defaultTicket = event.tickets[0]
    } else if (event.ticketTypes && event.ticketTypes.length > 0) {
      defaultTicket = event.ticketTypes[0]
    } else {
      // Create default ticket structure
      defaultTicket = {
        name: 'General Admission',
        price: 25.00,
        description: 'Standard event ticket'
      }
    }
    
    addToCart(event.id || event._id, event.title, defaultTicket, 1)
  }

  return (
    <div className="relative group">
      <Link to={`/event/${event.id}`}>
        <motion.div
          className="bg-slate-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700/50 event-card-hover font-sans cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          whileHover={{ y: -8, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative overflow-hidden">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-32 sm:h-40 md:h-48 object-cover"
            />
            <div className="absolute top-3 left-3">
              <span className="bg-slate-900/80 backdrop-blur-sm text-slate-300 text-xs font-medium px-3 py-1 rounded-full">
                {event.category}
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-4 md:p-6">
            <h3 className="text-white text-sm sm:text-base md:text-lg font-bold mb-2 sm:mb-3 leading-tight tracking-tight">
              {event.title}
            </h3>

            <div className="space-y-2">
              <div className="flex items-center text-slate-400 text-sm">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{event.date} • {event.time}</span>
              </div>

              <div className="flex items-center text-slate-400 text-sm">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{event.location}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-white font-semibold text-sm">
                From ${(() => {
                  if (event.tickets && event.tickets.length > 0) {
                    return event.tickets[0].price
                  } else if (event.ticketTypes && event.ticketTypes.length > 0) {
                    return event.ticketTypes[0].price
                  }
                  return '25.00'
                })()}
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
      
      {/* Add to Cart Button - Positioned within card content */}
      <motion.button
        onClick={handleAddToCart}
        className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiShoppingCart className="w-4 h-4" />
      </motion.button>
    </div>
  )
}
