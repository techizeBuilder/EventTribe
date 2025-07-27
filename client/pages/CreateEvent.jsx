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
  FiCopy,
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

export default function CreateEvent() {
  const [eventType, setEventType] = useState(null);
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
    description: "",
    isRecurring: false,
    ticketPrice: "",
    maxAttendees: "",
    capacity: "",
    category: "",
    showOnExplore: false,
    eventType: "",
    status: "",
    price: "",
    location: "",
    venue: "",
  });

  const [tickets, setTickets] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);

  // Check user authentication and role on component mount
  useEffect(() => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("authToken");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token) {
      toast.error("Please login first to create events");
      navigate("/login");
      return;
    }

    if (user.role !== "organizer") {
      toast.error(
        "Only organizers can create events. Please login as an organizer.",
      );
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Handle duplicate mode - load pre-filled data
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const duplicate = urlParams.get('duplicate');
    
    if (duplicate === 'true') {
      setIsDuplicateMode(true);
      const duplicateEventData = localStorage.getItem('duplicateEventData');
      
      if (duplicateEventData) {
        try {
          const eventData = JSON.parse(duplicateEventData);
          console.log('Loading duplicate event data:', eventData);
          
          // Pre-fill ALL form data including dates, capacity, venue, etc.
          setFormData({
            title: eventData.title || "",
            venueName: eventData.venueName || eventData.venue || "",
            address: eventData.address || eventData.location || "",
            startDate: eventData.startDate || "", // Keep original dates
            endDate: eventData.endDate || "", // Keep original dates
            description: eventData.description || "",
            isRecurring: eventData.isRecurring || false,
            ticketPrice: eventData.ticketPrice || eventData.price || "",
            maxAttendees: eventData.maxAttendees || eventData.capacity || "",
            capacity: eventData.capacity || eventData.maxAttendees || "",
            category: eventData.category || "",
            showOnExplore: eventData.showOnExplore || false,
            eventType: eventData.eventType || "",
            status: eventData.status || "",
            price: eventData.price || eventData.ticketPrice || "",
            location: eventData.location || eventData.address || "",
            venue: eventData.venue || eventData.venueName || "",
          });

          // Pre-fill tickets if they exist
          if (eventData.tickets && Array.isArray(eventData.tickets)) {
            const duplicatedTickets = eventData.tickets.map(ticket => ({
              ...ticket,
              id: Date.now() + Math.random(), // Generate new IDs for duplicated tickets
              sold: 0, // Reset sold count for new event
            }));
            setTickets(duplicatedTickets);
          }

          // Set event type if it exists, default to 'ticketed' if not specified
          if (eventData.eventType) {
            setEventType(eventData.eventType);
          } else if (eventData.tickets && eventData.tickets.length > 0) {
            setEventType('ticketed');
          } else {
            setEventType('rsvp');
          }

          // Handle image duplication if exists
          if (eventData.image || eventData.imageUrl) {
            const imageUrl = eventData.image || eventData.imageUrl;
            setImagePreview(imageUrl);
            // Note: We can't set selectedImage file object, but we can show the preview
          }

          // Clear the duplicate data from localStorage after loading
          localStorage.removeItem('duplicateEventData');
          
          toast.success('Event data loaded for duplication. All fields have been pre-filled - please review and update as needed.');
        } catch (error) {
          console.error('Error loading duplicate event data:', error);
          toast.error('Failed to load event data for duplication');
        }
      }
    }
  }, [location]);

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
        toast.loading(
          `Processing large image (${fileSizeMB}MB)... Please wait.`,
        );
      }

      // Create immediate preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Compress image for better performance and smaller payload
      const compressedImage = await compressImage(file, 1200, 800, 0.8, 500);

      // Create a blob from the base64 string
      const compressedBlob = await fetch(compressedImage).then((r) => r.blob());
      const compressedFile = new File([compressedBlob], file.name, {
        type: file.type,
      });

      setSelectedImage(compressedFile);

      // Store compressed base64 for submission
      setFormData((prev) => ({ ...prev, imageData: compressedImage }));

      toast.dismiss(); // Remove loading toast
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Error processing image:", error);
      toast.dismiss(); // Remove loading toast
      toast.error(
        "Error processing image. Please try a smaller image or different format.",
      );
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

      // For unified system, tickets are optional but recommended
      // Remove strict validation to allow both RSVP and ticketed events to have tickets

      // Prepare form data for submission
      const eventData = {
        title: formData.title,
        description: formData.description,
        venue: formData.venueName,
        address: formData.address,
        startDate: formData.startDate,
        endDate: formData.endDate,
        category: formData.category || "General",
        locationType: "physical",
        status: "draft",
        isPublic: formData.showOnExplore,
        allowRefunds: true,
        eventType: eventType, // Fix: Include the actual eventType
        // Use actual uploaded image data
        image: formData.imageData || null,
        ticketTypes: tickets.map((ticket) => ({
          name: ticket.name,
          description: ticket.description,
          price: parseFloat(ticket.price) || 0,
          quantity: parseInt(ticket.quantity) || 0,
          sold: 0,
          isActive: ticket.isActive !== false, // Default to true
          availability: ticket.availability || "Available",
          maxCartQty: parseInt(ticket.maxCartQty) || 10,
          saleStartDate: new Date().toISOString(),
          saleEndDate: formData.endDate,
          perks: [],
          // Include all additional settings
          enableSkipLine: ticket.enableSkipLine || false,
          passwordProtect: ticket.passwordProtect || false,
          enableBundle: ticket.enableBundle || false,
          enableEarlyBird: ticket.enableEarlyBird || false,
          coverTicket: ticket.coverTicket || false,
          enableComboTickets: ticket.enableComboTickets || false,
          enableWaitlist: ticket.enableWaitlist || false,
          hideTicket: ticket.hideTicket || false,
          bundlePrice: ticket.bundlePrice || "",
          waitlistTicket: ticket.waitlistTicket || "",
          ticketPassword: ticket.ticketPassword || "",
          bundleQuantity: ticket.bundleQuantity || "",
          earlyBirdPrice: ticket.earlyBirdPrice || "",
          earlyBirdDate: ticket.earlyBirdDate || "",
          creditPrice: ticket.creditPrice || "",
        })),
        totalRevenue: 0,
        totalTicketsSold: 0,
        views: 0,
        uniqueViews: 0,
        socialShares: 0,
      };

      // Submit to backend
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!token) {
        toast.error("Please login first to create events");
        navigate("/login");
        return;
      }

      if (user.role !== "organizer") {
        toast.error(
          "Only organizers can create events. Please login as an organizer.",
        );
        navigate("/login");
        return;
      }

      console.log("Creating event with data:", eventData);
      console.log("User role:", user.role);
      console.log("Token exists:", !!token);

      const response = await fetch("/api/organizer/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const newEvent = await response.json();
        toast.success("Event created successfully!");
        // Clear form data
        setFormData({
          title: "",
          venueName: "",
          address: "",
          startDate: "",
          endDate: "",
          description: "",
          isRecurring: false,
          ticketPrice: "",
          maxAttendees: "",
          category: "",
          showOnExplore: false,
        });
        setTickets([]);
        setSelectedImage(null);
        setImagePreview(null);
        setEventType(null);
        // Redirect to events page
        navigate("/organizer/events");
      } else {
        let errorMessage = "Unknown error occurred";
        try {
          const error = await response.json();
          errorMessage =
            error.message || error.error || "Failed to create event";
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }

        if (response.status === 401) {
          toast.error(
            "Your session has expired. Please login again as an organizer.",
          );
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          navigate("/login");
        } else if (response.status === 403) {
          toast.error(
            "You don't have permission to create events. Please login as an organizer.",
          );
          navigate("/login");
        } else {
          toast.error(`Error creating event: ${errorMessage}`);
          console.error("Event creation error:", {
            status: response.status,
            statusText: response.statusText,
            message: errorMessage,
          });
        }
      }
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEventTypeSelect = (type) => {
    setEventType(type);
  };

  const handleBack = () => {
    setEventType(null);
  };

  // Event Type Selection Screen
  if (!eventType) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray via-orange-gray to-red-gray"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-4 border-red-600/30 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border-2 border-orange-500/20"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12">
              What kind of event is it?
            </h1>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <motion.button
                onClick={() => handleEventTypeSelect("rsvp")}
                className="group relative bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 hover:border-gray-500 rounded-lg p-4 sm:p-8 w-full sm:w-48 h-24 sm:h-32 flex flex-col items-center justify-center transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiCheck className="w-6 sm:w-8 h-6 sm:h-8 text-white mb-2 sm:mb-3 group-hover:text-blue-400 transition-colors" />
                <span className="text-white font-semibold text-sm sm:text-lg">
                  RSVP ONLY
                </span>
              </motion.button>

              <motion.button
                onClick={() => handleEventTypeSelect("ticketed")}
                className="group relative bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 hover:border-gray-500 rounded-lg p-4 sm:p-8 w-full sm:w-48 h-24 sm:h-32 flex flex-col items-center justify-center transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiFileText className="w-6 sm:w-8 h-6 sm:h-8 text-white mb-2 sm:mb-3 group-hover:text-blue-400 transition-colors" />
                <span className="text-white font-semibold text-sm sm:text-lg">
                  TICKETED
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Form Screen
  return (
    <div className="min-h-screen bg-black px-4 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto">
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
                    className="max-w-full max-h-48 object-contain rounded-lg mb-4"
                  />
                  <p className="text-white text-sm mb-2">
                    {selectedImage?.name}
                  </p>
                  <button
                    onClick={() =>
                      document.getElementById("imageInput").click()
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <>
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
                    Large images will be automatically optimized for faster
                    loading
                  </p>

                  <button
                    onClick={() =>
                      document.getElementById("imageInput").click()
                    }
                    className="bg-white text-black font-semibold px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors mb-4 flex items-center gap-2"
                  >
                    <FiUpload className="w-4 h-4" />
                    Upload Image
                  </button>
                </>
              )}

              <input
                id="imageInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              <div className="flex items-center text-gray-400 text-sm mt-auto">
                <input
                  type="checkbox"
                  name="showOnExplore"
                  checked={formData.showOnExplore}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span>Show on Explore</span>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Form */}
          <div className="lg:w-2/3">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Organization Header */}
              <div className="text-center mb-6">
                <h2 className="text-white text-lg font-medium">
                  Farhans Organization Presents
                </h2>
                {isDuplicateMode && (
                  <div className="mt-2 inline-flex items-center gap-2 bg-blue-900/50 border border-blue-600 text-blue-300 px-4 py-2 rounded-lg text-sm">
                    <FiCopy className="w-4 h-4" />
                    Duplicating Event - Review and Update Details
                  </div>
                )}
              </div>

              {/* Back Button */}
              <button
                onClick={handleBack}
                className="text-blue-400 hover:text-blue-300 mb-4 flex items-center"
              >
                ← Back to event type selection
              </button>

              {/* Event Title */}
              <div className="space-y-2">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Event Title*"
                  className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
                <div className="text-right text-gray-400 text-xs">0/70</div>
              </div>

              {/* Venue and Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="venueName"
                  value={formData.venueName}
                  onChange={handleInputChange}
                  placeholder="Venue Name"
                  className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Address"
                  className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Start and End Time */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm mb-2 block">
                      Start Time
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowStartCalendar(true)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-left text-white hover:bg-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      {formData.startDate
                        ? new Date(formData.startDate).toLocaleString()
                        : "Select start date and time"}
                    </button>
                  </div>
                  <div>
                    <label className="text-white text-sm mb-2 block">
                      End Time
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowEndCalendar(true)}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-left text-white hover:bg-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      {formData.endDate
                        ? new Date(formData.endDate).toLocaleString()
                        : "Select end date and time"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-white font-semibold text-lg block">
                  DESCRIPTION
                </label>
                <div className="bg-transparent border border-gray-600 rounded-lg">
                  {/* Toolbar */}
                  <div className="border-b border-gray-600 p-2 flex items-center space-x-2 text-gray-400">
                    <select className="bg-transparent text-white text-sm">
                      <option>Normal</option>
                    </select>
                    <select className="bg-transparent text-white text-sm">
                      <option>Sans Serif</option>
                    </select>
                    <select className="bg-transparent text-white text-sm">
                      <option>Normal</option>
                    </select>
                    <div className="flex space-x-1">
                      <button className="p-1 hover:bg-gray-700 rounded">
                        B
                      </button>
                      <button className="p-1 hover:bg-gray-700 rounded">
                        I
                      </button>
                      <button className="p-1 hover:bg-gray-700 rounded">
                        U
                      </button>
                      <button className="p-1 hover:bg-gray-700 rounded">
                        S
                      </button>
                    </div>
                  </div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-400 focus:outline-none resize-none"
                    placeholder="Enter event description..."
                  />
                </div>
              </div>

              {/* Category Section */}
              <div className="space-y-2">
                <label className="text-white font-semibold text-lg block">
                  CATEGORY
                </label>
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

              {/* Recurring Event */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">
                    Is this a Recurring Event?
                  </span>
                  <span className="text-gray-400 text-sm">
                    (Hosting this more than once? Click here to make it
                    recurring.)
                  </span>
                </div>
              </div>

              {/* RSVP or Ticketed Section */}
              {/* Unified Ticketing Section - Available for both RSVP and Ticketed Events */}
              <div className="space-y-4">
                {eventType === "rsvp" ? (
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold text-lg">
                      RSVP Settings
                    </h3>
                    <input
                      type="number"
                      name="maxAttendees"
                      value={formData.maxAttendees}
                      onChange={handleInputChange}
                      placeholder="Max Attendees"
                      className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                ) : (
                  <h3 className="text-white font-semibold text-lg">
                    Ticketing
                  </h3>
                )}

                {/* Unified Ticket Management */}
                <div className="space-y-4">
                  {/* Ticket Price and Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold text-lg">
                        Tickets
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={addTicket}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          Add Ticket
                        </button>
                        <button
                          type="button"
                          onClick={addTicketGroup}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          Add Group
                        </button>
                      </div>
                    </div>

                    {/* Ticket List */}
                    <div className="space-y-3">
                      {tickets.length === 0 ? (
                        <div className="border border-gray-600 border-dashed rounded-lg p-8 text-center">
                          <p className="text-gray-400 text-sm">
                            No tickets created yet. Click "Add Ticket" to create
                            your first ticket.
                          </p>
                        </div>
                      ) : (
                        tickets.map((ticket, index) => (
                          <div
                            key={ticket.id}
                            className="border border-gray-600 rounded-lg p-4 bg-gray-800"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-white font-medium">
                                {ticket.name || `Ticket ${index + 1}`}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => editTicket(ticket)}
                                  className="text-blue-400 hover:text-blue-300 text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeTicket(ticket.id)}
                                  className="text-red-400 hover:text-red-300 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 text-gray-400 text-sm">
                              {ticket.description || "No description"}
                            </div>
                            <div className="mt-2 text-white text-sm">
                              <span className="font-medium">
                                Price: ${ticket.price || "0"}
                              </span>
                              <span className="mx-2">•</span>
                              <span className="font-medium">
                                Quantity: {ticket.quantity || "0"}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Create Event Button */}
              <motion.button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full font-bold py-4 px-6 rounded-lg transition-colors text-lg ${
                  isSubmitting
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                    : "bg-white text-black hover:bg-gray-200"
                }`}
                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              >
                {isSubmitting ? "CREATING EVENT..." : "CREATE EVENT"}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Calendar Modals */}
      <CustomCalendar
        isOpen={showStartCalendar}
        onClose={() => setShowStartCalendar(false)}
        selectedDate={formData.startDate}
        onDateSelect={(date) =>
          setFormData((prev) => ({ ...prev, startDate: date }))
        }
        label="Start Time"
      />

      <CustomCalendar
        isOpen={showEndCalendar}
        onClose={() => setShowEndCalendar(false)}
        selectedDate={formData.endDate}
        onDateSelect={(date) =>
          setFormData((prev) => ({ ...prev, endDate: date }))
        }
        label="End Time"
      />

      {/* Ticket Modal */}
      <TicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        onSave={handleTicketSave}
        ticket={editingTicket}
      />
    </div>
  );
}
