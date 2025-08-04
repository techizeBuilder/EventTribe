import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "../utils/priceUtils";
import {
  FiMapPin,
  FiCalendar,
  FiClock,
  FiX,
  FiPlus,
  FiMinus,
  FiShoppingCart,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "../components/PaymentForm";
import PaymentSuccess from "../components/PaymentSuccess";
import { useCart } from "../hooks/useCart";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [showMore, setShowMore] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [completedPayment, setCompletedPayment] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    instagram: "",
    phone: "",
    subject: "",
    message: "",
  });

  // Fetch event data from API
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Event not found");
          } else {
            setError("Failed to load event");
          }
          return;
        }

        const eventData = await response.json();
        setEvent(eventData);
      } catch (err) {
        console.error("Error fetching event:", err);
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-red-200">Loading event details...</p>
        </div>
      </div>
    );
  }

  // Error or event not found state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Event not found</h2>
          <p className="text-red-200">
            The event you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleQuantityChange = (ticketId, change) => {
    setSelectedTickets((prev) => {
      const current = prev[ticketId] || 0;
      const ticket = event.ticketTypes?.[ticketId];

      if (!ticket) return prev;

      const remainingQuantity = ticket.quantity - (ticket.sold || 0);
      const maxAllowedQty = Math.min(
        ticket.maxCartQty || 10,
        remainingQuantity,
      );

      const newQuantity = Math.max(
        0,
        Math.min(maxAllowedQty, current + change),
      );

      if (newQuantity === 0) {
        const { [ticketId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ticketId]: newQuantity };
    });
  };

  const getTotalAmount = () => {
    return Object.entries(selectedTickets).reduce(
      (total, [ticketId, quantity]) => {
        const ticket = event.ticketTypes?.[parseInt(ticketId)];
        return total + (ticket ? ticket.price * quantity : 0);
      },
      0,
    );
  };

  const getTotalQuantity = () => {
    return Object.values(selectedTickets).reduce(
      (total, quantity) => total + quantity,
      0,
    );
  };

  const handleCheckout = () => {
    if (getTotalQuantity() > 0) {
      setShowCheckout(true);
    }
  };

  const handleContactOrganizer = () => {
    setShowContactModal(true);
  };

  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    console.log("Contact form submitted:", contactForm);
    // Handle form submission logic here
    setShowContactModal(false);
    // Reset form
    setContactForm({
      name: "",
      email: "",
      instagram: "",
      phone: "",
      subject: "",
      message: "",
    });
  };

  const handlePaymentSuccess = (paymentData) => {
    setPaymentSuccess(true);
    setShowCheckout(false);
    setCompletedPayment({
      paymentIntent: paymentData,
      booking: paymentData.booking || null,
      eventTitle: event.title,
      ticketDetails: getTicketDetails(),
      selectedTickets: { ...selectedTickets },
    });

    // Show success message
    toast.success("Payment successful! Your tickets have been purchased.");
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    toast.error("Payment failed. Please try again.");
  };

  const getTicketDetails = () => {
    return Object.entries(selectedTickets).map(([ticketId, quantity]) => {
      const ticket = event.ticketTypes?.[parseInt(ticketId)];
      return {
        ticketId,
        name: ticket?.name || "General Admission",
        price: ticket?.price || 0,
        quantity,
        total: (ticket?.price || 0) * quantity,
      };
    });
  };

  // Helper function to check if event has expired
  const isEventExpired = () => {
    if (!event?.endDate) return false;
    const currentDate = new Date();
    const eventEndDate = new Date(event.endDate);
    return currentDate > eventEndDate;
  };

  // Helper function to handle expired event actions
  const handleExpiredEventAction = () => {
    toast.error("This event is no longer available for booking as the last date has passed.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex lg:flex-row flex-col gap-8">
            {/* Left Column - Event Poster */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 flex-shrink-0"
            >
              <div className="sticky top-24">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={
                      event.image ||
                      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop"
                    }
                    alt={event.title}
                    className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[700px] object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop";
                    }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Right Column - Event Details */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:w-1/2 space-y-6"
            >
              {/* Event Title & Info */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-white font-bold text-2xl sm:text-3xl lg:text-4xl mb-2 leading-tight">
                    {event.title}
                  </h1>
                  <p className="text-gray-300 text-lg font-medium mb-4">
                    {event.category} Event
                  </p>
                  <div className="flex items-center text-gray-300 mb-4">
                    <span className="text-sm">ORGANIZED BY EVENT PLATFORM</span>
                    <span className="ml-2 text-red-400">✓</span>
                  </div>
                </div>

                {/* Date and Location */}
                <div className="space-y-3">
                  <div className="flex items-center text-gray-300">
                    <FiCalendar className="w-5 h-5 mr-3 text-red-400" />
                    <div>
                      <div className="font-medium">
                        {event.startDate 
                          ? new Date(event.startDate).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long", 
                              day: "numeric",
                              year: "numeric"
                            })
                          : "Date TBD"
                        }
                      </div>
                      {event.endDate && event.endDate !== event.startDate && (
                        <div className="text-sm text-gray-400">
                          Ends: {new Date(event.endDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric", 
                            year: "numeric"
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <FiClock className="w-5 h-5 mr-3 text-red-400" />
                    <span>
                      {event.startDate
                        ? new Date(event.startDate).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "Time TBD"
                      }
                    </span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <FiMapPin className="w-5 h-5 mr-3 text-red-400" />
                    <span>{event.location || event.venue || "Location TBD"}</span>
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div className="border-t border-gray-600 pt-6">
                <p className="text-gray-200 text-lg font-medium mb-4">
                  {event.description}
                </p>

                <div className="space-y-2 mb-4">
                  <p className="text-gray-300 text-sm">
                    📍 {event.address || event.location}
                  </p>
                  <p className="text-gray-300 text-sm">
                    📅{" "}
                    {event.startDate
                      ? new Date(event.startDate).toLocaleDateString()
                      : "Date TBD"}
                  </p>
                  {event.locationType && (
                    <p className="text-gray-300 text-sm">
                      🏢{" "}
                      {event.locationType === "physical"
                        ? "In-person Event"
                        : "Virtual Event"}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setShowMore(!showMore)}
                  className="text-gray-400 text-sm underline hover:text-gray-200 transition-colors"
                >
                  {showMore ? "VIEW LESS" : "VIEW MORE"}
                </button>

                {showMore && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-600"
                  >
                    <p className="text-gray-300 text-sm">
                      Additional event information would go here. This could
                      include venue details, parking information, age
                      restrictions, dress code specifics, and more.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Tickets Section */}
              <div className="border-t border-gray-600 pt-6">
                <div className="space-y-4">
                  <h3 className="text-white text-xl font-bold">Tickets</h3>

                  {event.ticketTypes && event.ticketTypes.length > 0 ? (
                    event.ticketTypes
                      .filter((ticket) => !ticket.hideTicket && ticket.isActive !== false)
                      .map((ticket, index) => {
                        const remainingQuantity = ticket.quantity - (ticket.sold || 0);
                        const maxAllowedQty = Math.min(
                          ticket.maxCartQty || 10,
                          remainingQuantity || ticket.quantity || 100,
                        );

                        return (
                          <div
                            key={index}
                            className="bg-black/40 border border-gray-600 rounded-lg p-4 backdrop-blur-sm"
                          >
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-white font-bold text-lg">
                                    {ticket.name}
                                  </h3>
                                  {ticket.enableSkipLine && (
                                    <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded">
                                      Skip Line
                                    </span>
                                  )}
                                  {ticket.enableEarlyBird && (
                                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                                      Early Bird
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-400 text-sm mb-2">
                                  {ticket.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                  <span>Available: {remainingQuantity}</span>
                                  <span>
                                    Max per order: {ticket.maxCartQty || 10}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right w-full sm:w-auto">
                                <div className="flex items-center gap-2 justify-end mb-2">
                                  {ticket.displayPrice &&
                                    ticket.displayPrice !== ticket.price && (
                                      <span className="text-gray-400 line-through text-sm">
                                        {formatPrice(ticket.displayPrice)}
                                      </span>
                                    )}
                                  <p className="text-white font-bold text-xl">
                                    $
                                    {ticket.price
                                      ? formatPrice(ticket.price)
                                      : "0.00"}
                                  </p>
                                </div>

                                {/* Check if event is expired */}
                                {isEventExpired() ? (
                                  <div className="text-center">
                                    <p className="text-red-400 text-sm mb-2 font-medium">
                                      Event has ended
                                    </p>
                                    <button
                                      onClick={handleExpiredEventAction}
                                      className="bg-gray-600 cursor-not-allowed text-gray-300 px-4 py-2 rounded-lg text-sm font-medium"
                                      disabled
                                    >
                                      Booking Unavailable
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col space-y-2 sm:space-y-3">
                                    <div className="flex items-center space-x-2 justify-center sm:justify-start">
                                      <button
                                        onClick={() =>
                                          handleQuantityChange(index, -1)
                                        }
                                        className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center transition-colors"
                                        disabled={!selectedTickets[index]}
                                      >
                                        <FiMinus className="w-4 h-4" />
                                      </button>
                                      <span className="w-8 text-center text-white font-medium">
                                        {selectedTickets[index] || 0}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleQuantityChange(index, 1)
                                        }
                                        className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 text-black flex items-center justify-center transition-colors"
                                        disabled={false}
                                      >
                                        <FiPlus className="w-4 h-4" />
                                      </button>
                                    </div>
                                    {selectedTickets[index] > 0 && (
                                      <button
                                        onClick={() => {
                                          addToCart(
                                            event.id || event._id,
                                            event.title,
                                            ticket,
                                            selectedTickets[index],
                                          );
                                          setSelectedTickets((prev) => ({
                                            ...prev,
                                            [index]: 0,
                                          }));
                                        }}
                                        className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors text-sm"
                                      >
                                        <FiShoppingCart className="w-3 h-3" />
                                        <span>Add to Cart</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                                </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="bg-black/40 border border-gray-600 rounded-lg p-4 backdrop-blur-sm">
                      <p className="text-gray-300 text-center">
                        {isEventExpired() 
                          ? "This event is no longer available for booking as the last date has passed."
                          : "No tickets available for this event"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Organizer Button */}
              <div className="pt-6">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">O</span>
                  </div>
                </div>
                <button
                  onClick={handleContactOrganizer}
                  className="w-full bg-white hover:bg-gray-100 text-black font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-full transition-colors text-sm sm:text-base"
                >
                  CONTACT ORGANIZER
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-4 sm:p-6 max-w-lg w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-white text-lg sm:text-xl font-bold">
                  Checkout - {event.ticketTypes?.[0]?.currency || "$"}{" "}
                  {formatPrice(getTotalAmount())}
                </h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {Object.entries(selectedTickets).map(([ticketId, quantity]) => {
                  const ticket = event.ticketTypes?.[parseInt(ticketId)];
                  if (!ticket) return null;

                  return (
                    <div
                      key={ticketId}
                      className="flex justify-between items-center text-white"
                    >
                      <div>
                        <p className="font-medium">{ticket.name}</p>
                        <p className="text-sm text-gray-400">
                          Quantity: {quantity}
                        </p>
                      </div>
                      <p className="font-bold">
                        {ticket.currency || "$"}{" "}
                        {formatPrice(ticket.price * quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-700 pt-4 mb-6">
                <div className="flex justify-between items-center text-white">
                  <p className="text-lg font-bold">Total</p>
                  <p className="text-lg font-bold">
                    {event.ticketTypes?.[0]?.currency || "$"}{" "}
                    {formatPrice(getTotalAmount())}
                  </p>
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    amount={getTotalAmount()}
                    eventId={event.id}
                    eventTitle={event.title}
                    ticketDetails={getTicketDetails()}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    loading={paymentLoading}
                    setLoading={setPaymentLoading}
                  />
                </Elements>

                <button
                  onClick={() => setShowCheckout(false)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Continue Shopping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Host Modal */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-600 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white text-2xl font-bold">
                  Contact Your Host
                </h2>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactFormChange}
                    placeholder="Your Name"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactFormChange}
                    placeholder="Your Email"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                    required
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Instagram
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      @
                    </span>
                    <input
                      type="text"
                      name="instagram"
                      value={contactForm.instagram}
                      onChange={handleContactFormChange}
                      placeholder="username"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleContactFormChange}
                    placeholder="Your Phone"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleContactFormChange}
                    placeholder="Subject"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500"
                    required
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactFormChange}
                    placeholder="Your Message"
                    rows="4"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Send Message
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Checkout Button */}
      {getTotalQuantity() > 0 && !showCheckout && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
        >
          <button
            onClick={handleCheckout}
            className="bg-black/80 backdrop-blur-sm text-white font-bold py-3 px-8 rounded-full border border-gray-600 hover:bg-black transition-colors flex items-center space-x-2"
          >
            <span>
              Checkout - {event.ticketTypes?.[0]?.currency || "$"}{" "}
              {formatPrice(getTotalAmount())}
            </span>
            <FiX className="w-5 h-5 rotate-45" />
          </button>
        </motion.div>
      )}

      {/* Payment Success Modal */}
      <AnimatePresence>
        {completedPayment && (
          <PaymentSuccess
            eventTitle={completedPayment.eventTitle}
            ticketDetails={completedPayment.ticketDetails}
            paymentIntent={completedPayment.paymentIntent}
            booking={completedPayment.booking}
            onClose={() => {
              setCompletedPayment(null);
              setSelectedTickets({});
              navigate("/");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventDetailsPage;
