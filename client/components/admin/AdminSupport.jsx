import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FiMessageCircle, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiSearch, 
  FiFilter,
  FiSend,
  FiUser,
  FiUserCheck,
  FiAlertCircle,
  FiArchive,
  FiMail,
  FiCalendar,
  FiRefreshCw
} from 'react-icons/fi';

const AdminSupport = () => {
  // States
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Refs for auto-scroll
  const messagesEndRef = useRef(null);
  const pusherRef = useRef(null);
  const lastToastMessageId = useRef(null); // Prevent duplicate toasts

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticketDetails?.messages]);



  // Initialize WebSocket for real-time messaging
  useEffect(() => {
    let ws;
    
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Admin connecting to WebSocket:', wsUrl);
      ws = new WebSocket(wsUrl);
      pusherRef.current = ws;

      ws.onopen = () => {
        console.log('Admin WebSocket connected successfully');
        // Subscribe as admin
        const subscribeMessage = {
          type: 'subscribe',
          userType: 'admin',
          userEmail: 'admin@flite.com',
          channels: ['admin-notifications']
        };
        console.log('Admin sending subscription:', subscribeMessage);
        ws.send(JSON.stringify(subscribeMessage));
      };

      ws.onmessage = (event) => {
        try {
          console.log('Admin received WebSocket message:', event.data);
          const data = JSON.parse(event.data);
          if (data.type === 'new-message' && data.senderType === 'organizer') {
            console.log('Admin processing organizer message:', data);
            
            // Prevent duplicate toasts for same message
            if (lastToastMessageId.current !== data.message.id) {
              lastToastMessageId.current = data.message.id;
              toast(`📩 New message on ticket ${data.ticketNumber}`, {
                icon: '💬',
                duration: 4000
              });
            }
            
            // Simple approach: Always refresh tickets list first, then handle the message
            console.log('🔄 Step 1: Refreshing tickets list...');
            fetchTickets().then(() => {
              console.log('✅ Step 2: Tickets refreshed, now processing message...');
              
              // After tickets are refreshed, find and select the target ticket
              setTickets(currentTickets => {
                console.log('📝 Looking for ticket ID:', data.ticketId);
                const targetTicket = currentTickets.find(ticket => ticket.id === data.ticketId);
                
                if (targetTicket) {
                  console.log('🎯 Found ticket, selecting it now...');
                  // Use setTimeout to ensure state update happens in next tick
                  setTimeout(() => {
                    setSelectedTicket(targetTicket);
                  }, 50);
                } else {
                  console.log('❌ Ticket not found in refreshed list');
                }
                
                return currentTickets; // Return unchanged tickets
              });
            }).catch(error => {
              console.error('Error refreshing tickets:', error);
            });
            
          }
        } catch (error) {
          console.error('Admin WebSocket message error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Admin WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('Admin WebSocket disconnected:', event.code, event.reason);
        // Try to reconnect after 3 seconds
        setTimeout(() => {
          if (pusherRef.current === ws) {
            console.log('Admin attempting to reconnect WebSocket...');
            connectWebSocket();
          }
        }, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('Admin closing WebSocket connection');
        ws.close();
      }
      pusherRef.current = null;
    };
  }, []);


  // Fetch tickets on component mount
  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  // Fetch ticket details when selected ticket changes
  useEffect(() => {
    if (selectedTicket) {
      fetchTicketDetails();
    }
  }, [selectedTicket]);

  // Fetch all tickets
  const fetchTickets = async () => {
    try {
      const { makeAdminApiCall } = await import("../../utils/adminAuth.js");
      let url = '/api/admin/support/tickets?';
      const params = [];
      if (statusFilter !== 'all') params.push(`status=${statusFilter}`);
      if (priorityFilter !== 'all') params.push(`priority=${priorityFilter}`);
      
      const response = await makeAdminApiCall(url + params.join('&'));
      if (!response) return Promise.reject('Auth error'); // Auth error handled
      
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
        console.log('📊 Tickets updated, count:', data.length);
        return data; // Return the data for promise chain
      } else {
        toast.error('Failed to fetch support tickets');
        return Promise.reject('Failed to fetch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to fetch support tickets');
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch selected ticket details
  const fetchTicketDetails = async () => {
    if (!selectedTicket) return;
    
    try {
      setTicketLoading(true);
      const { makeAdminApiCall } = await import("../../utils/adminAuth.js");
      // Add timestamp to prevent caching
      const response = await makeAdminApiCall(`/api/admin/support/tickets/${selectedTicket.id}?t=${Date.now()}`);
      
      if (!response) return; // Auth error handled
      
      if (response.ok) {
        const data = await response.json();
        console.log('Admin fetchTicketDetails - received data:', data);
        console.log('Number of messages in response:', data.messages?.length || 0);
        
        // Force React to re-render by creating new objects
        setTicketDetails(prevDetails => {
          console.log('Previous message count:', prevDetails?.messages?.length || 0);
          console.log('New message count:', data.messages?.length || 0);
          return { ...data };
        });
        
        // Update the selected ticket in the list
        setTickets(prevTickets => 
          prevTickets.map(ticket => 
            ticket.id === selectedTicket.id ? { ...ticket, ...data } : ticket
          )
        );

        // Mark messages as read when admin views the ticket (WhatsApp-like behavior)
        try {
          const markReadResponse = await makeAdminApiCall(
            `/api/admin/support/tickets/${selectedTicket.id}/mark-read`, 
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (markReadResponse && markReadResponse.ok) {
            console.log('✅ Messages marked as read - counters will update');
            // Refresh tickets list to update unread counters after marking as read
            setTimeout(() => {
              fetchTickets();
            }, 200);
          }
        } catch (markReadError) {
          console.error('Error marking messages as read:', markReadError);
        }
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    } finally {
      setTicketLoading(false);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    
    try {
      setSendingMessage(true);
      const { makeAdminApiCall } = await import("../../utils/adminAuth.js");
      const response = await makeAdminApiCall(`/api/admin/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: messageText })
      });
      
      if (!response) return; // Auth error handled
      
      if (response.ok) {
        setMessageText('');
        toast.success('Message sent successfully!');
        fetchTicketDetails(); // Refresh messages
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  // Update ticket status
  const handleStatusUpdate = async (status) => {
    try {
      const { makeAdminApiCall } = await import("../../utils/adminAuth.js");
      const response = await makeAdminApiCall(`/api/admin/support/tickets/${selectedTicket.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      
      if (!response) return; // Auth error handled
      
      if (response.ok) {
        toast.success('Ticket status updated!');
        fetchTickets(); // Refresh ticket list
        fetchTicketDetails(); // Refresh ticket details
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Assign ticket
  const handleAssignTicket = async () => {
    try {
      const { makeAdminApiCall } = await import("../../utils/adminAuth.js");
      const response = await makeAdminApiCall(`/api/admin/support/tickets/${selectedTicket.id}/assign`, {
        method: 'PATCH'
      });
      
      if (!response) return; // Auth error handled
      
      if (response.ok) {
        toast.success('Ticket assigned to you!');
        fetchTickets(); // Refresh ticket list
        fetchTicketDetails(); // Refresh ticket details
      } else {
        toast.error('Failed to assign ticket');
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Failed to assign ticket');
    }
  };

  // Delete ticket
  const handleDeleteTicket = async () => {
    if (!confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { makeAdminApiCall } = await import("../../utils/adminAuth.js");
      const response = await makeAdminApiCall(`/api/admin/support/tickets/${selectedTicket.id}`, {
        method: 'DELETE'
      });
      
      if (!response) return; // Auth error handled
      
      if (response.ok) {
        toast.success('Ticket deleted successfully!');
        setSelectedTicket(null); // Clear selection
        fetchTickets(); // Refresh ticket list
      } else {
        toast.error('Failed to delete ticket');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
    }
  };

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.organizerName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get status display
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'open':
        return { color: 'text-blue-400', bg: 'bg-blue-500/10', icon: FiAlertCircle, label: 'Open' };
      case 'in_progress':
        return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: FiClock, label: 'In Progress' };
      case 'resolved':
        return { color: 'text-green-400', bg: 'bg-green-500/10', icon: FiCheckCircle, label: 'Resolved' };
      case 'closed':
        return { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: FiXCircle, label: 'Closed' };
      default:
        return { color: 'text-gray-400', bg: 'bg-gray-500/10', icon: FiAlertCircle, label: status };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/10';
      case 'high': return 'text-orange-400 bg-orange-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'low': return 'text-green-400 bg-green-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  // Get ticket counts
  const getTicketCounts = () => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      unassigned: tickets.filter(t => !t.assignedAdminId).length
    };
  };

  const counts = getTicketCounts();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Support Center</h1>
          <button
            onClick={fetchTickets}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            data-testid="button-refresh"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{counts.total}</p>
              </div>
              <FiMessageCircle className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Open</p>
                <p className="text-2xl font-bold text-blue-400">{counts.open}</p>
              </div>
              <FiAlertCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-yellow-400">{counts.in_progress}</p>
              </div>
              <FiClock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-green-400">{counts.resolved}</p>
              </div>
              <FiCheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Unassigned</p>
                <p className="text-2xl font-bold text-purple-400">{counts.unassigned}</p>
              </div>
              <FiUser className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-screen max-h-[calc(100vh-200px)] flex-col lg:flex-row">
        {/* Tickets Sidebar */}
        <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-700 flex flex-col max-h-screen lg:max-h-none">
          {/* Filters */}
          <div className="p-4 border-b border-gray-700">
            <div className="space-y-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  data-testid="input-search-tickets"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  data-testid="select-status-filter"
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
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  data-testid="select-priority-filter"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
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
                        <div className="flex items-center flex-1 mr-2">
                          <h3 className="font-medium text-white truncate">
                            {ticket.title}
                          </h3>
                          {ticket.unreadCount > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-medium">
                              {ticket.unreadCount}
                            </span>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-400 text-xs">{ticket.ticketNumber}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority?.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-gray-300 text-sm">
                          By: <span className="font-medium">{ticket.organizerName || ticket.organizerEmail || 'Unknown Organizer'}</span>
                        </p>
                        {ticket.organizerEmail && ticket.organizerName && (
                          <p className="text-gray-500 text-xs mt-1">
                            Contact: {ticket.organizerEmail}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        {!ticket.assignedAdminId && (
                          <span className="text-purple-400 font-medium">Unassigned</span>
                        )}
                        {ticket.unreadCount > 0 && (
                          <span className="text-red-400 font-medium">
                            {ticket.unreadCount} unread message{ticket.unreadCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {ticket.messageCount > 0 && !ticket.unreadCount && (
                          <span className="text-blue-400 font-medium">
                            {ticket.messageCount} message{ticket.messageCount !== 1 ? 's' : ''}
                          </span>
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
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{selectedTicket.title}</h2>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">
                        Ticket: <span className="font-mono">{selectedTicket.ticketNumber}</span>
                      </p>
                      <p className="text-gray-300 text-sm">
                        Organization: <span className="font-medium text-blue-400">{selectedTicket.organizerName || 'Individual Organizer'}</span>
                      </p>
                      <p className="text-gray-500 text-xs">
                        Contact: <span className="font-medium">{selectedTicket.organizerEmail || 'No contact info'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusDisplay(selectedTicket.status).bg} ${getStatusDisplay(selectedTicket.status).color}`}>
                      {React.createElement(getStatusDisplay(selectedTicket.status).icon, { className: "w-4 h-4 mr-1" })}
                      {getStatusDisplay(selectedTicket.status).label}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusUpdate('in_progress')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    data-testid="button-in-progress"
                  >
                    In Progress
                  </button>
                  
                  <button
                    onClick={() => handleStatusUpdate('resolved')}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    data-testid="button-resolved"
                  >
                    Resolved
                  </button>
                  
                  <button
                    onClick={() => handleStatusUpdate('closed')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    data-testid="button-closed"
                  >
                    Closed
                  </button>
                  
                  <button
                    onClick={handleDeleteTicket}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    data-testid="button-delete-ticket"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {ticketLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <>
                    {/* Initial ticket description */}
                    <div className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="flex items-center mb-2">
                        <FiUser className="w-4 h-4 mr-2 text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">{selectedTicket.organizerName}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(selectedTicket.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-300">{selectedTicket.description}</p>
                    </div>

                    {/* Messages */}
                    {ticketDetails?.messages?.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'admin'
                              ? 'bg-blue-600 text-white'
                              : message.messageType === 'system'
                              ? 'bg-gray-700 text-gray-300 text-center'
                              : 'bg-gray-800 text-white'
                          }`}
                        >
                          {message.messageType !== 'system' && (
                            <p className="text-xs opacity-75 mb-1">{message.senderName}</p>
                          )}
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-6 border-t border-gray-700">
                  <form onSubmit={handleSendMessage} className="flex space-x-4">
                    <div className="flex-1">
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your response..."
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                        rows="3"
                        data-testid="input-message"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!messageText.trim() || sendingMessage}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
                      data-testid="button-send-message"
                    >
                      <FiSend className="w-4 h-4" />
                      <span>{sendingMessage ? 'Sending...' : 'Send'}</span>
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
                <p className="text-sm mt-2">Choose a support ticket from the list to start helping</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;