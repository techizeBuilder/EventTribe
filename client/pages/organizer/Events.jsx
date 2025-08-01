import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiSearch,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiDollarSign,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiPlay,
  FiPause,
  FiFilter,
  FiCopy,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Fetch events from API
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      console.log(
        "Fetching events with token:",
        token ? `${token.substring(0, 20)}...` : "No token found",
      );

      const response = await fetch("/api/organizer/events", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Events data:", data);
        setEvents(data);
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        //   toast.error(`Error: ${errorData.message}`);
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
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone.",
      )
    )
      return;

    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

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
  const handleTogglePublish = async (eventId, currentStatus) => {
    try {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      const response = await fetch(`/api/organizer/events/${eventId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          isPublic: newStatus === "published",
        }),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents((prev) =>
          prev.map((event) => (event._id === eventId ? updatedEvent : event)),
        );
        toast.success(
          `Event ${newStatus === "published" ? "published" : "unpublished"} successfully!`,
        );
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
      toast.error("Failed to update event status");
    }
  };

  // View event details
  const handleViewEvent = async (eventId) => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");

      const response = await fetch(`/api/organizer/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const eventData = await response.json();
        setSelectedEvent(eventData);
        setShowViewModal(true);
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Failed to fetch event details");
    }
  };

  // Edit event
  const handleEditEvent = (eventData) => {
    console.log("Events - Navigating to edit with data:", eventData);
    // Navigate to edit page with event data in state
    navigate("/organizer/editEvent", { state: { eventData } });
  };

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Events</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Manage your events and track performance
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/organizer/duplicate-event")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <FiCopy className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Duplicate Event</span>
            <span className="sm:hidden">Duplicate</span>
          </button>
          <button
            onClick={() => navigate("/organizer/createEvent")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Create Event</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event._id}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors"
            >
              {/* Event Image */}
              <div className="h-48 bg-gray-800 flex items-center justify-center">
                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiCalendar className="w-12 h-12 text-gray-600" />
                )}
              </div>

              {/* Event Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-white line-clamp-2">
                    {event.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ml-2 ${
                      event.status === "published"
                        ? "bg-green-900 text-green-300"
                        : event.status === "draft"
                          ? "bg-yellow-900 text-yellow-300"
                          : event.status === "completed"
                            ? "bg-blue-900 text-blue-300"
                            : "bg-red-900 text-red-300"
                    }`}
                  >
                    {event.status?.charAt(0).toUpperCase() +
                      event.status?.slice(1)}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {event.description || "No description available"}
                </p>

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <FiCalendar className="w-4 h-4 mr-2" />
                    {new Date(event.startDate).toLocaleDateString()} at{" "}
                    {new Date(event.startDate).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <FiMapPin className="w-4 h-4 mr-2" />
                    {event.venue || "Location TBD"}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-300">
                      <FiUsers className="w-4 h-4 mr-2" />
                      {event.attendeeCount || 0} registered
                    </div>
                    <div className="flex items-center text-green-400 font-semibold">
                      <FiDollarSign className="w-4 h-4 mr-1" />$
                      {(event.revenue || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Link
                    to={`/event/${event._id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <FiEye className="w-4 h-4" />
                    View
                  </Link>
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiEdit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleTogglePublish(event._id, event.status)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      event.status === "published"
                        ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {event.status === "published" ? (
                      <FiPause className="w-4 h-4" />
                    ) : (
                      <FiPlay className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FiCalendar className="mx-auto h-16 w-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">
            No events found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Get started by creating your first event"}
          </p>
          <button
            onClick={() => navigate("/organizer/createEvent")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-6 text-nowrap text-xs sm:text-sm py-3 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
          >
            <FiPlus className="w-5 h-5" />
            Create Your First Event
          </button>
        </div>
      )}

      {/* View Event Modal */}
      {showViewModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Event Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Event Image */}
              {(selectedEvent.image || selectedEvent.coverImage) && (
                <div className="mb-6">
                  <img
                    src={selectedEvent.image || selectedEvent.coverImage}
                    alt={selectedEvent.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Basic Information
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-300">
                        <span className="font-medium">Title:</span>{" "}
                        {selectedEvent.title}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">Category:</span>{" "}
                        {selectedEvent.category || "N/A"}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">Status:</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded text-xs ${
                            selectedEvent.status === "published"
                              ? "bg-green-600 text-white"
                              : "bg-yellow-600 text-white"
                          }`}
                        >
                          {selectedEvent.status || "Draft"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Date & Time
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-300">
                        <span className="font-medium">Start:</span>{" "}
                        {selectedEvent.startDate
                          ? new Date(selectedEvent.startDate).toLocaleString()
                          : "N/A"}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">End:</span>{" "}
                        {selectedEvent.endDate
                          ? new Date(selectedEvent.endDate).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Location
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-300">
                        <span className="font-medium">Venue:</span>{" "}
                        {selectedEvent.venue || "N/A"}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">Address:</span>{" "}
                        {selectedEvent.address || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Description
                    </h3>
                    <p className="text-gray-300">
                      {selectedEvent.description || "No description provided"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Tickets
                    </h3>
                    {selectedEvent.ticketTypes &&
                    selectedEvent.ticketTypes.length > 0 ? (
                      <div className="space-y-2">
                        {selectedEvent.ticketTypes.map((ticket, index) => (
                          <div key={index} className="bg-gray-800 p-3 rounded">
                            <p className="text-white font-medium">
                              {ticket.name}
                            </p>
                            <p className="text-gray-300">
                              Price: ${ticket.price}
                            </p>
                            <p className="text-gray-300">
                              Available: {ticket.quantity - (ticket.sold || 0)}{" "}
                              / {ticket.quantity}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-300">No tickets configured</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Statistics
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-300">
                        <span className="font-medium">Views:</span>{" "}
                        {selectedEvent.views || 0}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">Registrations:</span>{" "}
                        {selectedEvent.totalTicketsSold || 0}
                      </p>
                      <p className="text-gray-300">
                        <span className="font-medium">Revenue:</span> $
                        {(selectedEvent.totalRevenue || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditEvent(selectedEvent);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FiEdit3 className="w-4 h-4" />
                  Edit Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
