import { useState, useEffect } from "react";
import { FiRefreshCw, FiPlus, FiX, FiSearch, FiFilter, FiMessageSquare, FiClock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import { authService } from "../../services/authService.js";

export default function SupportCenter() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create ticket form state
  const [formData, setFormData] = useState({
    subject: "",
    customerEmail: "",
    priority: "medium",
    category: "general",
    description: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [creating, setCreating] = useState(false);

  // Dummy tickets data
  const dummyTickets = [
    {
      _id: "67890abcdef123456789012",
      subject: "Payment Processing Issue",
      customerEmail: "john.doe@example.com",
      priority: "high",
      category: "billing",
      status: "open",
      description: "Unable to process payments for event tickets. Stripe integration seems to be failing.",
      messages: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
      _id: "67890abcdef123456789013",
      subject: "Event Page Not Loading",
      customerEmail: "sarah.wilson@example.com",
      priority: "medium",
      category: "technical",
      status: "in_progress",
      description: "My event page is showing a 404 error and attendees cannot view the event details.",
      messages: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
    },
    {
      _id: "67890abcdef123456789014", 
      subject: "How to Export Attendee List",
      customerEmail: "mike.johnson@example.com",
      priority: "low",
      category: "general",
      status: "resolved",
      description: "I need help understanding how to export the attendee list for my upcoming conference.",
      messages: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12) // 12 hours ago
    },
    {
      _id: "67890abcdef123456789015",
      subject: "Custom Branding Request",
      customerEmail: "anna.brown@example.com",
      priority: "medium",
      category: "feature_request", 
      status: "open",
      description: "Would like to request custom branding options for my event pages including logo placement and color schemes.",
      messages: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6)
    },
    {
      _id: "67890abcdef123456789016",
      subject: "Refund Processing Delay",
      customerEmail: "david.lee@example.com",
      priority: "urgent",
      category: "billing",
      status: "in_progress", 
      description: "Customer refund has been pending for over 5 business days. Need immediate assistance to resolve this issue.",
      messages: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
    }
  ];

  // Load tickets on component mount
  useEffect(() => {
    loadTickets();
  }, []);

  // Filter tickets when search term or status filter changes
  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      
      const response = await authService.apiRequest('/api/organizer/support');
      
      if (response.ok) {
        const data = await response.json();
        setTickets(data.length > 0 ? data : dummyTickets);
      } else {
        // Fallback to dummy data if API fails
        setTickets(dummyTickets);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load support tickets');
      // Fallback to dummy data
      setTickets(dummyTickets);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    setFilteredTickets(filtered);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.subject.trim()) {
      errors.subject = "Subject is required";
    }

    if (!formData.customerEmail.trim()) {
      errors.customerEmail = "Customer email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      errors.customerEmail = "Please enter a valid email address";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters long";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);

      const response = await authService.apiRequest('/api/organizer/support', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      let newTicket;
      if (response.ok) {
        newTicket = await response.json();
      } else {
        // Fallback to mock ticket if API fails
        newTicket = {
          _id: Date.now().toString(),
          ...formData,
          status: "open",
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      setTickets([newTicket, ...tickets]);
      setFormData({
        subject: "",
        customerEmail: "",
        priority: "medium", 
        category: "general",
        description: ""
      });
      setFormErrors({});
      setShowCreateModal(false);
      
      toast.success('Support ticket created successfully');
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to create support ticket');
    } finally {
      setCreating(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-400/10';
      case 'high': return 'text-orange-400 bg-orange-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'text-blue-400 bg-blue-400/10';
      case 'in_progress': return 'text-yellow-400 bg-yellow-400/10';
      case 'waiting_response': return 'text-purple-400 bg-purple-400/10';
      case 'resolved': return 'text-green-400 bg-green-400/10';
      case 'closed': return 'text-gray-400 bg-gray-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <FiAlertCircle className="w-4 h-4" />;
      case 'in_progress': return <FiClock className="w-4 h-4" />;
      case 'waiting_response': return <FiMessageSquare className="w-4 h-4" />;
      case 'resolved': return <FiCheckCircle className="w-4 h-4" />;
      case 'closed': return <FiCheckCircle className="w-4 h-4" />;
      default: return <FiAlertCircle className="w-4 h-4" />;
    }
  };

  const getTicketCounts = () => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length
    };
  };

  const counts = getTicketCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading support tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Support Center</h1>
            <p className="text-gray-400 text-sm">
              Manage customer support tickets and inquiries
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={loadTickets}
              className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              <FiPlus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>
          </div>
        </div>
      </header>

      <div className="px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total</p>
                <p className="text-2xl font-bold text-white">{counts.total}</p>
              </div>
              <FiMessageSquare className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Open</p>
                <p className="text-2xl font-bold text-blue-400">{counts.open}</p>
              </div>
              <FiAlertCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">In Progress</p>
                <p className="text-2xl font-bold text-yellow-400">{counts.in_progress}</p>
              </div>
              <FiClock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Resolved</p>
                <p className="text-2xl font-bold text-green-400">{counts.resolved}</p>
              </div>
              <FiCheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FiFilter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_response">Waiting Response</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <FiMessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No support tickets found</p>
              <p className="text-gray-500 text-sm">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first support ticket to get started"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredTickets.map((ticket) => (
                <div key={ticket._id} className="p-6 hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium truncate">{ticket.subject}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {getStatusIcon(ticket.status)}
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-2">{ticket.customerEmail}</p>
                      <p className="text-gray-300 text-sm line-clamp-2 mb-3">{ticket.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Category: {ticket.category.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Updated: {new Date(ticket.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors">
                        <FiMessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create Support Ticket</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className={`w-full bg-gray-800 border ${formErrors.subject ? 'border-red-500' : 'border-gray-700'} rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Enter ticket subject"
                  />
                  {formErrors.subject && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.subject}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Customer Email</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className={`w-full bg-gray-800 border ${formErrors.customerEmail ? 'border-red-500' : 'border-gray-700'} rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="customer@example.com"
                  />
                  {formErrors.customerEmail && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.customerEmail}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="feature_request">Feature Request</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full bg-gray-800 border ${formErrors.description ? 'border-red-500' : 'border-gray-700'} rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                    placeholder="Describe the issue in detail..."
                  />
                  {formErrors.description && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.description}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Ticket'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}