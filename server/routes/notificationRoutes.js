import express from 'express';
import { ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';

const router = express.Router();

// Email transporter configuration (Mailtrap for development)
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 587,
  secure: false,
  auth: {
    user: '122e79cfec2d29',
    pass: '9324e83d713de6'
  }
});

// Create notification function
async function createNotification(mongoStorage, recipientEmail, title, message, type = 'purchase') {
  try {
    const notification = {
      recipientEmail,
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const notificationsCollection = mongoStorage.db.collection('notifications');
    const result = await notificationsCollection.insertOne(notification);
    return result.insertedId;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Send email notification function for attendees
async function sendAttendeeEmail(bookingData) {
  try {
    const mailOptions = {
      from: '"Event Tribe" <noreply@eventtribe.com>',
      to: bookingData.userEmail,
      subject: `🎟️ Your ticket for ${bookingData.eventTitle} is confirmed!`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">EVENT TRIBE</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px;">🎉 Your tickets are confirmed!</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px;">Hi ${bookingData.userName}!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Great news! Your ticket purchase for <strong>${bookingData.eventTitle}</strong> has been confirmed.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin: 0 0 15px 0;">Booking Details:</h3>
              <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
              <p style="margin: 5px 0;"><strong>Event:</strong> ${bookingData.eventTitle}</p>
              <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${bookingData.totalAmount}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${bookingData.status}</p>
              <p style="margin: 5px 0;"><strong>Booking Date:</strong> ${new Date(bookingData.bookingDate).toLocaleDateString()}</p>
            </div>
            
            <div style="background: #dcfdf7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #047857; margin: 0 0 10px 0;">What's Next?</h3>
              <ul style="color: #047857; margin: 10px 0; padding-left: 20px;">
                <li>Access your ticket anytime from your attendee dashboard</li>
                <li>Show your QR code ticket at the event entrance</li>
                <li>Check your email for event updates</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/attendee-dashboard" 
                 style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Your Tickets
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Thank you for choosing Event Tribe! <br>
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[${new Date().toLocaleTimeString()}] Mailtrap email sent to attendee: ${bookingData.userEmail}`);
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error sending Mailtrap email to attendee:`, error);
    // Don't throw error - email failure shouldn't break the notification system
  }
}

// Send email notification function for organizers
async function sendOrganizerEmail(bookingData, organizerEmail) {
  try {
    const mailOptions = {
      from: '"Event Tribe" <noreply@eventtribe.com>',
      to: organizerEmail,
      subject: `💰 New ticket sale for ${bookingData.eventTitle}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">EVENT TRIBE</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px;">💰 New Ticket Sale!</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #059669; margin: 0 0 20px 0; font-size: 24px;">Congratulations!</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              You have a new ticket sale for your event <strong>${bookingData.eventTitle}</strong>.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #059669; margin: 0 0 15px 0;">Sale Details:</h3>
              <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
              <p style="margin: 5px 0;"><strong>Customer:</strong> ${bookingData.userName} (${bookingData.userEmail})</p>
              <p style="margin: 5px 0;"><strong>Event:</strong> ${bookingData.eventTitle}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> $${bookingData.totalAmount}</p>
              <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${bookingData.status}</p>
              <p style="margin: 5px 0;"><strong>Sale Date:</strong> ${new Date(bookingData.bookingDate).toLocaleDateString()}</p>
            </div>
            
            <div style="background: #dcfdf7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #047857; margin: 0 0 10px 0;">Next Steps:</h3>
              <ul style="color: #047857; margin: 10px 0; padding-left: 20px;">
                <li>View detailed sales analytics in your organizer dashboard</li>
                <li>Track your event performance and revenue</li>
                <li>Manage attendee communications</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/organizer/dashboard" 
                 style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Dashboard
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Keep growing your events with Event Tribe! <br>
              Track your success and engage with your audience.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[${new Date().toLocaleTimeString()}] Mailtrap email sent to organizer: ${organizerEmail}`);
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Error sending Mailtrap email to organizer:`, error);
    // Don't throw error - email failure shouldn't break the notification system
  }
}

// Import the new email service
import { sendAttendeeNotification, sendOrganizerNotification, testEmailConnection } from '../services/emailService.js';

// Test email connection on startup
testEmailConnection();

// Test endpoint for email functionality
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Test booking data
    const testBookingData = {
      bookingId: 'TEST-' + Date.now(),
      eventTitle: 'Test Event',
      userEmail: email,
      userName: 'Test User',
      totalAmount: 50,
      status: 'confirmed',
      bookingDate: new Date()
    };

    // Send test email to attendee
    await sendAttendeeEmail(testBookingData);
    
    res.json({ 
      message: 'Test email sent successfully',
      email: email 
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      message: 'Failed to send test email',
      error: error.message 
    });
  }
});

// Test endpoint for complete ticket purchase notification
router.post('/test-purchase', async (req, res) => {
  try {
    const testBookingData = {
      bookingId: 'TEST-PURCHASE-' + Date.now(),
      eventTitle: 'Technology Conference 2025',
      eventId: '6867b3ebba9efe7063d33be2', // Using a real event ID from database
      userEmail: 'farhan@gmail.com',
      userName: 'Farhan Ahmad',
      totalAmount: 150,
      status: 'confirmed',
      bookingDate: new Date()
    };

    // Trigger the complete notification workflow
    await triggerTicketPurchaseNotification(testBookingData);
    
    res.json({ 
      message: 'Complete ticket purchase notification sent successfully',
      bookingData: testBookingData
    });
  } catch (error) {
    console.error('Error sending ticket purchase notification:', error);
    res.status(500).json({ 
      message: 'Failed to send ticket purchase notification',
      error: error.message 
    });
  }
});

// Middleware to trigger notifications when ticket is purchased
export async function triggerTicketPurchaseNotification(bookingData) {
  try {
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    // Get event details to find organizer
    const eventsCollection = mongoStorage.db.collection('events');
    const event = await eventsCollection.findOne({ _id: new ObjectId(bookingData.eventId) });
    
    if (!event) {
      console.error('Event not found for notification');
      return;
    }

    // Get organizer details
    const usersCollection = mongoStorage.db.collection('auth_users');
    const organizer = await usersCollection.findOne({ _id: new ObjectId(event.organizerId) });
    
    if (!organizer) {
      console.error('Organizer not found for notification');
      return;
    }

    // Create notification for user (attendee)
    const userTitle = "Ticket Purchase Successful";
    const userMessage = `You have successfully purchased a ticket for ${bookingData.eventTitle}.`;
    await createNotification(mongoStorage, bookingData.userEmail, userTitle, userMessage);
    
    // Send Mailtrap email to attendee
    await sendAttendeeEmail(bookingData);

    // Create notification for organizer
    const organizerTitle = "New Ticket Purchase";
    const organizerMessage = `${bookingData.userName} purchased a ticket for your event ${bookingData.eventTitle}.`;
    await createNotification(mongoStorage, organizer.email, organizerTitle, organizerMessage);
    
    // Send Mailtrap email to organizer
    await sendOrganizerEmail(bookingData, organizer.email);

    console.log('Ticket purchase notifications sent successfully');
  } catch (error) {
    console.error('Error triggering ticket purchase notification:', error);
  }
}

// GET /api/notifications - Get user notifications
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.ensureConnection();

    if (!mongoStorage.isConnected) {
      console.log('MongoDB not connected for notifications');
      return res.json({ notifications: [] });
    }

    const notificationsCollection = mongoStorage.db.collection('notifications');
    const notifications = await notificationsCollection
      .find({ recipientEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/organizer - Get organizer notifications
router.get('/organizer', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.ensureConnection();

    if (!mongoStorage.isConnected) {
      console.log('MongoDB not connected for organizer notifications');
      return res.json({ notifications: [] });
    }

    const notificationsCollection = mongoStorage.db.collection('notifications');
    const notifications = await notificationsCollection
      .find({ 
        recipientEmail: email,
        type: 'purchase'
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching organizer notifications:', error);
    res.status(500).json({ message: 'Failed to fetch organizer notifications' });
  }
});

// GET /api/notifications/unread-count - Get unread notifications count
router.get('/unread-count', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.ensureConnection();

    if (!mongoStorage.isConnected) {
      console.log('MongoDB not connected for unread count');
      return res.json({ count: 0 });
    }

    const notificationsCollection = mongoStorage.db.collection('notifications');
    const count = await notificationsCollection.countDocuments({ 
      recipientEmail: email,
      isRead: false 
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// POST /api/notifications/:id/read - Mark notification as read
router.post('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.ensureConnection();

    if (!mongoStorage.isConnected) {
      console.log('MongoDB not connected for mark as read');
      return res.status(500).json({ message: 'Database connection failed' });
    }

    const notificationsCollection = mongoStorage.db.collection('notifications');
    await notificationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isRead: true,
          updatedAt: new Date()
        }
      }
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.ensureConnection();

    if (!mongoStorage.isConnected) {
      console.log('MongoDB not connected for mark all as read');
      return res.status(500).json({ message: 'Database connection failed' });
    }

    const notificationsCollection = mongoStorage.db.collection('notifications');
    await notificationsCollection.updateMany(
      { recipientEmail: email },
      { 
        $set: { 
          isRead: true,
          updatedAt: new Date()
        }
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.ensureConnection();

    if (!mongoStorage.isConnected) {
      console.log('MongoDB not connected for delete notification');
      return res.status(500).json({ message: 'Database connection failed' });
    }

    const notificationsCollection = mongoStorage.db.collection('notifications');
    await notificationsCollection.deleteOne({ _id: new ObjectId(id) });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

export default router;