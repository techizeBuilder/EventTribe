/**
 * Pusher Service for Real-time Support Ticket Messaging
 */

import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

export const pusherService = {
  // Send new message notification
  async sendMessage(ticketId, message) {
    try {
      // Send to ticket-specific channel
      await pusher.trigger(`ticket-${ticketId}`, 'new-message', {
        message,
        ticketId,
        timestamp: new Date().toISOString()
      });
      
      // Send to admin notifications for message counters
      await pusher.trigger('admin-notifications', 'new-message', {
        ticketId,
        ticketNumber: message.ticketNumber || `ST-${ticketId.slice(-8)}`,
        message: message.message,
        senderType: message.senderType || 'organizer',
        timestamp: new Date().toISOString()
      });
      
      // Send to organizer for real-time counter updates (if message is from admin)
      if (message.senderType === 'admin') {
        await pusher.trigger(`organizer-${message.organizerEmail}`, 'new-message', {
          ticketId,
          ticketNumber: message.ticketNumber || `ST-${ticketId.slice(-8)}`,
          message: message.message,
          senderType: 'admin',
          senderName: message.senderName || 'Support Team',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error sending message via Pusher:', error);
    }
  },

  // Send ticket status update
  async updateTicketStatus(ticketId, status, updatedBy) {
    try {
      await pusher.trigger(`ticket-${ticketId}`, 'status-updated', {
        status,
        updatedBy,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending status update via Pusher:', error);
    }
  },

  // Send notification to organizer
  async notifyOrganizer(organizerId, notification) {
    try {
      await pusher.trigger(`organizer-${organizerId}`, 'notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending organizer notification via Pusher:', error);
    }
  },

  // Send notification to admin
  async notifyAdmin(notification) {
    try {
      await pusher.trigger('admin-notifications', 'notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending admin notification via Pusher:', error);
    }
  },

  // Update ticket counters
  async updateTicketCounters() {
    try {
      // This will broadcast to all connected admin panels
      await pusher.trigger('admin-notifications', 'counter-update', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating ticket counters via Pusher:', error);
    }
  }
};