/**
 * MongoDB Support Ticket Service
 * Handles all support ticket operations using MongoDB
 * Works with existing MongoDB data structure
 */

import { ObjectId } from 'mongodb';

// Generate unique ticket number
function generateTicketNumber() {
  const prefix = 'ST';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export const mongoSupportTicketService = {
  // Create new support ticket
  async createTicket(ticketData, mongoStorage) {
    try {
      await mongoStorage.connect();
      const ticketNumber = generateTicketNumber();
      
      const ticket = {
        subject: ticketData.title || ticketData.subject,
        description: ticketData.description,
        customerEmail: ticketData.organizerEmail,
        organizerName: ticketData.organizerName || 'Unknown Organizer',
        priority: ticketData.priority || 'medium',
        category: ticketData.category || 'general',
        status: 'open',
        ticketNumber,
        organizerId: ticketData.organizerId,
        assignedAdminId: null,
        assignedAdminName: null,
        resolutionNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedAt: null,
        lastMessageAt: new Date(),
        messages: [{
          message: `Ticket created: ${ticketData.description}`,
          sender: ticketData.organizerId,
          senderName: ticketData.organizerName || 'Organizer',
          senderType: 'organizer',
          timestamp: new Date(),
          readByReceiver: false
        }]
      };

      const ticketsCollection = mongoStorage.db.collection('support_tickets');
      const result = await ticketsCollection.insertOne(ticket);
      
      return { 
        ...ticket, 
        id: result.insertedId.toString(),
        messageCount: 1 
      };
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  // Get tickets for organizer
  async getOrganizerTickets(organizerId, status = null, mongoStorage) {
    try {
      await mongoStorage.connect();
      const ticketsCollection = mongoStorage.db.collection('support_tickets');
      
      let filter = { organizerId };
      if (status && status !== 'all') {
        filter.status = status;
      }

      const tickets = await ticketsCollection
        .find(filter)
        .sort({ updatedAt: -1 })
        .toArray();

      return tickets.map(ticket => {
        const { _id, ...ticketData } = ticket;
        const messages = ticket.messages || [];
        // Count unread messages from admin side (organizer hasn't read admin's messages)
        const unreadCount = messages.filter(msg => 
          msg.senderType === 'admin' && msg.readByReceiver === false
        ).length;
        
        // Debug logging for troubleshooting
        if (unreadCount > 0) {
          console.log(`[DEBUG] Ticket ${_id.toString().slice(-8)} has ${unreadCount} unread admin messages`);
          const unreadMessages = messages.filter(msg => msg.senderType === 'admin' && msg.readByReceiver === false);
          console.log(`[DEBUG] First few unread:`, unreadMessages.slice(0, 3).map(m => ({id: m.id || 'no-id', message: m.message?.substring(0, 30), readByReceiver: m.readByReceiver})));
        }
        
        return {
          ...ticketData,
          id: _id.toString(),
          title: ticket.subject || ticket.title,
          organizerEmail: ticket.customerEmail,
          organizerName: ticket.organizerName || 'Unknown Organizer',
          status: ticket.status || 'open',
          messageCount: messages.length,
          unreadCount: unreadCount
        };
      });
    } catch (error) {
      console.error('Error getting organizer tickets:', error);
      throw error;
    }
  },

  // Get all tickets for admin
  async getAllTickets(status = null, priority = null, mongoStorage) {
    try {
      await mongoStorage.connect();
      const ticketsCollection = mongoStorage.db.collection('support_tickets');
      
      let filter = {};
      if (status && status !== 'all') {
        filter.status = status;
      }
      if (priority && priority !== 'all') {
        filter.priority = priority;
      }

      const tickets = await ticketsCollection
        .find(filter)
        .sort({ updatedAt: -1 })
        .toArray();

      return tickets.map(ticket => {
        const { _id, ...ticketData } = ticket;
        const messages = ticket.messages || [];
        // Count unread messages from organizer side (admin hasn't read organizer's messages)
        const unreadCount = messages.filter(msg => 
          msg.senderType === 'organizer' && msg.readByReceiver === false
        ).length;
        
        return {
          ...ticketData,
          id: _id.toString(),
          title: ticket.subject || ticket.title,
          organizerEmail: ticket.customerEmail,
          organizerName: ticket.organizerName || 'Unknown Organizer',
          status: ticket.status || 'open',
          ticketNumber: ticket.ticketNumber || `ST-${_id.toString().slice(-8)}`,
          messageCount: messages.length,
          unreadCount: unreadCount
        };
      });
    } catch (error) {
      console.error('Error getting all tickets:', error);
      throw error;
    }
  },

  // Get single ticket with messages
  async getTicketById(ticketId, mongoStorage) {
    try {
      await mongoStorage.connect();
      const ticketsCollection = mongoStorage.db.collection('support_tickets');
      
      const ticket = await ticketsCollection.findOne({ _id: new ObjectId(ticketId) });
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const { _id, ...ticketData } = ticket;
      return {
        ...ticketData,
        id: _id.toString(),
        title: ticket.subject || ticket.title,
        organizerEmail: ticket.customerEmail,
        organizerName: ticket.organizerName || 'Unknown Organizer',
        status: ticket.status || 'open',
        ticketNumber: ticket.ticketNumber || `ST-${_id.toString().slice(-8)}`,
        messages: (ticket.messages || []).map((msg, index) => ({
          id: `msg_${index}`,
          message: msg.message,
          senderId: msg.sender,
          senderName: msg.senderName || (msg.sender === ticket.organizerId ? ticket.organizerName : 'Admin'),
          senderType: msg.senderType || (msg.sender === ticket.organizerId ? 'organizer' : 'admin'),
          createdAt: msg.timestamp,
          readByReceiver: msg.readByReceiver || false
        })),
        messageCount: (ticket.messages || []).length
      };
    } catch (error) {
      console.error('Error getting ticket by ID:', error);
      throw error;
    }
  },

  // Mark messages as read by admin
  async markMessagesAsRead(ticketId, userType, mongoStorage) {
    try {
      await mongoStorage.connect();
      const ticketsCollection = mongoStorage.db.collection('support_tickets');
      
      // Mark all messages from the opposite side as read
      const senderType = userType === 'admin' ? 'organizer' : 'admin';
      
      // First check what messages we're about to mark as read
      const ticket = await ticketsCollection.findOne({ _id: new ObjectId(ticketId) });
      if (ticket && ticket.messages) {
        const messagesToMark = ticket.messages.filter(msg => msg.senderType === senderType && msg.readByReceiver === false);
        console.log(`[DEBUG] About to mark ${messagesToMark.length} ${senderType} messages as read by ${userType}`);
      }
      
      const result = await ticketsCollection.updateOne(
        { _id: new ObjectId(ticketId) },
        {
          $set: {
            "messages.$[elem].readByReceiver": true
          }
        },
        {
          arrayFilters: [{ "elem.senderType": senderType }]
        }
      );
      
      console.log(`[DEBUG] Mark as read result:`, result.modifiedCount > 0 ? 'Success' : 'No changes');
      console.log(`Marked all ${senderType} messages as read by ${userType}`);
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  // Add message to ticket
  async addMessage(ticketId, messageData, mongoStorage) {
    try {
      await mongoStorage.connect();
      const ticketsCollection = mongoStorage.db.collection('support_tickets');
      
      const newMessage = {
        message: messageData.message,
        sender: messageData.senderId,
        senderName: messageData.senderName,
        senderType: messageData.senderType,
        timestamp: new Date(),
        readByReceiver: false
      };

      const result = await ticketsCollection.updateOne(
        { _id: new ObjectId(ticketId) },
        { 
          $push: { messages: newMessage },
          $set: { 
            lastMessageAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Ticket not found');
      }

      return {
        id: `msg_${Date.now()}`,
        ...newMessage
      };
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },

  // Update ticket status
  async updateTicketStatus(ticketId, status, adminId = null, adminName = null, resolutionNotes = null, mongoStorage) {
    try {
      await mongoStorage.connect();
      const ticketsCollection = mongoStorage.db.collection('support_tickets');
      
      const updateData = {
        status,
        updatedAt: new Date()
      };

      if (adminId && adminName) {
        updateData.assignedAdminId = adminId;
        updateData.assignedAdminName = adminName;
      }

      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
      }

      const result = await ticketsCollection.findOneAndUpdate(
        { _id: new ObjectId(ticketId) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      console.log('MongoDB update result:', result);

      // Check both result and result.value for different MongoDB driver versions
      const updatedTicket = result.value || result;
      if (!updatedTicket) {
        throw new Error('Ticket not found');
      }

      const { _id, ...ticketData } = updatedTicket;
      return {
        ...ticketData,
        id: _id.toString(),
        title: updatedTicket.subject || updatedTicket.title,
        organizerEmail: updatedTicket.customerEmail,
        organizerName: updatedTicket.organizerName || 'Unknown Organizer'
      };
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  },

  // Get tickets count by status
  async getTicketCounts(mongoStorage) {
    try {
      await mongoStorage.connect();
      const ticketsCollection = mongoStorage.db.collection('support_tickets');
      
      const pipeline = [
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ];

      const results = await ticketsCollection.aggregate(pipeline).toArray();
      
      const counts = {
        total: 0,
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
        unassigned: 0
      };

      // Get total count
      const totalCount = await ticketsCollection.countDocuments();
      counts.total = totalCount;

      // Get unassigned count
      const unassignedCount = await ticketsCollection.countDocuments({ 
        $or: [
          { assignedAdminId: { $exists: false } },
          { assignedAdminId: null },
          { assignedAdminId: "" }
        ]
      });
      counts.unassigned = unassignedCount;

      // Process status counts
      results.forEach(result => {
        if (result._id && counts.hasOwnProperty(result._id)) {
          counts[result._id] = result.count;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error getting ticket counts:', error);
      throw error;
    }
  },

  // Delete a ticket by its ID
  async deleteTicket(ticketId, mongoStorage) {
    try {
      await mongoStorage.connect();
      const ticketsCollection = mongoStorage.db.collection('support_tickets');
      
      const result = await ticketsCollection.deleteOne({ _id: new ObjectId(ticketId) });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }
  }
};