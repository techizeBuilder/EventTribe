
import React, { useState, useEffect } from "react";
import {
  FiCheck,
  FiX,
  FiEye,
  FiClock,
  FiCalendar,
  FiMapPin,
  FiUser,
  FiDollarSign,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function AdminEventApproval() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [rejectionReason, setRejectionReason] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const fetchPendingEvents = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!token || user.role !== "super_admin") {
        toast.error("Access denied. Super admin privileges required.");
        navigate("/login");
        return;
      }

      const response = await fetch("/api/admin/events/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error fetching pending events:", error);
      toast.error("Failed to fetch pending events");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");

      const response = await fetch(`/api/admin/events/${eventId}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("Event approved and published successfully!");
        setEvents(events.filter(event => event._id !== eventId));
        setShowModal(false);
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error approving event:", error);
      toast.error("Failed to approve event");
    }
  };

  const handleRejectEvent = async (eventId) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");

      const response = await fetch(`/api/admin/events/${eventId}/reject`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: rejectionReason,
        }),
      });

      if (response.ok) {
        toast.success("Event rejected successfully!");
        setEvents(events.filter(event => event._id !== eventId));
        setShowModal(false);
        setRejectionReason("");
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Error rejecting event:", error);
      toast.error("Failed to reject event");
    }
  };

  const openModal = (event, type) => {
    setSelectedEvent(event);
    setActionType(type);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading pending events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 min-h-screen bg-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Event Approval</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">
            Review and approve events submitted by organizers
          </p>
        </div>
        <div className="bg-blue-900 text-blue-300 px-4 py-2 rounded-lg">
          {events.length} Pending Approval
        </div>
      </div>

      {/* Events List */}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((event) => (
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
                  <span className="px-2 py-1 rounded text-xs font-medium ml-2 bg-blue-900 text-blue-300">
                    <FiClock className="w-3 h-3 inline mr-1" />
                    Pending
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {event.description || "No description available"}
                </p>

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <FiCalendar className="w-4 h-4 mr-2" />
                    {new Date(event.startDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <FiMapPin className="w-4 h-4 mr-2" />
                    {event.venue || "Location TBD"}
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <FiUser className="w-4 h-4 mr-2" />
                    Organizer ID: {event.organizerId}
                  </div>
                  {event.ticketTypes && event.ticketTypes.length > 0 && (
                    <div className="flex items-center text-sm text-gray-300">
                      <FiDollarSign className="w-4 h-4 mr-2" />
                      {event.ticketTypes.length} ticket type(s)
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal(event, 'approve')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <FiCheck className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => openModal(event, 'reject')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <FiX className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FiClock className="mx-auto h-16 w-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-gray-300 mb-2">
            No events pending approval
          </h3>
          <p className="text-gray-500">
            All submitted events have been reviewed
          </p>
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {actionType === 'approve' ? 'Approve Event' : 'Reject Event'}
              </h2>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {selectedEvent.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {selectedEvent.description}
                </p>
              </div>

              {actionType === 'reject' && (
                <div className="mb-4">
                  <label className="block text-white font-medium mb-2">
                    Reason for Rejection
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this event..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    rows={4}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (actionType === 'approve') {
                      handleApproveEvent(selectedEvent._id);
                    } else {
                      handleRejectEvent(selectedEvent._id);
                    }
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {actionType === 'approve' ? 'Approve & Publish' : 'Reject Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
