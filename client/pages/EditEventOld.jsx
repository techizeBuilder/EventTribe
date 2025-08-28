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
  const eventData = location.state;

  const [eventType, setEventType] = useState("ticketed");
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
    category: "",
    showOnExplore: false,
  });

  const [tickets, setTickets] = useState([]);

  // Load event data if available
  useEffect(() => {
    if (eventData) {
      setFormData({
        title: eventData.title || "",
        venueName: eventData.venue || "",
        address: eventData.address || "",
        startDate: eventData.startDate ? new Date(eventData.startDate).toISOString().slice(0, 16) : "",
        endDate: eventData.endDate ? new Date(eventData.endDate).toISOString().slice(0, 16) : "",
        description: eventData.description || "",
        isRecurring: eventData.isRecurring || false,
        ticketPrice: eventData.ticketTypes?.[0]?.price || "",
        maxAttendees: eventData.ticketTypes?.[0]?.quantity || "",
        category: eventData.category || "",
        showOnExplore: eventData.isPublic || false,
      });
      
      if (eventData.image || eventData.coverImage) {
        setImagePreview(eventData.image || eventData.coverImage);
      }
    } else {
      // If no event data passed, redirect back
      toast.error("No event data found");
      navigate("/organizer/events");
    }
  }, [eventData, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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

      // Compress image for better performance and smaller payload
      const compressedImage = await compressImage(file, 1200, 800, 0.8, 500);
      
      // Create a blob from the base64 string
      const compressedBlob = await fetch(compressedImage).then(r => r.blob());
      const compressedFile = new File([compressedBlob], file.name, { type: file.type });
      
      setSelectedImage(compressedFile);
      setImagePreview(compressedImage);

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

      // Prepare form data for submission
      const updatedEventData = {
        title: formData.title,
        description: formData.description,
        venue: formData.venueName,
        address: formData.address,
        startDate: formData.startDate,
        endDate: formData.endDate,
        category: formData.category || "General",
        locationType: "physical",
        isPublic: formData.showOnExplore,
        allowRefunds: true,
        // Use actual uploaded image preview if changed
        image: imagePreview || eventData.image || eventData.coverImage,
        ticketTypes: formData.ticketPrice ? [
          {
            name: "General Admission",
            description: "Event ticket",
            price: parseFloat(formData.ticketPrice) || 0,
            quantity: parseInt(formData.maxAttendees) || 100,
            sold: eventData.ticketTypes?.[0]?.sold || 0,
            isActive: true,
            saleStartDate: new Date().toISOString(),
            saleEndDate: formData.endDate,
            perks: [],
          },
        ] : eventData.ticketTypes || [],
      };

      // Submit to backend
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      if (!token) {
        toast.error("Please login first to update events");
        navigate("/login");
        return;
      }

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
        navigate("/organizer/events");
      } else {
        const error = await response.json();
        if (response.status === 401) {
          toast.error("Your session has expired. Please login again.");
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          navigate("/login");
        } else {
          toast.error(`Error updating event: ${error.message}`);
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

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side - Add Flyer Section */}
          <div className="lg:w-1/3">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center h-80 flex flex-col items-center justify-center relative"
            >
              {imagePreview ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Event flyer preview"
                    className="max-w-full max-h-48 object-contain rounded-lg mb-4"
                  />
                  <p className="text-white text-sm mb-2">
                    {selectedImage?.name || "Current event image"}
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
                    Large images will be automatically optimized for faster loading
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
                <h2 className="text-white text-2xl font-bold">
                  Edit Event
                </h2>
              </div>

              {/* Back Button */}
              <button
                onClick={handleBack}
                className="text-blue-400 hover:text-blue-300 mb-4 flex items-center"
              >
                ← Back to events
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
                <div className="text-right text-gray-400 text-xs">{formData.title.length}/70</div>
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
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-white text-sm mb-2 block">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-2">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Event Description"
                  rows="4"
                  className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Select Category</option>
                  <option value="Music">Music</option>
                  <option value="Business">Business</option>
                  <option value="Culture">Culture</option>
                  <option value="Technology">Technology</option>
                  <option value="Sports">Sports</option>
                  <option value="Food & Drink">Food & Drink</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Ticket Price and Max Attendees */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="number"
                  name="ticketPrice"
                  value={formData.ticketPrice}
                  onChange={handleInputChange}
                  placeholder="Ticket Price (optional)"
                  className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees}
                  onChange={handleInputChange}
                  placeholder="Max Attendees"
                  className="w-full bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
              </div>

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
    </div>
  );
}

