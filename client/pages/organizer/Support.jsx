import React, { useState, useEffect } from 'react';
import {
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiFilter,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiCalendar,
  FiSend,
  FiPaperclip,
  FiEye,
  FiMail,
  FiPhone,
  FiRefreshCw,
} from 'react-icons/fi';

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  // Fetch support tickets
  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organizer/support/tickets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new ticket
  const handleCreateTicket = async (ticketData) => {
    try {
      const response = await fetch('/api/organizer/support/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      if (response.ok) {
        const newTicket = await response.json();
        setTickets(prev => [newTicket, ...prev]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  // Send message
  const handleSendMessage = async (ticketId) => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/organizer/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          sender: 'organizer',
        }),
      });

      if (response.ok) {
        const message = await response.json();
        setSelectedTicket(prev => ({
          ...prev,
          messages: [...(prev.messages || []), message],
        }));
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Update ticket status
  const handleUpdateTicketStatus = async (ticketId, status) => {
    try {
      const response = await fetch(`/api/organizer/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchTickets();
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket(prev => ({ ...prev, status }));
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <FiMessageSquare className="w-4 h-4 text-blue-400" />;
      case 'in_progress': return <FiClock className="w-4 h-4 text-yellow-400" />;
      case 'resolved': return <FiCheckCircle className="w-4 h-4 text-green-400" />;
      case 'closed': return <FiCheckCircle className="w-4 h-4 text-gray-400" />;
      default: return <FiMessageSquare className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-900 text-blue-300';
      case 'in_progress': return 'bg-yellow-900 text-yellow-300';
      case 'resolved': return 'bg-green-900 text-green-300';
      case 'closed': return 'bg-gray-700 text-gray-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-900 text-red-300';
      case 'medium': return 'bg-yellow-900 text-yellow-300';
      case 'low': return 'bg-green-900 text-green-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400 text-sm sm:text-base">Loading support tickets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Support Center</h1>
          <p className="text-gray-400 mt-1 text-sm sm:text-base">Manage customer support tickets and inquiries</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={fetchTickets}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base justify-center"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base justify-center"
          >
            <FiPlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Ticket</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Support Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Total Tickets</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{tickets.length}</p>
            </div>
            <FiMessageSquare className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Open Tickets</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                {tickets.filter(t => t.status === 'open').length}
              </p>
            </div>
            <FiAlertCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">In Progress</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                {tickets.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <FiClock className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-orange-400" />
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs sm:text-sm">Resolved</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                {tickets.filter(t => t.status === 'resolved').length}
              </p>
            </div>
            <FiCheckCircle className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-xl">
            <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-800">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Support Tickets</h2>
              
              {/* Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                  >
                    <option value="all">All Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredTickets.length > 0 ? (
                <div className="divide-y divide-gray-800">
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-3 sm:p-4 cursor-pointer hover:bg-gray-800 transition-colors ${
                        selectedTicket?._id === ticket._id ? 'bg-gray-800 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getStatusIcon(ticket.status)}
                          <span className="font-medium text-white text-xs sm:text-sm truncate">{ticket.subject}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 ml-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ticket.status)} whitespace-nowrap`}>
                            {ticket.status?.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)} whitespace-nowrap`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs sm:text-sm mb-2 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="truncate">{ticket.customerEmail}</span>
                        <span className="whitespace-nowrap ml-2">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 sm:p-8 text-center">
                  <FiMessageSquare className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-600 mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-300 mb-2">No tickets found</h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Support tickets will appear here when customers contact you'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl">
              {/* Ticket Header */}
              <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-800">
                <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-white truncate">{selectedTicket.subject}</h2>
                    <p className="text-gray-400 mt-1 text-sm sm:text-base">{selectedTicket.description}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateTicketStatus(selectedTicket._id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base flex-1 sm:flex-none"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <FiUser className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400">Customer:</span>
                    <span className="text-white truncate">{selectedTicket.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiAlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-400">Priority:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-3 sm:p-4 lg:p-6 max-h-96 overflow-y-auto">
                <div className="space-y-3 sm:space-y-4">
                  {(selectedTicket.messages || []).map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.sender === 'organizer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-sm lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-lg ${
                          message.sender === 'organizer'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        <p className="text-xs sm:text-sm">{message.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(selectedTicket.messages || []).length === 0 && (
                    <div className="text-center py-6 sm:py-8">
                      <FiMessageSquare className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-600 mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-300 mb-2">No messages yet</h3>
                      <p className="text-gray-500 text-sm">Start a conversation with your customer</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-3 sm:p-4 lg:p-6 border-t border-gray-800">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your response..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage(selectedTicket._id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleSendMessage(selectedTicket._id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base justify-center"
                  >
                    <FiSend className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 sm:p-8 text-center">
              <FiMessageSquare className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-600 mb-4" />
              <h3 className="text-lg sm:text-xl font-medium text-gray-300 mb-2">Select a ticket</h3>
              <p className="text-gray-500 text-sm sm:text-base">Choose a support ticket from the list to view details and respond</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTicket}
        />
      )}
    </div>
  );
}

// Create Ticket Modal Component
function CreateTicketModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    customerEmail: '',
    priority: 'medium',
    category: 'general',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-gray-900 rounded-xl max-w-lg w-full max-h-screen overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-gray-800">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Create Support Ticket</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Customer Email</label>
            <input
              type="email"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
              >
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="refund">Refund</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
            >
              Create Ticket
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}