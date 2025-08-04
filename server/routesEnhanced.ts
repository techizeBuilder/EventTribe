import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { mongoStorage } from "./mongodb-storage.js";
import { AuthService, authenticateToken, requireRole } from './auth.js';

// Extend Request type to include user property
interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function registerEnhancedRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB
  await mongoStorage.connect();

  // Initialize Auth Service
  const authService = new AuthService();
  await authService.connect();

  // Health check endpoint for enhanced routes
  app.get("/api/enhanced/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      enhanced: true
    });
  });

  // Enhanced organizer bookings endpoint with better filtering
  app.get('/api/enhanced/organizer/bookings', authenticateToken, requireRole(['organizer']), async (req: AuthenticatedRequest, res) => {
    try {
      const organizerId = req.user?._id || req.user?.id;
      
      await mongoStorage.connect();
      const bookingsCollection = mongoStorage.db.collection('bookings');
      
      // Enhanced filtering: only return valid and complete booking data
      const bookings = await bookingsCollection.find({
        organizerId: organizerId,
        // Filter for complete bookings
        $and: [
          { eventId: { $exists: true, $ne: null } },
          { userId: { $exists: true, $ne: null } },
          { status: { $exists: true, $ne: null } },
          { createdAt: { $exists: true } }
        ]
      }).toArray();

      // Enhanced data integrity: populate event details
      const eventsCollection = mongoStorage.db.collection('events');
      const usersCollection = mongoStorage.db.collection('users');
      
      const enhancedBookings = await Promise.all(bookings.map(async (booking: any) => {
        try {
          const event = await eventsCollection.findOne({ _id: booking.eventId });
          const user = await usersCollection.findOne({ _id: booking.userId });
          
          return {
            ...booking,
            eventDetails: event ? {
              title: event.title,
              date: event.date,
              price: event.price
            } : null,
            userDetails: user ? {
              name: user.name,
              email: user.email
            } : null
          };
        } catch (err) {
          console.warn('Error enhancing booking data:', err);
          return booking; // Return original booking if enhancement fails
        }
      }));

      res.json(enhancedBookings);
    } catch (error) {
      console.error('Enhanced bookings error:', error);
      res.status(500).json({ message: 'Failed to fetch enhanced bookings' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}