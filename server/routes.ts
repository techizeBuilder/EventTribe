import type { Express } from "express";
import { createServer, type Server } from "http";
import { mongoStorage } from "./mongodb-storage.js";
import { AuthService, authenticateToken, requireRole } from './auth.js';
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB
  await mongoStorage.connect();

  // Initialize Auth Service
  const authService = new AuthService();
  await authService.connect();

  // Authentication Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { user, token } = await authService.register(req.body);
      res.status(201).json({
        message: "User registered successfully",
        user,
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ 
        message: error.message || "Registration failed" 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { user, token } = await authService.login(req.body);
      res.json({
        message: "Login successful",
        user,
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ 
        message: error.message || "Login failed" 
      });
    }
  });

  app.get("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      res.json({
        message: "Profile retrieved successfully",
        user: req.user
      });
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.put("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      await authService.updateUser(req.user._id, req.body);
      const updatedUser = await authService.getUserById(req.user._id);
      res.json({
        message: "Profile updated successfully",
        user: updatedUser
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // API Routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await mongoStorage.getAllUsers();
      res.json({ message: "Success", data: users });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const user = await mongoStorage.createUser(req.body);
      res.status(201).json({ message: "User created", data: user });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.get("/api/server-info", async (req, res) => {
    try {
      const stats = await mongoStorage.getStats();
      res.json({
        backend: {
          url: `http://localhost:${process.env.PORT || 5000}`,
          status: "running",
          version: "1.0.0"
        },
        frontend: {
          url: `http://localhost:${process.env.PORT || 5000}`,
          framework: "React.js"
        },
        database: {
          type: "MongoDB",
          name: "express_react_app",
          connected: true,
          totalUsers: stats.totalUsers
        },
        config: {
          cors: true,
          errorHandling: true,
          logging: true,
          hotReload: process.env.NODE_ENV === "development"
        }
      });
    } catch (error) {
      console.error("Error getting server info:", error);
      res.status(500).json({ message: "Error getting server info" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, eventId, eventTitle, ticketDetails } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          eventId: eventId || "",
          eventTitle: eventTitle || "",
          ticketDetails: JSON.stringify(ticketDetails || {})
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        error: "Failed to create payment intent",
        message: error.message 
      });
    }
  });

  app.post("/api/confirm-payment", async (req, res) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID is required" });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Here you could save the payment details to your database
        // For now, we'll just return success
        res.json({ 
          success: true,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency
        });
      } else {
        res.json({ 
          success: false,
          status: paymentIntent.status 
        });
      }
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ 
        error: "Failed to confirm payment",
        message: error.message 
      });
    }
  });

  // GET /api/admin/organizations/:userId/earnings
  app.get('/api/admin/organizations/:userId/earnings', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { userId } = req.params;

      // Connect to MongoDB
      await mongoStorage.connect();
      const { ObjectId } = await import('mongodb');

      // Fetch user's events with multiple query variations
      const eventsCollection = mongoStorage.db.collection('events');

      // Try different organizerId formats
      let userEvents = await eventsCollection.find({ 
        organizerId: userId 
      }).toArray();

      // If no events found with string ID, try ObjectId
      if (userEvents.length === 0 && ObjectId.isValid(userId)) {
        userEvents = await eventsCollection.find({ 
          organizerId: new ObjectId(userId)
        }).toArray();
      }

      // Also try with the id field
      if (userEvents.length === 0) {
        userEvents = await eventsCollection.find({ 
          id: userId 
        }).toArray();
      }

      console.log(`Found ${userEvents.length} events for user ${userId}`);

      // Fetch bookings for these events with multiple collection names
      let bookings = [];
      const bookingsCollection = mongoStorage.db.collection('bookings');
      const attendeesCollection = mongoStorage.db.collection('attendees');

      if (userEvents.length > 0) {
        const eventIds = userEvents.map(event => event._id.toString());
        const eventObjectIds = userEvents.map(event => event._id);

        // Try bookings collection first
        bookings = await bookingsCollection.find({
          $or: [
            { eventId: { $in: eventIds } },
            { eventId: { $in: eventObjectIds } }
          ]
        }).toArray();

        console.log(`Found ${bookings.length} bookings in bookings collection`);

        // If no bookings found, try attendees collection
        if (bookings.length === 0) {
          const attendees = await attendeesCollection.find({
            $or: [
              { eventId: { $in: eventIds } },
              { eventId: { $in: eventObjectIds } }
            ]
          }).toArray();

          // Convert attendees to booking format
          bookings = attendees.map(attendee => ({
            eventId: attendee.eventId,
            totalAmount: attendee.totalAmount || attendee.ticketPrice || 0,
            ticketDetails: attendee.quantity ? [{ quantity: attendee.quantity }] : null,
            status: attendee.status || 'confirmed'
          }));

          console.log(`Found ${attendees.length} attendees, converted to bookings`);
        }

        // Also check for sample bookings data
        if (bookings.length === 0) {
          const sampleBookings = await mongoStorage.db.collection('sample_bookings').find({
            $or: [
              { eventId: { $in: eventIds } },
              { eventId: { $in: eventObjectIds } }
            ]
          }).toArray();

          if (sampleBookings.length > 0) {
            bookings = sampleBookings;
            console.log(`Found ${sampleBookings.length} sample bookings`);
          }
        }
      }

      // Calculate earnings per event
      const eventEarnings = userEvents.map(event => {
        const eventBookings = bookings.filter(booking => {
          const bookingEventId = booking.eventId?.toString();
          const eventId = event._id.toString();
          return bookingEventId === eventId;
        });

        const revenue = eventBookings.reduce((total, booking) => {
          return total + (booking.totalAmount || 0);
        }, 0);

        let ticketsSold = 0;
        eventBookings.forEach(booking => {
          if (booking.ticketDetails && Array.isArray(booking.ticketDetails)) {
            ticketsSold += booking.ticketDetails.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0);
          } else if (booking.quantity) {
            ticketsSold += booking.quantity;
          } else {
            ticketsSold += 1; // Default to 1 ticket if no details
          }
        });

        console.log(`Event ${event.title}: ${eventBookings.length} bookings, $${revenue} revenue, ${ticketsSold} tickets sold`);

        return {
          _id: event._id,
          title: event.title,
          revenue: revenue,
          ticketsSold: ticketsSold,
          createdAt: event.createdAt
        };
      });

      // Calculate totals
      const totalRevenue = eventEarnings.reduce((total, event) => total + event.revenue, 0);
      const totalTicketsSold = eventEarnings.reduce((total, event) => total + event.ticketsSold, 0);
      const totalEvents = userEvents.length;

      const earningsData = {
        totalRevenue,
        totalTicketsSold,
        totalEvents,
        events: eventEarnings
      };

      console.log('Final earnings data:', earningsData);
      res.json(earningsData);
    } catch (error) {
      console.error('Earnings fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch earnings data' });
    }
  });

  // GET /api/admin/users/:id
  app.get('/api/admin/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { id } = req.params;

      await mongoStorage.connect();
      const { ObjectId } = await import('mongodb');

      const usersCollection = mongoStorage.db.collection('users');

      // Handle both ObjectId and string formats
      let query;
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
      } else {
        query = { id: id };
      }

      const user = await usersCollection.findOne(query);

      if (user) {
        // Remove sensitive data
        const { password, ...userWithoutPassword } = user;
        res.json({
          id: user._id?.toString() || user.id,
          ...userWithoutPassword
        });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error('User fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // POST /api/admin/create-sample-bookings - for testing earnings
  app.post('/api/admin/create-sample-bookings', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      await mongoStorage.connect();
      const { ObjectId } = await import('mongodb');

      const eventsCollection = mongoStorage.db.collection('events');
      const bookingsCollection = mongoStorage.db.collection('bookings');

      // Get all events
      const events = await eventsCollection.find({}).toArray();

      // Create sample bookings for each event
      const sampleBookings = [];

      for (const event of events) {
        // Create 2-5 random bookings per event
        const bookingCount = Math.floor(Math.random() * 4) + 2;

        for (let i = 0; i < bookingCount; i++) {
          const ticketPrice = Math.floor(Math.random() * 200) + 50; // $50-$250
          const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 tickets

          sampleBookings.push({
            _id: new ObjectId(),
            eventId: event._id.toString(),
            userId: new ObjectId(),
            totalAmount: ticketPrice * quantity,
            ticketDetails: [{ 
              type: 'General',
              price: ticketPrice,
              quantity: quantity 
            }],
            status: 'confirmed',
            createdAt: new Date(),
            attendeeInfo: {
              firstName: `User${i + 1}`,
              lastName: 'Test',
              email: `user${i + 1}@example.com`
            }
          });
        }
      }

      if (sampleBookings.length > 0) {
        await bookingsCollection.insertMany(sampleBookings);
        console.log(`Created ${sampleBookings.length} sample bookings`);
      }

      res.json({ 
        message: `Created ${sampleBookings.length} sample bookings`,
        bookings: sampleBookings.length
      });
    } catch (error) {
      console.error('Error creating sample bookings:', error);
      res.status(500).json({ message: 'Failed to create sample bookings' });
    }
  });

  // GET /api/organizer/bookings - Get all bookings for organizer's events
  app.get('/api/organizer/bookings', authenticateToken, requireRole(['organizer']), async (req, res) => {
    try {
      const organizerId = req.user._id || req.user.id;

      await mongoStorage.connect();
      const { ObjectId } = await import('mongodb');

      // First, get all events created by this organizer
      const eventsCollection = mongoStorage.db.collection('events');
      const organizerEvents = await eventsCollection.find({ 
        organizerId: organizerId 
      }).toArray();

      if (organizerEvents.length === 0) {
        return res.json([]);
      }

      const eventIds = organizerEvents.map(event => event._id.toString());

      // Get all bookings for these events
      const bookingsCollection = mongoStorage.db.collection('bookings');
      const bookings = await bookingsCollection.find({
        eventId: { $in: eventIds }
      }).sort({ createdAt: -1 }).toArray();

      // Enrich bookings with event information
      const enrichedBookings = bookings.map(booking => {
        const event = organizerEvents.find(e => e._id.toString() === booking.eventId);
        return {
          ...booking,
          eventTitle: event?.title || 'Unknown Event',
          eventDate: event?.date,
          eventLocation: event?.location
        };
      });

      res.json(enrichedBookings);
    } catch (error) {
      console.error('Get organizer bookings error:', error);
      res.status(500).json({ message: 'Failed to fetch bookings' });
    }
  });

  // GET /api/organizer/bookings/:bookingId - Get specific booking details
  app.get('/api/organizer/bookings/:bookingId', authenticateToken, requireRole(['organizer']), async (req, res) => {
    try {
      const organizerId = req.user._id || req.user.id;
      const { bookingId } = req.params;

      await mongoStorage.connect();
      const { ObjectId } = await import('mongodb');

      // Get the booking
      const bookingsCollection = mongoStorage.db.collection('bookings');
      const booking = await bookingsCollection.findOne({
        _id: new ObjectId(bookingId)
      });

      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      // Verify that this booking belongs to an event created by this organizer
      const eventsCollection = mongoStorage.db.collection('events');
      const event = await eventsCollection.findOne({
        _id: new ObjectId(booking.eventId),
        organizerId: organizerId
      });

      if (!event) {
        return res.status(403).json({ message: 'Access denied to this booking' });
      }

      // Enrich booking with event information
      const enrichedBooking = {
        ...booking,
        eventTitle: event.title,
        eventDate: event.date,
        eventLocation: event.location
      };

      res.json(enrichedBooking);
    } catch (error) {
      console.error('Get booking details error:', error);
      res.status(500).json({ message: 'Failed to fetch booking details' });
    }
  });

  // GET /api/organizer/events - Get organizer's events
  app.get('/api/organizer/events', authenticateToken, requireRole(['organizer']), async (req, res) => {
    try {
      const organizerId = req.user._id || req.user.id;

      await mongoStorage.connect();

      const eventsCollection = mongoStorage.db.collection('events');
      const events = await eventsCollection.find({ organizerId: organizerId }).toArray();

      res.json(events);
    } catch (error) {
      console.error('Get organizer events error:', error);
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });

  // POST /api/organizer/events - Create a new event
  app.post('/api/organizer/events', authenticateToken, requireRole(['organizer']), async (req, res) => {
    try {
      const organizerId = req.user._id || req.user.id;
      const eventData = { ...req.body, organizerId: organizerId };

      await mongoStorage.connect();

      const eventsCollection = mongoStorage.db.collection('events');
      const result = await eventsCollection.insertOne(eventData);

      res.status(201).json({ message: 'Event created', eventId: result.insertedId });
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({ message: 'Failed to create event' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}