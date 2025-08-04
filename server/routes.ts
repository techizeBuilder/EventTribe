import type { Express } from "express";
import { createServer, type Server } from "http";
import { mongoStorage } from "./mongodb-storage.js";
import { AuthService, authenticateToken, requireRole } from './auth.js';
import Stripe from "stripe";

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
} else {
  console.warn('[STARTUP] Stripe not configured - payment routes will be disabled');
}

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
      if (!stripe) {
        return res.status(503).json({ error: "Payment processing not configured" });
      }

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
      if (!stripe) {
        return res.status(503).json({ error: "Payment processing not configured" });
      }

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

  // ==================== PUBLIC EVENT ROUTES ====================

  // Debug route to check all events in database
  app.get("/api/debug/events", async (req, res) => {
    try {
      await mongoStorage.connect();
      const eventsCollection = mongoStorage.db.collection('events');

      const allEvents = await eventsCollection.find({}).toArray();
      const statusCounts = {};

      allEvents.forEach(event => {
        const status = event.status || 'undefined';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      console.log(`Debug: Found ${allEvents.length} total events`);
      console.log('Debug: Status distribution:', statusCounts);

      res.json({
        totalEvents: allEvents.length,
        statusCounts,
        sampleEvents: allEvents.slice(0, 3).map(event => ({
          _id: event._id,
          title: event.title,
          status: event.status,
          category: event.category
        }))
      });
    } catch (error) {
      console.error("Error in debug route:", error);
      res.status(500).json({ message: "Error fetching debug info" });
    }
  });

  // GET /api/events/trending - Get trending events (must be before /api/events/:id)
  app.get("/api/events/trending", async (req, res) => {
    try {
      await mongoStorage.connect();
      const eventsCollection = mongoStorage.db.collection('events');

      // For now, get recent events as "trending" (you can modify this logic)
      const trendingEvents = await eventsCollection.find({ 
        status: { $in: ['approved', 'active', 'published'] }
      }).sort({ createdAt: -1 }).limit(6).toArray();

      console.log(`Found ${trendingEvents.length} trending events`);
      res.json(trendingEvents);
    } catch (error) {
      console.error("Error fetching trending events:", error);
      res.status(500).json({ message: "Error fetching trending events" });
    }
  });

  // GET /api/events/past - Get past events (must be before /api/events/:id)
  app.get("/api/events/past", async (req, res) => {
    try {
      await mongoStorage.connect();
      const eventsCollection = mongoStorage.db.collection('events');

      // Get events where end date is in the past
      const currentDate = new Date();
      const pastEvents = await eventsCollection.find({ 
        status: { $in: ['approved', 'active', 'published'] },
        endDate: { $lt: currentDate }
      }).sort({ endDate: -1 }).limit(8).toArray();

      console.log(`Found ${pastEvents.length} past events`);
      res.json(pastEvents);
    } catch (error) {
      console.error("Error fetching past events:", error);
      res.status(500).json({ message: "Error fetching past events" });
    }
  });

  // GET /api/events - Get all public events
  app.get("/api/events", async (req, res) => {
    try {
      await mongoStorage.connect();
      const eventsCollection = mongoStorage.db.collection('events');

      // First try to get events with specific statuses
      let events = await eventsCollection.find({ 
        status: { $in: ['approved', 'active', 'published'] }
      }).sort({ createdAt: -1 }).toArray();

      // If no events found with those statuses, get any events
      if (events.length === 0) {
        console.log('No events with approved/active/published status, fetching all events');
        events = await eventsCollection.find({}).sort({ createdAt: -1 }).toArray();
      }

      console.log(`Found ${events.length} public events`);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Error fetching events" });
    }
  });

  // GET /api/events/:id - Get specific event by ID (must be after specific routes)
  app.get("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await mongoStorage.connect();
      const { ObjectId } = await import('mongodb');
      const eventsCollection = mongoStorage.db.collection('events');

      let event = null;

      // Try different query formats
      if (ObjectId.isValid(id)) {
        event = await eventsCollection.findOne({ _id: new ObjectId(id) });
      }

      if (!event) {
        event = await eventsCollection.findOne({ _id: id });
      }

      if (!event) {
        event = await eventsCollection.findOne({ id: id });
      }

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Error fetching event" });
    }
  });

  // GET /api/events/category/:category - Get events by category
  app.get("/api/events/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      await mongoStorage.connect();
      const eventsCollection = mongoStorage.db.collection('events');

      // Case-insensitive category search
      const categoryEvents = await eventsCollection.find({ 
        status: { $in: ['approved', 'active', 'published'] },
        category: { $regex: new RegExp(category, 'i') }
      }).sort({ createdAt: -1 }).limit(12).toArray();

      console.log(`Found ${categoryEvents.length} events in category: ${category}`);
      res.json(categoryEvents);
    } catch (error) {
      console.error("Error fetching category events:", error);
      res.status(500).json({ message: "Error fetching category events" });
    }
  });

  // Multi-event payment intent for cart
  app.post("/api/create-multi-event-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ error: "Payment processing not configured" });
      }

      const { items, amount, userEmail, userName } = req.body;

      console.log("✅ HIT /api/create-multi-event-payment-intent", req.body);

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid items" });
      }

      // Connect to MongoDB to validate events
      await mongoStorage.connect();
      const { ObjectId } = await import('mongodb');

      // Validate all events exist (but don't fail if some don't exist for cart flexibility)
      for (const item of items) {
        if (item.eventId) {
          try {
            let event = null;

            // Try different query formats
            if (ObjectId.isValid(item.eventId)) {
              event = await mongoStorage.db.collection("events").findOne({ 
                _id: new ObjectId(item.eventId) 
              });
            }

            if (!event) {
              event = await mongoStorage.db.collection("events").findOne({ 
                _id: item.eventId 
              });
            }

            if (!event) {
              event = await mongoStorage.db.collection("events").findOne({ 
                id: item.eventId 
              });
            }

            console.log(`Event validation for ${item.eventId}:`, event ? 'Found' : 'Not found');

            // Don't fail the payment, just log if event not found
            if (!event) {
              console.warn(`Event ${item.eventId} not found in database, proceeding with payment`);
            }
          } catch (eventError) {
            console.warn(`Error validating event ${item.eventId}:`, eventError);
          }
        }
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userEmail: userEmail || "",
          userName: userName || "",
          itemCount: items.length.toString(),
          items: JSON.stringify(items.map(item => ({
            eventId: item.eventId,
            eventTitle: item.eventTitle,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.total
          })))
        }
      });

      console.log('Multi-event payment intent created:', paymentIntent.id);

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Error creating multi-event payment intent:", error);
      res.status(500).json({ 
        error: "Failed to create multi-event payment intent",
        message: error.message 
      });
    }
  });

  // Save single event booking
  app.post("/api/save-booking", async (req, res) => {
    try {
      const { paymentIntentId, eventId, eventTitle, ticketDetails, userEmail, userName } = req.body;

      console.log('Saving single booking:', { paymentIntentId, eventId, eventTitle, ticketDetails, userEmail, userName });

      if (!paymentIntentId) {
        return res.status(400).json({ success: false, error: "Payment intent ID is required" });
      }

      await mongoStorage.connect();
      const { ObjectId } = await import('mongodb');

      const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const totalAmount = ticketDetails.reduce((total, ticket) => {
        return total + (ticket.price * ticket.quantity);
      }, 0);

      const booking = {
        _id: new ObjectId(),
        bookingId,
        paymentIntentId,
        eventId,
        eventTitle,
        ticketDetails,
        userEmail,
        userName,
        totalAmount,
        currency: 'usd',
        status: 'confirmed',
        bookingDate: new Date(),
        createdAt: new Date()
      };

      const bookingsCollection = mongoStorage.db.collection('bookings');
      const result = await bookingsCollection.insertOne(booking);

      console.log('Single booking saved:', result.insertedId);

      res.json({ 
        success: true, 
        booking: { ...booking, _id: result.insertedId },
        message: "Booking saved successfully"
      });
    } catch (error: any) {
      console.error("Error saving single booking:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to save booking",
        message: error.message 
      });
    }
  });

  // Save multi-event booking
  app.post("/api/save-multi-event-booking", async (req, res) => {
    try {
      const { paymentIntentId, items, userEmail, userName } = req.body;

      console.log('Saving multi-event booking:', { paymentIntentId, items, userEmail, userName });

      if (!paymentIntentId) {
        return res.status(400).json({ success: false, error: "Payment intent ID is required" });
      }

      await mongoStorage.connect();
      const { ObjectId } = await import('mongodb');

      const bookingsCollection = mongoStorage.db.collection('bookings');
      const savedBookings = [];

      // Create individual bookings for each item
      for (const item of items) {
        const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const booking = {
          _id: new ObjectId(),
          bookingId,
          paymentIntentId,
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          ticketDetails: [{
            type: item.name,
            price: item.price,
            quantity: item.quantity
          }],
          userEmail,
          userName,
          totalAmount: item.total,
          currency: 'usd',
          status: 'confirmed',
          bookingDate: new Date(),
          createdAt: new Date()
        };

        const result = await bookingsCollection.insertOne(booking);
        savedBookings.push({ ...booking, _id: result.insertedId });
      }

      console.log(`Saved ${savedBookings.length} bookings for multi-event payment`);

      res.json({ 
        success: true, 
        bookings: savedBookings,
        message: `Successfully saved ${savedBookings.length} bookings`
      });
    } catch (error: any) {
      console.error("Error saving multi-event booking:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to save booking",
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
      console.error("Error getting server info:", error);
      res.status(500).json({ message: "Error getting server info" });
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

  // POST /api/create-dummy-bookings-for-org - Create dummy bookings for specific organization
  app.post('/api/create-dummy-bookings-for-org', async (req, res) => {
    try {
      const { organizerEmail } = req.body;

      if (!organizerEmail) {
        return res.status(400).json({ message: 'Organizer email is required' });
      }

      await mongoStorage.connect();
      const { ObjectId } = await import('mongodb');

      const eventsCollection = mongoStorage.db.collection('events');
      const bookingsCollection = mongoStorage.db.collection('bookings');
      const usersCollection = mongoStorage.db.collection('users');

      // Find the organizer
      const organizer = await usersCollection.findOne({ email: organizerEmail });

      if (!organizer) {
        return res.status(404).json({ message: 'Organizer not found' });
      }

      const organizerId = organizer._id?.toString() || organizer.id;

      // Get events for this organizer
      let organizerEvents = await eventsCollection.find({ 
        organizerId: organizerId 
      }).toArray();

      // If no events found with string ID, try ObjectId
      if (organizerEvents.length === 0 && ObjectId.isValid(organizerId)) {
        organizerEvents = await eventsCollection.find({ 
          organizerId: new ObjectId(organizerId)
        }).toArray();
      }

      if (organizerEvents.length === 0) {
        return res.status(404).json({ message: 'No events found for this organizer' });
      }

      console.log(`Found ${organizerEvents.length} events for organizer ${organizerEmail}`);

      // Create dummy bookings for each event
      const dummyBookings = [];
      const customerNames = [
        'John Smith', 'Sarah Johnson', 'Michael Davis', 'Emily Wilson', 
        'David Brown', 'Jessica Miller', 'Chris Anderson', 'Amanda Taylor',
        'Ryan Martinez', 'Ashley Thomas', 'Kevin White', 'Nicole Garcia'
      ];

      for (const event of organizerEvents) {
        // Create 3-8 random bookings per event
        const bookingCount = Math.floor(Math.random() * 6) + 3;

        for (let i = 0; i < bookingCount; i++) {
          const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
          const nameParts = customerName.split(' ');
          const ticketTypes = ['General Admission', 'VIP', 'Early Bird', 'Standard'];
          const ticketType = ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
          const ticketPrice = Math.floor(Math.random() * 300) + 25; // $25-$325
          const quantity = Math.floor(Math.random() * 4) + 1; // 1-4 tickets
          const totalAmount = ticketPrice * quantity;

          const booking = {
            _id: new ObjectId(),
            bookingId: `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            paymentIntentId: `pi_${Math.random().toString(36).substr(2, 24)}`,
            eventId: event._id.toString(),
            eventTitle: event.title,
            ticketDetails: [{
              type: ticketType,
              price: ticketPrice,
              quantity: quantity,
              name: ticketType
            }],
            userEmail: `${nameParts[0].toLowerCase()}.${nameParts[1].toLowerCase()}@example.com`,
            userName: customerName,
            totalAmount: totalAmount,
            currency: 'usd',
            status: 'confirmed',
            paymentStatus: 'completed',
            bookingDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Random date within last 30 days
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            attendeeInfo: {
              firstName: nameParts[0],
              lastName: nameParts[1],
              email: `${nameParts[0].toLowerCase()}.${nameParts[1].toLowerCase()}@example.com`,
              phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
            }
          };

          dummyBookings.push(booking);
        }
      }

      if (dummyBookings.length > 0) {
        await bookingsCollection.insertMany(dummyBookings);
        console.log(`Created ${dummyBookings.length} dummy bookings for ${organizerEmail}`);
      }

      // Calculate total earnings
      const totalEarnings = dummyBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
      const totalBookings = dummyBookings.length;

      res.json({ 
        message: `Successfully created ${totalBookings} dummy bookings for ${organizerEmail}`,
        bookings: totalBookings,
        totalEarnings: totalEarnings,
        events: organizerEvents.length,
        details: dummyBookings.map(b => ({
          bookingId: b.bookingId,
          eventTitle: b.eventTitle,
          customerName: b.userName,
          amount: b.totalAmount,
          tickets: b.ticketDetails[0].quantity
        }))
      });
    } catch (error) {
      console.error('Error creating dummy bookings:', error);
      res.status(500).json({ message: 'Failed to create dummy bookings', error: error.message });
    }
  });

  // DISABLED - Use enhanced routes instead
  // app.get('/api/organizer/bookings', authenticateToken, requireRole(['organizer']), async (req, res) => {
  // DISABLED - Conflicts with enhanced routes system
  // });

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

  // GET /api/organizer/earnings - Get organizer earnings data
  app.get('/api/organizer/earnings', authenticateToken, requireRole(['organizer']), async (req, res) => {
    try {
      const organizerId = req.user._id || req.user.id;

      await mongoStorage.connect();
      const { ObjectId } = await import('mongodb');

      // Get organizer's events
      const eventsCollection = mongoStorage.db.collection('events');
      const organizerEvents = await eventsCollection.find({ organizerId }).toArray();

      // Get bookings for these events
      const bookingsCollection = mongoStorage.db.collection('bookings');
      let allBookings = [];

      if (organizerEvents.length > 0) {
        const eventIds = organizerEvents.map(event => event._id);
        allBookings = await bookingsCollection.find({
          eventId: { $in: eventIds }
        }).toArray();
      }

      // Calculate earnings data
      const totalRevenue = allBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      const totalTicketsSold = allBookings.reduce((sum, booking) => {
        if (booking.ticketDetails && Array.isArray(booking.ticketDetails)) {
          return sum + booking.ticketDetails.reduce((total, ticket) => total + (ticket.quantity || 0), 0);
        }
        return sum + 1;
      }, 0);
      const totalBookings = allBookings.length;

      // Event-wise earnings
      const eventEarnings = organizerEvents.map(event => {
        const eventBookings = allBookings.filter(booking => 
          booking.eventId.toString() === event._id.toString()
        );

        const revenue = eventBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
        const ticketsSold = eventBookings.reduce((sum, booking) => {
          if (booking.ticketDetails && Array.isArray(booking.ticketDetails)) {
            return sum + booking.ticketDetails.reduce((total, ticket) => total + (ticket.quantity || 0), 0);
          }
          return sum + 1;
        }, 0);

        return {
          _id: event._id,
          title: event.title,
          revenue,
          ticketsSold,
          bookingsCount: eventBookings.length,
          createdAt: event.createdAt
        };
      });

      res.json({
        totalRevenue,
        totalTicketsSold,
        totalBookings,
        totalEvents: organizerEvents.length,
        events: eventEarnings
      });

    } catch (error) {
      console.error('Error fetching earnings:', error);
      res.status(500).json({ message: 'Failed to fetch earnings', error: error.message });
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

  // Public events routes (no authentication required)
  app.get('/api/events', async (req, res) => {
    try {
      const { mongoStorage } = await import('./mongodb-storage.js');
      await mongoStorage.connect();

      const eventsCollection = mongoStorage.db.collection('events');

      // Return all events for public view (including draft for development)
      let events = await eventsCollection.find({}).sort({ createdAt: -1 }).toArray();

      // If no events exist, create some sample ones for demo
      if (events.length === 0) {
        const sampleEvents = [
          {
            title: "Summer Music Festival 2025",
            description: "Join us for an amazing summer music festival featuring top artists",
            location: "Central Park, New York",
            startDate: "2025-07-15T18:00:00.000Z",
            endDate: "2025-07-15T23:00:00.000Z",
            category: "MUSIC",
            status: "published",
            image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
            ticketTypes: [
              {
                name: "General Admission",
                price: 75,
                quantity: 500,
                sold: 0
              }
            ],
            createdAt: new Date(),
            organizerId: "sample_organizer"
          },
          {
            title: "Tech Conference 2025",
            description: "Learn about the latest in technology and innovation",
            location: "Convention Center, San Francisco",
            startDate: "2025-08-20T09:00:00.000Z",
            endDate: "2025-08-20T17:00:00.000Z",
            category: "TECHNOLOGY",
            status: "published",
            image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
            ticketTypes: [
              {
                name: "Standard Pass",
                price: 150,
                quantity: 300,
                sold: 0
              }
            ],
            createdAt: new Date(),
            organizerId: "sample_organizer"
          },
          {
            title: "Food & Wine Festival",
            description: "Taste the finest cuisine and wines from around the world",
            location: "Harbor District, Miami",
            startDate: "2025-09-10T16:00:00.000Z",
            endDate: "2025-09-10T22:00:00.000Z",
            category: "FOOD & DRINK",
            status: "published",
            image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
            ticketTypes: [
              {
                name: "Tasting Pass",
                price: 95,
                quantity: 200,
                sold: 0
              }
            ],
            createdAt: new Date(),
            organizerId: "sample_organizer"
          }
        ];

        await eventsCollection.insertMany(sampleEvents);
        events = sampleEvents;
      }

      res.json(events);
    } catch (error) {
      console.error('Error fetching public events:', error);
      res.status(500).json({ message: 'Failed to fetch events' });
    }
  });

  // Public trending events
  app.get('/api/events/trending', async (req, res) => {
    try {
      const { mongoStorage } = await import('./mongodb-storage.js');
      await mongoStorage.connect();

      const eventsCollection = mongoStorage.db.collection('events');

      // Return trending events (for demo, just return recent events)
      const events = await eventsCollection.find({}).sort({ createdAt: -1 }).limit(8).toArray();

      res.json(events);
    } catch (error) {
      console.error('Error fetching trending events:', error);
      res.status(500).json({ message: 'Failed to fetch trending events' });
    }
  });

  // Public past events
  app.get('/api/events/past', async (req, res) => {
    try {
      const { mongoStorage } = await import('./mongodb-storage.js');
      await mongoStorage.connect();

      const eventsCollection = mongoStorage.db.collection('events');

      // Return past events (for demo, return older events)
      const currentDate = new Date();
      const events = await eventsCollection.find({
        endDate: { $lt: currentDate.toISOString() }
      }).sort({ endDate: -1 }).limit(6).toArray();

      res.json(events);
    } catch (error) {
      console.error('Error fetching past events:', error);
      res.status(500).json({ message: 'Failed to fetch past events' });
    }
  });

  // Public events by category
  app.get('/api/events/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const { mongoStorage } = await import('./mongodb-storage.js');
      await mongoStorage.connect();

      const eventsCollection = mongoStorage.db.collection('events');

      // Return events by category
      const events = await eventsCollection.find({
        category: { $regex: new RegExp(category, 'i') }
      }).sort({ createdAt: -1 }).limit(12).toArray();

      res.json(events);
    } catch (error) {
      console.error('Error fetching events by category:', error);
      res.status(500).json({ message: 'Failed to fetch events by category' });
    }
  });

  // Cart routes
  app.post("/api/cart/add", async (req, res) => {
    try {
      const { userEmail, eventId, eventTitle, ticketType, quantity } = req.body;

      console.log("Cart add request:", { userEmail, eventId, eventTitle, ticketType, quantity });

      if (!userEmail || !eventId || !eventTitle || !ticketType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { mongoStorage } = await import('./mongodb-storage.js');
      await mongoStorage.connect();

      // Check if item already exists in cart
      const existingItem = await mongoStorage.cart.findOne({
        userEmail,
        eventId,
        'ticketType.name': ticketType.name
      });

      if (existingItem) {
        // Update quantity if item exists
        await mongoStorage.cart.updateOne(
          { _id: existingItem._id },
          { $inc: { quantity: parseInt(quantity) || 1 } }
        );
        console.log("Updated existing cart item quantity");
      } else {
        // Add new item to cart
        const cartItem = {
          userEmail,
          eventId,
          eventTitle,
          ticketType: {
            name: ticketType.name,
            price: parseFloat(ticketType.price) || 25.0,
            description: ticketType.description || "Standard event ticket"
          },
          quantity: parseInt(quantity) || 1,
          addedAt: new Date()
        };

        const result = await mongoStorage.cart.insertOne(cartItem);
        console.log("Added new cart item:", result.insertedId);
      }

      res.json({ success: true, message: "Item added to cart" });
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ error: "Failed to add item to cart" });
    }
  });
app.get("/api/cart/:userEmail", async (req, res) => {
    try {
      const { userEmail } = req.params;
      const { mongoStorage } = await import('./mongodb-storage.js');
      await mongoStorage.connect();

      const cartItems = await mongoStorage.getCart(userEmail);
      const count = await mongoStorage.getCartCount(userEmail);

      console.log(`[Cart] Retrieved ${cartItems?.length || 0} items for user ${userEmail}`);

      res.json({ 
        items: cartItems || [], 
        count: count || 0,
        success: true 
      });
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ error: "Failed to fetch cart", items: [], count: 0 });
    }
  });
  const httpServer = createServer(app);
  return httpServer;
}