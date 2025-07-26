import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import toast from "react-hot-toast";

export default function ManageEvents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showDuplicateForm, setShowDuplicateForm] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [duplicateFormData, setDuplicateFormData] = useState({
    selectEvent: "",
    eventName: "",
    venueName: "",
    venueAddress: "",
    startTime: "Jul 1st, 2025 10:56:49 AM",
    endTime: "Jul 1st, 2025 10:56:49 AM",
  });

  // Fetch events from API
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");

      if (!token) {
        toast.error("Please login to view your events");
        navigate("/login");
        return;
      }

      const response = await fetch("/api/organizer/events", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Events data:", data);
        setEvents(data);
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        toast.error(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Network error occurred while fetching events");
    } finally {
      setLoading(false);
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");

      const response = await fetch(`/api/organizer/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setEvents((prev) => prev.filter((event) => event._id !== eventId));
        toast.success("Event deleted successfully!");
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  // Publish/Unpublish event
  const handleTogglePublish = async (eventId, isPublished) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const endpoint = isPublished ? "unpublish" : "publish";

      const response = await fetch(`/api/organizer/events/${eventId}/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success(`Event ${isPublished ? 'unpublished' : 'published'} successfully!`);
        fetchEvents(); // Refresh events
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update event status");
    }
  };

  const filters = ["All", "Live", "Pending", "Past", "Affiliated"];

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesFilter =
      activeFilter === "All" ||
      (event.status && event.status.toLowerCase() === activeFilter.toLowerCase());

    return matchesSearch && matchesFilter;
  });

  const handleDuplicateInputChange = (e) => {
    const { name, value } = e.target;
    setDuplicateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateDuplicate = () => {
    // Handle duplicate event creation logic here
    console.log("Creating duplicate event:", duplicateFormData);
    setShowDuplicateForm(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">MY EVENTS</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/organizer/createEvent"
              className="bg-white hover:bg-gray-100 text-black px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Create Event
            </Link>
            <button
              onClick={() => setShowDuplicateForm(true)}
              className="bg-white hover:bg-gray-100 text-black px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Duplicate Event
            </button>
          </div>
        </div>
      </header>

      <div className="px-8 py-6">
        {/* Filters and Search */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-1">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  activeFilter === filter
                    ? "bg-white text-black"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search By Event Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-gray-600 w-64"
            />
          </div>
        </div>

        {/* Events Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-white text-xl font-medium mb-2">
              {events.length === 0 ? "No events found" : "No events match your filter"}
            </h2>
            <p className="text-gray-400 mb-6">
              {events.length === 0 ? "Get started with just a few clicks!" : "Try adjusting your search or filter"}
            </p>
            {events.length === 0 && (
              <Link
                to="/organizer/createEvent"
                className="inline-block bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200"
              >
                Create Event
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event._id || event.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all duration-200"
              >
                <div className="relative h-48 bg-gray-800">
                  <img
                    src={event.image || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop";
                    }}
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event.status === 'published' || event.status === 'live'
                        ? 'bg-green-500 text-white'
                        : event.status === 'draft'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}>
                      {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {event.title}
                  </h3>
                  <div className="text-gray-400 text-sm mb-4">
                    <p>{event.description?.substring(0, 100)}...</p>
                    <p className="mt-2">
                      📅 {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBD'}
                    </p>
                    <p>📍 {event.venue || event.address || "Location TBD"}</p>
                    <p className="mt-2">
                      👥 {event.totalTicketsSold || 0} registered • ${event.totalRevenue || 0}
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      to={`/event/${event._id || event.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm text-center transition-colors"
                    >
                      👁️ View
                    </Link>
                    <Link
                      to={`/organizer/events/${event._id || event.id}/edit`}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm text-center transition-colors"
                    >
                      ✏️ Edit
                    </Link>
                    <button
                      onClick={() => handleTogglePublish(event._id || event.id, event.status === 'published')}
                      className={`flex-1 px-4 py-2 rounded text-sm transition-colors ${
                        event.status === 'published'
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {event.status === 'published' ? '⏸️' : '▶️'}
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event._id || event.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Duplicate Event Modal */}
      {showDuplicateForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Duplicate Event
                  </h2>
                  <p className="text-gray-400">
                    Running it back? Create a similar event quickly.
                  </p>
                </div>
                <button
                  onClick={() => setShowDuplicateForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="flex gap-8">
                {/* Left Side - Form */}
                <div className="flex-1 space-y-6">
                  {/* Select Event */}
                  <div>
                    <label className="text-white font-medium mb-2 block">
                      Select Event
                    </label>
                    <select
                      name="selectEvent"
                      value={duplicateFormData.selectEvent}
                      onChange={handleDuplicateInputChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="">Select Event</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Event Name */}
                  <div>
                    <label className="text-white font-medium mb-2 block">
                      Event Name
                    </label>
                    <input
                      type="text"
                      name="eventName"
                      value={duplicateFormData.eventName}
                      onChange={handleDuplicateInputChange}
                      placeholder="Event Name"
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Venue Info */}
                  <div>
                    <label className="text-white font-medium mb-2 block">
                      Venue Info
                    </label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        name="venueName"
                        value={duplicateFormData.venueName}
                        onChange={handleDuplicateInputChange}
                        placeholder="Venue Name"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                      />
                      <input
                        type="text"
                        name="venueAddress"
                        value={duplicateFormData.venueAddress}
                        onChange={handleDuplicateInputChange}
                        placeholder="Venue Address"
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="text-white font-medium mb-2 block">
                      Start Time
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="startTime"
                        value={duplicateFormData.startTime}
                        onChange={handleDuplicateInputChange}
                        className="w-full bg-gray-900 border border-orange-500 rounded-lg px-4 py-3 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="text-white font-medium mb-2 block">
                      End Time
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="endTime"
                        value={duplicateFormData.endTime}
                        onChange={handleDuplicateInputChange}
                        className="w-full bg-gray-900 border border-orange-500 rounded-lg px-4 py-3 text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Side - Add Flyer */}
                <div className="w-80">
                  <div className="bg-gray-900 border-2 border-dashed border-gray-600 rounded-lg h-80 flex flex-col items-center justify-center text-center">
                    <h3 className="text-white text-xl font-bold mb-2">
                      Add Flyer
                    </h3>
                  </div>
                </div>
              </div>

              {/* Create Event Button */}
              <div className="mt-8">
                <button
                  onClick={handleCreateDuplicate}
                  className="w-full bg-white text-black font-bold py-4 px-6 rounded-lg hover:bg-gray-200 transition-colors text-lg"
                >
                  Create Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
