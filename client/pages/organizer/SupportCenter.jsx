import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, 
  FiMessageCircle, 
  FiClock, 
  FiCheck, 
  FiX, 
  FiFilter,
  FiSearch,
  FiSend,
  FiPaperclip,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import { authService } from '../../services/authService.js';

const SupportCenter = () => {
  const queryClient = useQueryClient();
  const user = useSelector((state) => state.auth.user);
  
  // States
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  
  // New ticket form
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general'
  });

  // Refs for auto-scroll and Pusher
  const messagesEndRef = useRef(null);
  const pusherRef = useRef(null);
  const lastToastMessageId = useRef(null); // Prevent duplicate toasts

  // Fetch tickets (no polling - using real-time updates)
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['/api/organizer/support/tickets', statusFilter],
    queryFn: async () => {
      const response = await authService.apiRequest(`/api/organizer/support/tickets${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      return response.json();
    }
    // Removed refetchInterval - using real-time Pusher updates instead
  });

  // Fetch selected ticket details (no polling - using real-time updates)
  const { data: ticketDetails, isLoading: ticketLoading } = useQuery({
    queryKey: ['/api/organizer/support/tickets', selectedTicket?.id],
    queryFn: async () => {
      const response = await authService.apiRequest(`/api/organizer/support/tickets/${selectedTicket.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ticket details');
      }
      return response.json();
    },
    enabled: !!selectedTicket
    // Removed refetchInterval - using real-time Pusher updates instead
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData) => {
      const response = await authService.apiRequest('/api/organizer/support/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create ticket');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/organizer/support/tickets']);
      setShowCreateModal(false);
      setNewTicket({ title: '', description: '', priority: 'medium', category: 'general' });
      toast.success('Support ticket created successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create ticket');
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }) => {
      const response = await authService.apiRequest(`/api/organizer/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/organizer/support/tickets', selectedTicket?.id]);
      setMessageText('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
    }
  });

  // Mark messages as read mutation (WhatsApp-like behavior)
  const markAsReadMutation = useMutation({
    mutationFn: async (ticketId) => {
      const response = await authService.apiRequest(`/api/organizer/support/tickets/${ticketId}/mark-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to mark messages as read');
      }
      return response.json();
    },
    onSuccess: () => {
      // Refresh tickets list to update unread counters
      queryClient.invalidateQueries(['/api/organizer/support/tickets']);
      console.log('✅ Organizer messages marked as read - counters updated');
    },
    onError: (error) => {
      console.error('Error marking messages as read:', error);
    }
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketDetails?.messages]);

  // Mark messages as read when organizer views ticket (WhatsApp-like behavior)
  useEffect(() => {
    if (ticketDetails && selectedTicket && !ticketLoading) {
      markAsReadMutation.mutate(selectedTicket.id);
    }
  }, [ticketDetails, selectedTicket?.id, ticketLoading]);

  // Initialize WebSocket for real-time messaging
  useEffect(() => {
    if (!user?.email) return;

    let ws;
    
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Organizer connecting to WebSocket:', wsUrl);
      ws = new WebSocket(wsUrl);
      pusherRef.current = ws;

      ws.onopen = () => {
        console.log('Organizer WebSocket connected successfully');
        // Subscribe as organizer
        const subscribeMessage = {
          type: 'subscribe',
          userType: 'organizer',
          userEmail: user.email,
          channels: [`organizer-${user.email}`]
        };
        console.log('Organizer sending subscription:', subscribeMessage);
        ws.send(JSON.stringify(subscribeMessage));
      };

      ws.onmessage = (event) => {
        try {
          console.log('Organizer received WebSocket message:', event.data);
          const data = JSON.parse(event.data);
          if (data.type === 'new-message' && data.senderType === 'admin') {
            console.log('Organizer processing admin message:', data);
            
            // Prevent duplicate toasts for same message
            if (lastToastMessageId.current !== data.message.id) {
              lastToastMessageId.current = data.message.id;
              toast.success(`💬 New message from Support`, {
                icon: '🎫',
                duration: 4000
              });
            }
            
            queryClient.invalidateQueries(['/api/organizer/support/tickets']);
            if (selectedTicket && selectedTicket.id === data.ticketId) {
              queryClient.invalidateQueries(['/api/organizer/support/tickets', selectedTicket.id]);
            }
          }
        } catch (error) {
          console.error('Organizer WebSocket message error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Organizer WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('Organizer WebSocket disconnected:', event.code, event.reason);
        // Try to reconnect after 3 seconds
        setTimeout(() => {
          if (pusherRef.current === ws) {
            console.log('Organizer attempting to reconnect WebSocket...');
            connectWebSocket();
          }
        }, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('Organizer closing WebSocket connection');
        ws.close();
      }
      pusherRef.current = null;
    };
  }, [user?.email]);


  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Handle create ticket
  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    createTicketMutation.mutate(newTicket);
  };

  // Handle send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    sendMessageMutation.mutate({
      ticketId: selectedTicket.id,
      message: messageText
    });
  };

  // Get status color and icon
  const getStatusDisplay = (status) => {
    if (!status) {
      return { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: FiClock, label: 'Pending' };
    }
    switch (status.toLowerCase()) {
      case 'open':
        return { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: FiClock, label: 'Open' };
      case 'in_progress':
        return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: FiMessageCircle, label: 'In Progress' };
      case 'resolved':
        return { color: 'text-green-400', bg: 'bg-green-500/10', icon: FiCheckCircle, label: 'Resolved' };
      case 'closed':
        return { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: FiXCircle, label: 'Closed' };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: FiClock, label: status.charAt(0).toUpperCase() + status.slice(1) };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen flex-col lg:flex-row">
        {/* Tickets Sidebar */}
        <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-800 flex flex-col max-h-screen lg:max-h-none">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Support Center</h1>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                data-testid="button-create-ticket"
              >
                <FiPlus className="w-4 h-4" />
                <span>New Ticket</span>
              </button>
            </div>

            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  data-testid="input-search-tickets"
                />
              </div>
              
              <div className="flex space-x-2">
                {['all', 'open', 'in_progress', 'resolved'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                    data-testid={`filter-${status}`}
                  >
                    {status === 'all' ? 'All' : status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-gray-400">
                <FiMessageCircle className="w-12 h-12 mb-4" />
                <p>No tickets found</p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {filteredTickets.map((ticket) => {
                  const status = getStatusDisplay(ticket.status);
                  const StatusIcon = status.icon;
                  
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-gray-800/50 ${
                        selectedTicket?.id === ticket.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 bg-gray-800/30'
                      }`}
                      data-testid={`ticket-${ticket.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-white truncate flex-1 mr-2">
                          {ticket.title}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mb-2">{ticket.ticketNumber}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                        <span className="text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        {ticket.unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            {ticket.unreadCount} unread
                          </div>
                        )}
                        {ticket.messageCount > 0 && (
                          <div className="text-xs text-gray-400">
                            {ticket.messageCount} total message{ticket.messageCount !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 max-h-screen lg:max-h-none">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{selectedTicket.title}</h2>
                    <p className="text-gray-400 text-sm">Ticket: {selectedTicket.ticketNumber}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusDisplay(selectedTicket.status).bg} ${getStatusDisplay(selectedTicket.status).color}`}>
                      {React.createElement(getStatusDisplay(selectedTicket.status).icon, { className: "w-4 h-4 mr-1" })}
                      {getStatusDisplay(selectedTicket.status).label}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTicket.priority)} bg-gray-800`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  </div>
                </div>
                {selectedTicket.assignedAdminName && (
                  <p className="text-gray-400 text-sm mt-2">
                    Assigned to: {selectedTicket.assignedAdminName}
                  </p>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {ticketLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : ticketDetails?.messages?.length === 0 ? (
                  <div className="text-center text-gray-400">
                    <FiMessageCircle className="w-12 h-12 mx-auto mb-4" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  ticketDetails?.messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderType === 'organizer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderType === 'organizer'
                            ? 'bg-blue-600 text-white'
                            : message.messageType === 'system'
                            ? 'bg-gray-700 text-gray-300 text-center'
                            : 'bg-gray-800 text-white'
                        }`}
                      >
                        {message.messageType !== 'system' && (
                          <p className="text-xs opacity-75 mb-1">{message.senderName}</p>
                        )}
                        <p className="text-sm">{message.message || 'No message content'}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {message.createdAt ? new Date(message.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Unknown time'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-6 border-t border-gray-800">
                  <form onSubmit={handleSendMessage} className="flex space-x-4">
                    <div className="flex-1">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                        rows="3"
                        data-testid="input-message"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                      data-testid="button-send-message"
                    >
                      <FiSend className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FiMessageCircle className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg">Select a ticket to view conversation</p>
                <p className="text-sm mt-2">Choose a support ticket from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Create Support Ticket</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white"
                  data-testid="button-close-modal"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  placeholder="Brief description of your issue"
                  required
                  data-testid="input-ticket-title"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Description *
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  rows="4"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Detailed description of your issue"
                  required
                  data-testid="input-ticket-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Priority
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    data-testid="select-priority"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    data-testid="select-category"
                  >
                    <option value="general">General</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="event">Event</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                  data-testid="button-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-700/50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                  data-testid="button-submit-ticket"
                >
                  {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportCenter;