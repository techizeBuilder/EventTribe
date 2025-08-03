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

      // Fetch user's events
      const eventsCollection = mongoStorage.db.collection('events');
      const userEvents = await eventsCollection.find({ 
        organizerId: userId 
      }).toArray();

      // Fetch bookings for these events
      const bookingsCollection = mongoStorage.db.collection('bookings');
      const eventIds = userEvents.map(event => event._id.toString());

      const bookings = await bookingsCollection.find({
        eventId: { $in: eventIds },
        status: 'confirmed'
      }).toArray();

      // Calculate earnings per event
      const eventEarnings = userEvents.map(event => {
        const eventBookings = bookings.filter(booking => 
          booking.eventId === event._id.toString()
        );

        const revenue = eventBookings.reduce((total, booking) => {
          return total + (booking.totalAmount || 0);
        }, 0);

        const ticketsSold = eventBookings.reduce((total, booking) => {
          if (booking.ticketDetails && Array.isArray(booking.ticketDetails)) {
            return total + booking.ticketDetails.reduce((sum, ticket) => sum + ticket.quantity, 0);
          }
          return total + 1; // Default to 1 ticket if no details
        }, 0);

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

  const httpServer = createServer(app);
  return httpServer;
}