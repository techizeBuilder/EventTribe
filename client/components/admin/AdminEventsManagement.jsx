import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiCalendar, 
  FiSearch, 
  FiFilter,
  FiEdit,
  FiTrash2,
  FiEye,
  FiPlus,
  FiDownload,
  FiMoreVertical,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiUsers
} from "react-icons/fi";
import { X } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminEventsManagement() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;
  
  // Modal states
  const [viewModal, setViewModal] = useState({ isOpen: false, event: null });
  const [editModal, setEditModal] = useState({ isOpen: false, event: null });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, event: null });
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    status: '',
    category: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/admin/events");
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        toast.error("Failed to fetch events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  // Action handlers
  const handleViewEvent = async (event) => {
    try {
      const response = await fetch(`/api/admin/events/${event.id}`);
      if (response.ok) {
        const eventData = await response.json();
        setViewModal({ isOpen: true, event: eventData });
      } else {
        toast.error("Failed to fetch event details");
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Failed to fetch event details");
    }
  };

  const handleEditEvent = async (event) => {
    try {
      const response = await fetch(`/api/admin/events/${event.id}`);
      if (response.ok) {
        const eventData = await response.json();
        setEditForm({
          title: eventData.title || '',
          description: eventData.description || '',
          venue: eventData.venue || '',
          startDate: eventData.startDate ? new Date(eventData.startDate).toISOString().split('T')[0] : '',
          endDate: eventData.endDate ? new Date(eventData.endDate).toISOString().split('T')[0] : '',
          status: eventData.status || 'draft',
          category: eventData.category || ''
        });
        setEditModal({ isOpen: true, event: eventData });
      } else {
        toast.error("Failed to fetch event details");
      }
    } catch (error) {
      console.error("Error fetching event details:", error);
      toast.error("Failed to fetch event details");
    }
  };

  const handleDeleteEvent = (event) => {
    setDeleteModal({ isOpen: true, event });
  };

  const confirmDelete = async () => {
    if (!deleteModal.event) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/events/${deleteModal.event.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setEvents(events.filter(event => event.id !== deleteModal.event.id));
        toast.success("Event deleted successfully");
        setDeleteModal({ isOpen: false, event: null });
      } else {
        toast.error("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!editModal.event) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/events/${editModal.event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        // Update local state
        setEvents(events.map(event => 
          event.id === editModal.event.id 
            ? { ...event, ...editForm }
            : event
        ));
        toast.success("Event updated successfully");
        setEditModal({ isOpen: false, event: null });
      } else {
        toast.error("Failed to update event");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateEventStatus = async (event, newStatus) => {
    try {
      const response = await fetch(`/api/admin/events/${event.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setEvents(events.map(e => 
          e.id === event.id ? { ...e, status: newStatus } : e
        ));
        toast.success(`Event status updated to ${newStatus}`);
      } else {
        toast.error("Failed to update event status");
      }
    } catch (error) {
      console.error("Error updating event status:", error);
      toast.error("Failed to update event status");
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (event.venue && event.venue.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === "all" || event.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case "published": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "draft": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "cancelled": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "completed": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Events Management</h1>
          <p className="text-gray-400 mt-1">Manage all platform events</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <FiPlus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Events</p>
              <p className="text-2xl font-bold text-white">{events.length}</p>
            </div>
            <FiCalendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Published</p>
              <p className="text-2xl font-bold text-white">{events.filter(e => e.status === 'published').length}</p>
            </div>
            <FiEye className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">${events.reduce((sum, e) => sum + (e.revenue || 0), 0).toLocaleString()}</p>
            </div>
            <FiDollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Tickets Sold</p>
              <p className="text-2xl font-bold text-white">{events.reduce((sum, e) => sum + (e.tickets || 0), 0).toLocaleString()}</p>
            </div>
            <FiUsers className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <FiFilter className="text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-700">
              <tr>
                <th className="text-left p-4 text-gray-300 font-medium min-w-[200px]">Event</th>
                <th className="text-left p-4 text-gray-300 font-medium min-w-[150px]">Organizer</th>
                <th className="text-left p-4 text-gray-300 font-medium min-w-[120px]">Date</th>
                <th className="text-left p-4 text-gray-300 font-medium min-w-[100px]">Status</th>
                <th className="text-left p-4 text-gray-300 font-medium min-w-[120px]">Tickets</th>
                <th className="text-left p-4 text-gray-300 font-medium min-w-[100px]">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {currentEvents.map((event) => (
                <motion.tr
                  key={event._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <FiCalendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{event.title}</p>
                        <div className="flex items-center text-gray-400 text-sm mt-1">
                          <FiMapPin className="w-4 h-4 mr-1" />
                          <span>{event.venue || 'No venue'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-300">{event.organizer || 'Unknown'}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center text-gray-400 text-sm">
                      <FiClock className="w-4 h-4 mr-1" />
                      <span>{formatDate(event.startDate)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <span className="text-white font-medium">{event.attendees || 0}</span>
                      <span className="text-gray-400">/{event.tickets || 0}</span>
                    </div>
                    <div className="w-24 bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${event.tickets ? (event.attendees / event.tickets) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-green-400 font-medium">${(event.revenue || 0).toLocaleString()}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Showing {indexOfFirstEvent + 1} to {Math.min(indexOfLastEvent, filteredEvents.length)} of {filteredEvents.length} events
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* View Event Modal */}
      {viewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Event Details</h3>
              <button
                onClick={() => setViewModal({ isOpen: false, event: null })}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            {viewModal.event && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                    <p className="text-white">{viewModal.event.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <p className="text-white">{viewModal.event.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Venue</label>
                    <p className="text-white">{viewModal.event.venue || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                    <p className="text-white">{viewModal.event.category || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                    <p className="text-white">{formatDate(viewModal.event.startDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                    <p className="text-white">{formatDate(viewModal.event.endDate)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <p className="text-white">{viewModal.event.description || 'No description available'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Edit Event</h3>
              <button
                onClick={() => setEditModal({ isOpen: false, event: null })}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Venue</label>
                  <input
                    type="text"
                    value={editForm.venue}
                    onChange={(e) => setEditForm({...editForm, venue: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                  rows="4"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, event: null })}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Update Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Event Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Delete Event</h3>
              <button
                onClick={() => setDeleteModal({ isOpen: false, event: null })}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "{deleteModal.event?.title}"? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteModal({ isOpen: false, event: null })}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}