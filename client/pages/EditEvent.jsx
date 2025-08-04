import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiCheck,
  FiFileText,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiImage,
  FiUpload,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import {
  resizeImage,
  isValidImage,
  getFileSizeInMB,
  validateImageFile,
  compressImage,
} from "../utils/imageUtils";
import CustomCalendar from "../components/CustomCalendar";
import TicketModal from "../components/TicketModal";

export default function EditEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const eventData = location.state?.eventData;

  const [eventType, setEventType] = useState("ticketed"); // Default to ticketed for edit mode
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    venueName: "",
    address: "",
    startDate: "",
    endDate: "",
    eventDate: "",
    eventTime: "",
    eventEndDate: "",
    eventEndTime: "",
    description: "",
    isRecurring: false,
    ticketPrice: "",
    maxAttendees: "",
    category: "",
    showOnExplore: false,
  });

  const [tickets, setTickets] = useState([]);

  // Check user authentication and load event data
  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!token) {
      toast.error("Please login first to edit events");
      navigate("/login");
      return;
    }
    
    if (user.role !== "organizer") {
      toast.error("Only organizers can edit events. Please login as an organizer.");
      navigate("/login");
      return;
    }

    // Load event data if available
    if (eventData) {
      console.log("EditEvent - Loading event data:", eventData);
      setFormData({
        title: eventData.title || "",
        venueName: eventData.venue || "",
        address: eventData.address || "",
        startDate: eventData.startDate ? new Date(eventData.startDate).toISOString().slice(0, 16) : "",
        endDate: eventData.endDate ? new Date(eventData.endDate).toISOString().slice(0, 16) : "",
        eventDate: eventData.eventDate ? new Date(eventData.eventDate).toISOString().slice(0, 10) : "",
        eventTime: eventData.eventTime || "18:00",
        eventEndDate: eventData.eventEndDate ? new Date(eventData.eventEndDate).toISOString().slice(0, 10) : "",
        eventEndTime: eventData.eventEndTime || "22:00",
        description: eventData.description || "",
        isRecurring: eventData.isRecurring || false,
        ticketPrice: eventData.ticketTypes?.[0]?.price || "",
        maxAttendees: eventData.ticketTypes?.[0]?.quantity || "",
        category: eventData.category || "",
        showOnExplore: eventData.isPublic || false,
      });
      
      // Load existing tickets with all additional settings
      if (eventData.ticketTypes && eventData.ticketTypes.length > 0) {
        const existingTickets = eventData.ticketTypes.map((ticket, index) => ({
          id: ticket.id || Date.now() + index,
          name: ticket.name || "General Admission",
          description: ticket.description || "",
          price: ticket.price || 0,
          quantity: ticket.quantity || 100,
          sold: ticket.sold || 0,
          isActive: ticket.isActive !== false,
          availability: ticket.isActive !== false ? "Available" : "Sold Out",
          maxCartQty: ticket.maxCartQty || 10,
          // Include all additional settings
          enableSkipLine: ticket.enableSkipLine || false,
          passwordProtect: ticket.passwordProtect || false,
          enableBundle: ticket.enableBundle || false,
          enableEarlyBird: ticket.enableEarlyBird || false,
          coverTicket: ticket.coverTicket || false,
          enableComboTickets: ticket.enableComboTickets || false,
          enableWaitlist: ticket.enableWaitlist || false,
          hideTicket: ticket.hideTicket || false,
          // Dynamic fields that appear when checkboxes are enabled
          bundlePrice: ticket.bundlePrice || '',
          waitlistTicket: ticket.waitlistTicket || '',
          ticketPassword: ticket.ticketPassword || '',
          earlyBirdPrice: ticket.earlyBirdPrice || '',
          earlyBirdEndDate: ticket.earlyBirdEndDate || '',
          creditPrice: ticket.creditPrice || '',
        }));
        setTickets(existingTickets);
      }
      
      if (eventData.image || eventData.coverImage) {
        setImagePreview(eventData.image || eventData.coverImage);
      }

      // Set event type based on whether it has tickets
      setEventType(eventData.ticketTypes && eventData.ticketTypes.length > 0 ? "ticketed" : "rsvp");
    } else {
      // If no event data passed, redirect back
      toast.error("No event data found");
      navigate("/organizer/events");
    }
  }, [eventData, navigate]);

  // Cleanup function for object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addTicket = () => {
    setEditingTicket(null);
    setTicketModalOpen(true);
  };

  const editTicket = (ticket) => {
    console.log('EditEvent - editing ticket:', ticket); // Debug log
    setEditingTicket(ticket);
    setTicketModalOpen(true);
  };

  const removeTicket = (ticketId) => {
    setTickets(tickets.filter((ticket) => ticket.id !== ticketId));
    toast.success("Ticket removed successfully");
  };

  const handleTicketSave = (ticketData) => {
    if (editingTicket) {
      setTickets(
        tickets.map((ticket) =>
          ticket.id === editingTicket.id ? ticketData : ticket,
        ),
      );
    } else {
      setTickets([...tickets, ticketData]);
    }
    setTicketModalOpen(false);
    setEditingTicket(null);
  };

  const addTicketGroup = () => {
    const groupTickets = [
      {
        id: Date.now(),
        name: "Early Bird",
        description: "Early access discount - limited time offer",
        price: 25,
        quantity: 50,
        isActive: true,
        enableEarlyBird: true,
        availability: "Available",
        maxCartQty: 5,
      },
      {
        id: Date.now() + 1,
        name: "General Admission",
        description: "Standard event entry",
        price: 35,
        quantity: 200,
        isActive: true,
        availability: "Available",
        maxCartQty: 10,
      },
      {
        id: Date.now() + 2,
        name: "VIP Experience",
        description: "Premium access with special perks",
        price: 75,
        quantity: 25,
        isActive: true,
        enableSkipLine: true,
        availability: "Available",
        maxCartQty: 4,
      },
    ];
    setTickets([...tickets, ...groupTickets]);
    toast.success(
      "Added 3 ticket types: Early Bird, General Admission, and VIP Experience",
    );
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Enhanced validation with user-friendly messages
    const validation = validateImageFile(file, 10); // 10MB limit
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    try {
      // Show loading toast for large files
      const fileSizeMB = getFileSizeInMB(file);
      if (fileSizeMB > 2) {
        toast.loading(`Processing large image (${fileSizeMB}MB)... Please wait.`);
      }

      // Create immediate preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Compress image for better performance and smaller payload
      const compressedImage = await compressImage(file, 1200, 800, 0.8, 500);
      
      // Create a blob from the base64 string
      const compressedBlob = await fetch(compressedImage).then(r => r.blob());
      const compressedFile = new File([compressedBlob], file.name, { type: file.type });
      
      setSelectedImage(compressedFile);
      
      // Store compressed base64 for submission
      setFormData((prev) => ({ ...prev, imageData: compressedImage }));

      toast.dismiss(); // Remove loading toast
      toast.success("Image updated successfully!");
    } catch (error) {
      console.error("Error processing image:", error);
      toast.dismiss(); // Remove loading toast
      toast.error("Error processing image. Please try a smaller image or different format.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (
        !formData.title ||
        !formData.venueName ||
        !formData.startDate ||
        !formData.endDate
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Validate tickets for ticketed events
      if (eventType === "ticketed" && tickets.length === 0) {
        toast.error("Please add at least one ticket for ticketed events");
        return;
      }

      // Prepare form data for submission
      const updatedEventData = {
        title: formData.title,
        description: formData.description,
        venue: formData.venueName,
        address: formData.address,
        startDate: formData.startDate,
        endDate: formData.endDate,
        eventDate: formData.eventDate,
        eventTime: formData.eventTime,
        eventEndDate: formData.eventEndDate,
        eventEndTime: formData.eventEndTime,
        category: formData.category || "General",
        locationType: "physical",
        isPublic: formData.showOnExplore,
        allowRefunds: true,
        // Use updated image or keep existing one
        image: formData.imageData || imagePreview || eventData.image || eventData.coverImage,
        ticketTypes: eventType === "ticketed" ? tickets.map((ticket) => ({
          name: ticket.name,
          description: ticket.description,
          price: parseFloat(ticket.price) || 0,
          quantity: parseInt(ticket.quantity) || 100,
          sold: ticket.sold || 0,
          isActive: ticket.isActive !== false,
          saleStartDate: new Date().toISOString(),
          saleEndDate: formData.endDate,
          perks: ticket.perks || [],
        })) : [],
      };

      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      console.log("Updating event with data:", updatedEventData);

      const response = await fetch(`/api/organizer/events/${eventData._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedEventData),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        toast.success("Event updated successfully!");
        // Redirect to events page
        navigate("/organizer/events");
      } else {
        let errorMessage = "Unknown error occurred";
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || "Failed to update event";
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        
        if (response.status === 401) {
          toast.error("Your session has expired. Please login again as an organizer.");
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          navigate("/login");
        } else if (response.status === 403) {
          toast.error("You don't have permission to update events. Please login as an organizer.");
          navigate("/login");
        } else {
          toast.error(`Error updating event: ${errorMessage}`);
          console.error("Event update error:", {
            status: response.status,
            statusText: response.statusText,
            message: errorMessage
          });
        }
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate("/organizer/events");
  };

  // Form Screen - Since we're editing, we skip the event type selection
  return (
    <div className="min-h-screen bg-black px-4 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <motion.button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            whileHover={{ x: -4 }}
          >
            ← Back to events
          </motion.button>
          <h1 className="text-white text-2xl font-bold">Edit Event</h1>
          <div></div> {/* Spacer for flex layout */}
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
          {/* Left Side - Add Flyer Section */}
          <div className="lg:w-1/3">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg p-4 sm:p-6 md:p-8 text-center h-64 sm:h-72 md:h-80 flex flex-col items-center justify-center relative"
            >
              {imagePreview ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Event flyer preview"
                    className="w-full h-32 sm:h-40 md:h-48 object-cover rounded-lg mb-3 sm:mb-4"
                  />
                  <p className="text-white text-xs sm:text-sm mb-2 sm:mb-3">
                    Current event image
                  </p>
                  <label
                    htmlFor="imageUpload"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg cursor-pointer transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2"
                  >
                    <FiUpload className="w-3 h-3 sm:w-4 sm:h-4" />
                    Change Image
                  </label>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, showOnExplore: !prev.showOnExplore }))}
                    className={`mt-2 text-xs px-2 py-1 rounded transition-colors ${
                      formData.showOnExplore 
                        ? "bg-green-600 text-white" 
                        : "bg-gray-600 text-gray-300"
                    }`}
                  >
                    {formData.showOnExplore ? "✓ " : ""}Show on Explore
                  </button>
                </div>
              ) : (
                <div>
                  <FiImage className="w-16 h-16 text-gray-500 mb-4" />
                  <h3 className="text-white text-xl font-bold mb-2">
                    Add Flyer
                  </h3>
                  <p className="text-gray-400 text-sm mb-1">
                    OPTIMAL SIZE: 1500 X 1500 PIXELS
                  </p>
                  <p className="text-gray-400 text-sm mb-2">
                    Max size: 10MB • Supports JPEG, PNG, GIF, WebP
                  </p>
                  <p className="text-gray-400 text-xs mb-4">
                    Large images will be automatically optimized for faster loading
                  </p>
                  <label
                    htmlFor="imageUpload"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors font-medium flex items-center gap-2 mx-auto"
                  >
                    <FiUpload className="w-4 h-4" />
                    Upload Image
                  </label>
                </div>
              )}
              <input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </motion.div>
          </div>

          {/* Right Side - Form Section */}
          <div className="lg:w-2/3">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Basic Information Section */}
              <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <FiFileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                  <h2 className="text-white text-lg sm:text-xl font-bold">
                    Basic Information
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Event Title */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Event Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter event title"
                      className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  {/* Venue and Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Venue Name
                      </label>
                      <input
                        type="text"
                        name="venueName"
                        value={formData.venueName}
                        onChange={handleInputChange}
                        placeholder="Enter venue name"
                        className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter venue address"
                        className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Date & Time Section */}
              <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <FiCalendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                  <h2 className="text-white text-lg sm:text-xl font-bold">
                    Event Date & Time
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Event Date
                    </label>
                    <input
                      type="date"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Event Time
                    </label>
                    <input
                      type="time"
                      name="eventTime"
                      value={formData.eventTime}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Event End Date
                    </label>
                    <input
                      type="date"
                      name="eventEndDate"
                      value={formData.eventEndDate}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Event End Time
                    </label>
                    <input
                      type="time"
                      name="eventEndTime"
                      value={formData.eventEndTime}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Availability Section */}
              <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <FiCalendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                  <h2 className="text-white text-lg sm:text-xl font-bold">
                    Booking Availability
                  </h2>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  Set when customers can start and stop booking tickets for this event
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Booking Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Booking End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <FiFileText className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                  <h2 className="text-white text-lg sm:text-xl font-bold">
                    Description
                  </h2>
                </div>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell people about your event..."
                  className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 h-24 sm:h-32 resize-none"
                />
              </div>

              {/* Category Section */}
              <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <FiMapPin className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                  <h2 className="text-white text-lg sm:text-xl font-bold">
                    Category
                  </h2>
                </div>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Select Category</option>
                  <option value="Music">Music</option>
                  <option value="Arts">Arts</option>
                  <option value="Sports">Sports</option>
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Food">Food & Drink</option>
                  <option value="Health">Health & Wellness</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Community">Community</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Ticketing Section */}
              {eventType === "ticketed" && (
                <div className="bg-gray-900 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <FiUsers className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                      <h2 className="text-white text-lg sm:text-xl font-bold">
                        Tickets ({tickets.length})
                      </h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={addTicket}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                      >
                        + Add Ticket
                      </button>
                      <button
                        type="button"
                        onClick={addTicketGroup}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                      >
                        + Add Group
                      </button>
                    </div>
                  </div>

                  {/* Tickets List */}
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-medium text-sm sm:text-base">
                              {ticket.name}
                            </h4>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                ticket.availability === "Available"
                                  ? "bg-green-600 text-white"
                                  : "bg-red-600 text-white"
                              }`}
                            >
                              {ticket.availability}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs sm:text-sm mb-2">
                            {ticket.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs sm:text-sm">
                            <span className="text-green-400 font-medium">
                              ${ticket.price}
                            </span>
                            <span className="text-gray-400">
                              Qty: {ticket.quantity}
                            </span>
                            {ticket.sold > 0 && (
                              <span className="text-blue-400">
                                Sold: {ticket.sold}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            type="button"
                            onClick={() => editTicket(ticket)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeTicket(ticket.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    {tickets.length === 0 && (
                      <div className="text-center py-6 sm:py-8">
                        <FiUsers className="w-8 h-8 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3 sm:mb-4" />
                        <p className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4">
                          No tickets added yet
                        </p>
                        <button
                          type="button"
                          onClick={addTicket}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base"
                        >
                          Add Your First Ticket
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Update Event Button */}
              <motion.button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full font-bold py-4 px-6 rounded-lg transition-colors text-lg ${
                  isSubmitting
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              >
                {isSubmitting ? "UPDATING EVENT..." : "UPDATE EVENT"}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      <TicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        onSave={handleTicketSave}
        editingTicket={editingTicket}
      />
    </div>
  );
}