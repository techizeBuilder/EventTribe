import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { mongoStorage } from "./mongodb-storage.js";
import { AuthService, requireRole as oldRequireRole } from "./auth.js";
import { enhancedAuthService } from "./authServiceEnhanced.js";
import { payoutService } from "./services/payoutService.js";
import { stripeConnectService } from "./stripeConnect.js";
import { authenticateToken, requireRole, authenticateOrganizer } from "./middleware/authMiddleware.js";
import Stripe from "stripe";
import dotenv from "dotenv";
import passport from "passport";
import organizerPayoutRoutes from "./routes/organizerPayoutRoutes.js";
import adminPayoutRoutes from "./routes/adminPayoutRoutes.js";
dotenv.config();
let stripe = null;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (stripeSecretKey && stripeSecretKey.startsWith("sk_")) {
  try {
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });
    console.log("[STARTUP] Stripe configured successfully");
  } catch (error) {
    console.error("[STARTUP] Stripe configuration error:", error);
  }
} else {
  console.warn("[STARTUP] Stripe not configured - using fallback key");
  // Use a fallback test key for development
  stripe = new Stripe(stripeSecretKey || 'sk_test_fallback', {
    apiVersion: "2025-08-27.basil",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB
  await mongoStorage.connect();

  // Initialize Auth Service
  const authService = new AuthService();
  await authService.connect();

  // Initialize Enhanced Auth Service
  await enhancedAuthService.connect();

  // Setup passport middleware
  app.use(passport.initialize());

  // Authentication Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { user, token } = await authService.register(req.body);
      res.status(201).json({
        message: "User registered successfully",
        user,
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({
        message: error.message || "Registration failed",
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = await enhancedAuthService.login(req.body);
      res.json(result);
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({
        message: error.message || "Login failed",
      });
    }
  });

  // Google OAuth Routes
  app.get("/api/auth/google", passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  app.get("/api/auth/google/callback",
    passport.authenticate('google', {
      session: false,
      failureRedirect: '/login?error=google_auth_failed'
    }),
    async (req: any, res) => {
      try {
        // Generate JWT tokens for the authenticated user
        const { accessToken, refreshToken } = enhancedAuthService.generateTokens(req.user._id, req.user.role);

        // Store refresh token
        await enhancedAuthService.storeRefreshToken(req.user._id, refreshToken);

        // Redirect to frontend with tokens in URL (will be handled by frontend)
        const redirectUrl = `/?token=${accessToken}&refresh=${refreshToken}&user=${encodeURIComponent(JSON.stringify({
          id: req.user._id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
          profileImageUrl: req.user.profileImageUrl
        }))}`;

        res.redirect(redirectUrl);
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        res.redirect('/login?error=oauth_callback_failed');
      }
    }
  );

  app.get("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      res.json({
        message: "Profile retrieved successfully",
        user: req.user,
      });
    } catch (error) {
      console.error("Profile error:", error);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.put("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      await authService.updateUser((req.user as any).id || (req.user as any)._id, req.body);
      const updatedUser = await authService.getUserById((req.user as any).id || (req.user as any)._id);
      res.json({
        message: "Profile updated successfully",
        user: updatedUser,
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

  // Test email configuration endpoint
  app.get("/api/test-email", async (req, res) => {
    try {
      console.log('[EMAIL TEST] Testing email configuration...');
      console.log('[EMAIL TEST] Current environment variables:');
      console.log('[EMAIL TEST] MAIL_HOST:', process.env.MAIL_HOST);
      console.log('[EMAIL TEST] MAIL_PORT:', process.env.MAIL_PORT);
      console.log('[EMAIL TEST] MAIL_USERNAME:', process.env.MAIL_USERNAME);
      console.log('[EMAIL TEST] MAIL_FROM_ADDRESS:', process.env.MAIL_FROM_ADDRESS);
      
      const { testEmailConnection } = await import("./services/emailService.js");
      
      const result = await testEmailConnection();
      
      if (result) {
        res.json({
          success: true,
          message: "Email configuration is working correctly",
          timestamp: new Date().toISOString(),
          config: {
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            username: process.env.MAIL_USERNAME,
            fromAddress: process.env.MAIL_FROM_ADDRESS
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Email configuration test failed",
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("[EMAIL TEST] Error testing email:", error);
      res.status(500).json({
        success: false,
        message: "Email test failed",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test Pay Later email endpoint
  app.post("/api/test-pay-later-email", async (req, res) => {
    try {
      console.log('[EMAIL TEST] Testing Pay Later email...');
      const { sendPayLaterBookingEmail } = await import("./services/emailService.js");
      
      const testEmailData = {
        to: "jeetu.mj123@gmail.com",
        userName: "Jeetu Test User",
        bookings: [
          {
            eventTitle: "Test Event",
            bookingCode: "TEST1234",
            amount: 50,
            ticketType: "General Admission",
            quantity: 1
          }
        ],
        totalAmount: 50
      };

      console.log('[EMAIL TEST] Sending test Pay Later email with data:', testEmailData);
      await sendPayLaterBookingEmail(testEmailData);
      
      res.json({
        success: true,
        message: "Test Pay Later email sent successfully",
        timestamp: new Date().toISOString(),
        testData: testEmailData
      });
    } catch (error) {
      console.error("[EMAIL TEST] Error sending test Pay Later email:", error);
      res.status(500).json({
        success: false,
        message: "Test Pay Later email failed",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.get("/api/server-info", async (req, res) => {
    try {
      const stats = await mongoStorage.getStats();
      res.json({
        backend: {
          url: `http://localhost:${process.env.PORT || 5000}`,
          status: "running",
          version: "1.0.0",
        },
        frontend: {
          url: `http://localhost:${process.env.PORT || 5000}`,
          framework: "React.js",
        },
        database: {
          type: "MongoDB",
          name: "express_react_app",
          connected: true,
          totalUsers: stats.totalUsers,
        },
        config: {
          cors: true,
          errorHandling: true,
          logging: true,
          hotReload: process.env.NODE_ENV === "development",
        },
      });
    } catch (error) {
      console.error("Error getting server info:", error);
      res.status(500).json({ message: "Error getting server info" });
    }
  });

  // Stripe Connect payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        console.error("Stripe not initialized for single payment");
        return res.status(503).json({
          error: "Payment processing not configured",
          message: "Stripe service is not available",
        });
      }

      const { amount, eventId, eventTitle, ticketDetails } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // Get event and organizer's connected account
      await mongoStorage.connect();
      const { ObjectId } = await import("mongodb");
      const eventsCollection = mongoStorage.db.collection("events");
      const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Get organizer's Stripe connected account
      const organizersCollection = mongoStorage.db.collection("users");
      const organizer = await organizersCollection.findOne({ _id: new ObjectId(event.organizerId) });

      if (!organizer?.stripeConnectedAccountId) {
        return res.status(400).json({
          error: "Organizer not set up for payments",
          message: "Organizer needs to complete Stripe onboarding"
        });
      }

      // Calculate platform fee (20%)
      const platformFeeAmount = Math.round(amount * 0.20 * 100); // 20% in cents

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: organizer.stripeConnectedAccountId,
        },
        metadata: {
          eventId: eventId || "",
          eventTitle: eventTitle || "",
          ticketDetails: JSON.stringify(ticketDetails || {}),
          organizerId: event.organizerId,
          platformFee: (platformFeeAmount / 100).toString(),
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({
        error: "Failed to create payment intent",
        message: error.message,
      });
    }
  });

  app.post("/api/confirm-payment", async (req, res) => {
    try {
      if (!stripe) {
        return res
          .status(503)
          .json({ error: "Payment processing not configured" });
      }

      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "Payment intent ID is required" });
      }

      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === "succeeded") {
        // Here you could save the payment details to your database
        // For now, we'll just return success
        res.json({
          success: true,
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
        });
      } else {
        res.json({
          success: false,
          status: paymentIntent.status,
        });
      }
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({
        error: "Failed to confirm payment",
        message: error.message,
      });
    }
  });

  // ==================== REMOVED - BANK ACCOUNT ROUTES MOVED BELOW ====================

  // ==================== PUBLIC EVENT ROUTES ====================

  // Debug route to check all events in database
  app.get("/api/debug/events", async (req, res) => {
    try {
      await mongoStorage.connect();
      const eventsCollection = mongoStorage.db.collection("events");

      const allEvents = await eventsCollection.find({}).toArray();
      const statusCounts = {};

      allEvents.forEach((event) => {
        const status = event.status || "undefined";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      console.log(`Debug: Found ${allEvents.length} total events`);
      console.log("Debug: Status distribution:", statusCounts);

      res.json({
        totalEvents: allEvents.length,
        statusCounts,
        sampleEvents: allEvents.slice(0, 3).map((event) => ({
          _id: event._id,
          title: event.title,
          status: event.status,
          category: event.category,
        })),
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
      const eventsCollection = mongoStorage.db.collection("events");

      // For now, get recent events as "trending" (you can modify this logic)
      const trendingEvents = await eventsCollection
        .find({
          status: { $in: ["approved", "active", "published"] },
        })
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

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
      const eventsCollection = mongoStorage.db.collection("events");

      // Get events where end date is in the past
      const currentDate = new Date();
      const pastEvents = await eventsCollection
        .find({
          status: { $in: ["approved", "active", "published"] },
          endDate: { $lt: currentDate },
        })
        .sort({ endDate: -1 })
        .limit(8)
        .toArray();

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
      const eventsCollection = mongoStorage.db.collection("events");

      // First try to get events with specific statuses
      let events = await eventsCollection
        .find({
          status: { $in: ["approved", "active", "published"] },
        })
        .sort({ createdAt: -1 })
        .toArray();

      // If no events found with those statuses, get any events
      if (events.length === 0) {
        console.log(
          "No events with approved/active/published status, fetching all events",
        );
        events = await eventsCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();
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
      const { ObjectId } = await import("mongodb");
      const eventsCollection = mongoStorage.db.collection("events");

      let event = null;

      // Try different query formats
      if (ObjectId.isValid(id)) {
        event = await eventsCollection.findOne({ _id: new ObjectId(id) });
      }

      if (!event) {
        event = await eventsCollection.findOne({ _id: id } as any);
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
      const eventsCollection = mongoStorage.db.collection("events");

      // Case-insensitive category search
      const categoryEvents = await eventsCollection
        .find({
          status: { $in: ["approved", "active", "published"] },
          category: { $regex: new RegExp(category, "i") },
        })
        .sort({ createdAt: -1 })
        .limit(12)
        .toArray();

      console.log(
        `Found ${categoryEvents.length} events in category: ${category}`,
      );
      res.json(categoryEvents);
    } catch (error) {
      console.error("Error fetching category events:", error);
      res.status(500).json({ message: "Error fetching category events" });
    }
  });

  // Multi-event payment intent for cart with Stripe Connect
  app.post("/api/create-multi-event-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        console.error("Stripe not initialized");
        return res.status(503).json({
          error: "Payment processing not configured",
          message: "Stripe service is not available",
        });
      }

      const { items, amount, userEmail, userName } = req.body;

      console.log("✅ HIT /api/create-multi-event-payment-intent", req.body);

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid items" });
      }

      // For multi-event payments, check if all items are from same organizer
      await mongoStorage.connect();
      const { ObjectId } = await import("mongodb");
      const eventsCollection = mongoStorage.db.collection("events");
      const organizersCollection = mongoStorage.db.collection("users");

      // Get event details and check organizers
      const eventIds = items.map(item => new ObjectId(item.eventId));
      const events = await eventsCollection.find({ _id: { $in: eventIds } }).toArray();

      const organizerIds = events.map(event => event.organizerId.toString());
      const uniqueOrganizers = Array.from(new Set(organizerIds));

      if (uniqueOrganizers.length === 1) {
        // Single organizer - use destination charges
        const organizer = await organizersCollection.findOne({ _id: new ObjectId(uniqueOrganizers[0]) });

        if (!organizer?.stripeConnectedAccountId) {
          return res.status(400).json({
            error: "Organizer not set up for payments",
            message: "Organizer needs to complete Stripe onboarding"
          });
        }

        // Calculate platform fee (20%)
        const platformFeeAmount = Math.round(amount * 0.20 * 100); // 20% in cents

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
          application_fee_amount: platformFeeAmount,
          transfer_data: {
            destination: organizer.stripeConnectedAccountId,
          },
          metadata: {
            userEmail: userEmail || "",
            userName: userName || "",
            itemCount: items.length.toString(),
            platformFee: (platformFeeAmount / 100).toString(),
            organizerId: uniqueOrganizers[0],
            type: "multi_event_single_organizer",
            items: JSON.stringify(
              items.map((item) => ({
                eventId: item.eventId,
                eventTitle: item.eventTitle,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.total,
              })),
            ),
          },
        });

        console.log("Multi-event single organizer payment intent created:", paymentIntent.id);

        res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        });
      } else {
        // Multiple organizers - use regular payment intent, handle transfers in post-processing
        const platformFeeAmount = Math.round(amount * 0.20 * 100); // 20% in cents

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
          metadata: {
            userEmail: userEmail || "",
            userName: userName || "",
            itemCount: items.length.toString(),
            platformFee: (platformFeeAmount / 100).toString(),
            type: "multi_event_multi_organizer",
            items: JSON.stringify(
              items.map((item) => ({
                eventId: item.eventId,
                eventTitle: item.eventTitle,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.total,
              })),
            ),
          },
        });

        console.log("Multi-event multi-organizer payment intent created:", paymentIntent.id);

        res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        });
      }
    } catch (error: any) {
      console.error("Error creating multi-event payment intent:", error);
      res.status(500).json({
        error: "Failed to create multi-event payment intent",
        message: error.message,
      });
    }
  });

  // Save single event booking
  app.post("/api/save-booking", async (req, res) => {
    try {
      const {
        paymentIntentId,
        eventId,
        eventTitle,
        ticketDetails,
        userEmail,
        userName,
      } = req.body;

      console.log("Saving single booking:", {
        paymentIntentId,
        eventId,
        eventTitle,
        ticketDetails,
        userEmail,
        userName,
      });

      if (!paymentIntentId) {
        return res
          .status(400)
          .json({ success: false, error: "Payment intent ID is required" });
      }

      await mongoStorage.connect();
      const { ObjectId } = await import("mongodb");

      const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const totalAmount = ticketDetails.reduce((total, ticket) => {
        return total + ticket.price * ticket.quantity;
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
        currency: "usd",
        status: "confirmed",
        bookingDate: new Date(),
        createdAt: new Date(),
      };

      const bookingsCollection = mongoStorage.db.collection("bookings");
      const result = await bookingsCollection.insertOne(booking);

      console.log("Single booking saved:", result.insertedId);

      // Get event and organization details for payout processing
      const eventsCollection = mongoStorage.db.collection("events");
      const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });

      if (event) {
        // Process payout split (80% immediate, 20% pending)
        try {
          await payoutService.processPayoutSplit({
            bookingId: result.insertedId.toString(),
            eventId: eventId,
            organizationId: event.organizationId.toString(),
            organizerId: event.organizerId.toString(),
            totalAmount: totalAmount,
            paymentIntentId: paymentIntentId,
            ticketDetails: ticketDetails,
            customerEmail: userEmail,
            customerName: userName
          });
          console.log(`[Payout] Successfully processed revenue split for booking ${result.insertedId}`);
        } catch (payoutError) {
          console.error("[Payout] Error processing payout split:", payoutError);
          // Don't fail the booking save, but log the error
        }
      }

      res.json({
        success: true,
        booking: { ...booking, _id: result.insertedId },
        message: "Booking saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving single booking:", error);
      res.status(500).json({
        success: false,
        error: "Failed to save booking",
        message: error.message,
      });
    }
  });

  // Save multi-event booking
  app.post("/api/save-multi-event-booking", async (req, res) => {
    try {
      const { paymentIntentId, items, userEmail, userName } = req.body;

      console.log("Saving multi-event booking:", {
        paymentIntentId,
        items,
        userEmail,
        userName,
      });

      if (!paymentIntentId) {
        return res
          .status(400)
          .json({ success: false, error: "Payment intent ID is required" });
      }

      await mongoStorage.connect();
      const { ObjectId } = await import("mongodb");

      const bookingsCollection = mongoStorage.db.collection("bookings");
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
          ticketDetails: [
            {
              type: item.name,
              price: item.price,
              quantity: item.quantity,
            },
          ],
          userEmail,
          userName,
          totalAmount: item.total,
          currency: "usd",
          status: "confirmed",
          bookingDate: new Date(),
          createdAt: new Date(),
        };

        const result = await bookingsCollection.insertOne(booking);
        savedBookings.push({ ...booking, _id: result.insertedId });

        // Process payout split for each booking
        const eventsCollection = mongoStorage.db.collection("events");
        const event = await eventsCollection.findOne({ _id: new ObjectId(item.eventId) });

        if (event) {
          try {
            await payoutService.processPayoutSplit({
              bookingId: result.insertedId.toString(),
              eventId: item.eventId,
              organizationId: event.organizationId.toString(),
              organizerId: event.organizerId.toString(),
              totalAmount: item.total,
              paymentIntentId: paymentIntentId,
              ticketDetails: [{
                type: item.name,
                price: item.price,
                quantity: item.quantity
              }],
              customerEmail: userEmail,
              customerName: userName
            });
            console.log(`[Payout] Successfully processed revenue split for multi-event booking ${result.insertedId}`);
          } catch (payoutError) {
            console.error("[Payout] Error processing payout split for multi-event booking:", payoutError);
          }
        }
      }

      console.log(
        `Saved ${savedBookings.length} bookings for multi-event payment`,
      );

      res.json({
        success: true,
        bookings: savedBookings,
        message: `Successfully saved ${savedBookings.length} bookings`,
      });
    } catch (error: any) {
      console.error("Error saving multi-event booking:", error);
      res.status(500).json({
        success: false,
        error: "Failed to save booking",
        message: error.message,
      });
    }
  });

  // Create Pay Later booking
  app.post("/api/create-pay-later-booking", async (req, res) => {
    try {
      const { items, amount, userEmail, userName } = req.body;

      console.log("Creating pay later booking:", {
        items,
        amount,
        userEmail,
        userName,
      });

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid items"
        });
      }

      if (!userEmail || !userName) {
        return res.status(400).json({
          success: false,
          error: "User email and name are required"
        });
      }

      await mongoStorage.connect();
      const { ObjectId } = await import("mongodb");

      const bookingsCollection = mongoStorage.db.collection("bookings");
      const savedBookings = [];
      const bookingCodes = [];

      // Create individual bookings for each item with unique codes
      for (const item of items) {
        const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const bookingCode = Math.random().toString(36).substr(2, 8).toUpperCase(); // 8-character alphanumeric code

        const booking = {
          _id: new ObjectId(),
          bookingId,
          bookingCode, // Unique code for verification
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          ticketDetails: [
            {
              type: item.name,
              price: item.price,
              quantity: item.quantity,
            },
          ],
          userEmail,
          userName,
          totalAmount: item.total,
          currency: "usd",
          status: "pending_verification", // New status for pay later
          paymentStatus: "pending_offline", // New payment status
          paymentMethod: "pay_later",
          bookingDate: new Date(),
          createdAt: new Date(),
          codeUsed: false,
          codeExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
        };

        const result = await bookingsCollection.insertOne(booking);
        savedBookings.push({ ...booking, _id: result.insertedId });
        bookingCodes.push({
          eventTitle: item.eventTitle,
          bookingCode,
          amount: item.total,
          ticketType: item.name,
          quantity: item.quantity
        });
      }

      // Send email with booking codes
      try {
        console.log('[PAY LATER] 📧 Preparing to send booking codes email...');
        console.log('[PAY LATER] Email recipient:', userEmail);
        console.log('[PAY LATER] User name:', userName);
        console.log('[PAY LATER] Booking codes:', bookingCodes);
        
        const emailService = await import("./services/emailService.js");

        // Prepare email data
        const emailData = {
          to: userEmail,
          userName,
          bookings: bookingCodes,
          totalAmount: amount
        };

        console.log('[PAY LATER] 📤 Calling sendPayLaterBookingEmail...');
        await emailService.sendPayLaterBookingEmail(emailData);
        console.log(`[PAY LATER] ✅ Pay later booking email sent successfully to ${userEmail}`);
      } catch (emailError) {
        console.error("[PAY LATER] ❌ Failed to send pay later booking email:", emailError);
        console.error("[PAY LATER] Email error details:", {
          message: emailError.message,
          stack: emailError.stack,
          code: emailError.code
        });
        // Don't fail the booking if email fails
      }

      console.log(
        `Created ${savedBookings.length} pay later bookings with codes`,
      );

      res.json({
        success: true,
        bookings: savedBookings,
        bookingCodes,
        message: `Successfully created ${savedBookings.length} pay later bookings`,
      });
    } catch (error: any) {
      console.error("Error creating pay later booking:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create pay later booking",
        message: error.message,
      });
    }
  });

  // Verify booking code and mark as paid
  app.post("/api/verify-booking-code", async (req, res) => {
    try {
      const { bookingCode, collectedAmount, organizerId } = req.body;

      console.log("Verifying booking code:", {
        bookingCode,
        collectedAmount,
        organizerId,
      });

      if (!bookingCode || !collectedAmount) {
        return res.status(400).json({
          success: false,
          error: "Booking code and collected amount are required"
        });
      }

      await mongoStorage.connect();
      const { ObjectId } = await import("mongodb");

      const bookingsCollection = mongoStorage.db.collection("bookings");

      // Find booking by code
      const booking = await bookingsCollection.findOne({
        bookingCode: bookingCode.toUpperCase(),
        codeUsed: false, // Ensure code hasn't been used
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Invalid or already used booking code"
        });
      }

      // Check if code has expired
      if (booking.codeExpiresAt && new Date() > new Date(booking.codeExpiresAt)) {
        return res.status(400).json({
          success: false,
          message: "Booking code has expired"
        });
      }

      // Check if booking is already paid
      if (booking.status === "confirmed" && booking.paymentStatus === "paid") {
        return res.status(400).json({
          success: false,
          message: "This booking has already been paid"
        });
      }

      // Verify organizer access (optional - for additional security)
      const eventsCollection = mongoStorage.db.collection("events");
      const event = await eventsCollection.findOne({
        _id: new ObjectId(booking.eventId)
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found"
        });
      }

      // Update booking status
      const updateResult = await bookingsCollection.updateOne(
        { _id: booking._id },
        {
          $set: {
            status: "confirmed",
            paymentStatus: "paid",
            paymentMethod: "cash_at_event",
            codeUsed: true,
            codeUsedAt: new Date(),
            collectedAmount: parseFloat(collectedAmount),
            collectedBy: organizerId,
            verifiedAt: new Date(),
            updatedAt: new Date(),
          }
        }
      );

      if (updateResult.modifiedCount === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to update booking status"
        });
      }

      // Process payout split for the verified booking
      try {
        await payoutService.processPayoutSplit({
          bookingId: booking._id.toString(),
          eventId: booking.eventId,
          organizationId: event.organizationId.toString(),
          organizerId: event.organizerId.toString(),
          totalAmount: parseFloat(collectedAmount),
          paymentIntentId: `cash_${booking.bookingCode}_${Date.now()}`,
          ticketDetails: booking.ticketDetails,
          customerEmail: booking.userEmail,
          customerName: booking.userName
        });
        console.log(`[Payout] Successfully processed revenue split for verified booking ${booking._id}`);
      } catch (payoutError) {
        console.error("[Payout] Error processing payout split for verified booking:", payoutError);
        // Don't fail the verification if payout fails
      }

      // Send confirmation email to attendee
      try {
        const emailService = await import("./services/emailService.js");

        const emailData = {
          to: booking.userEmail,
          userName: booking.userName,
          eventTitle: booking.eventTitle,
          bookingId: booking.bookingId,
          totalAmount: collectedAmount,
          collectedAt: new Date().toLocaleString(),
          verificationCode: bookingCode
        };

        await emailService.sendPaymentConfirmationEmail(emailData);
        console.log(`Payment confirmation email sent to ${booking.userEmail}`);
      } catch (emailError) {
        console.error("Failed to send payment confirmation email:", emailError);
        // Don't fail the verification if email fails
      }

      console.log(`Successfully verified booking code ${bookingCode} for amount $${collectedAmount}`);

      res.json({
        success: true,
        message: "Booking verified and payment collected successfully",
        booking: {
          bookingId: booking.bookingId,
          eventTitle: booking.eventTitle,
          attendeeName: booking.userName,
          collectedAmount: parseFloat(collectedAmount),
          verifiedAt: new Date(),
        }
      });
    } catch (error: any) {
      console.error("Error verifying booking code:", error);
      res.status(500).json({
        success: false,
        error: "Failed to verify booking code",
        message: error.message,
      });
    }
  });

  // ==================== STRIPE CONNECT ROUTES ====================

  // Register payout routes
  app.use('/api/organizer/payouts', organizerPayoutRoutes);
  app.use('/api/admin/payouts', adminPayoutRoutes);

  // Create Stripe Connect account for organizer
  app.post("/api/stripe/create-connect-account", authenticateToken, async (req, res) => {

    // console.log('Calling this one api-----------------');
    // return false;
    const { userId, email, firstName, lastName, businessName } = req.body;

    // Create Stripe Connect account
    const account = await stripeConnectService.createConnectedAccount({
      organizerId: userId,
      email,
      firstName,
      lastName,
      businessName
    });

    // Save account ID to user record
    await mongoStorage.connect();
    const { ObjectId } = await import("mongodb");
    const usersCollection = mongoStorage.db.collection("users");
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          stripeConnectedAccountId: account.id,
          stripeAccountStatus: 'created',
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      accountId: account.id,
      message: "Connected account created successfully"
    });

  });

  // Create onboarding link for organizer
  app.post("/api/stripe/create-onboarding-link", authenticateToken, async (req, res) => {
    try {
      const { accountId } = req.body;
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const accountLink = await stripeConnectService.createOnboardingLink(
        accountId,
        `${baseUrl}/organizer/stripe/return`,
        `${baseUrl}/organizer/stripe/refresh`
      );

      res.json({
        success: true,
        url: accountLink.url
      });
    } catch (error) {
      console.error("Error creating onboarding link:", error);
      res.status(500).json({
        error: "Failed to create onboarding link",
        message: error.message
      });
    }
  });

  // Get Stripe account status
  app.get("/api/stripe/account-status/:accountId", authenticateToken, async (req, res) => {
    try {
      const { accountId } = req.params;

      const status = await stripeConnectService.getAccountStatus(accountId);

      res.json({
        success: true,
        status
      });
    } catch (error) {
      console.error("Error getting account status:", error);
      res.status(500).json({
        error: "Failed to get account status",
        message: error.message
      });
    }
  });

  // Get account balance and payout history
  app.get("/api/stripe/account-finances/:accountId", authenticateToken, async (req, res) => {
    try {
      const { accountId } = req.params;

      const [balance, transfers, payouts] = await Promise.all([
        stripeConnectService.getAccountBalance(accountId),
        stripeConnectService.listTransfers(accountId),
        stripeConnectService.listPayouts(accountId)
      ]);

      res.json({
        success: true,
        balance,
        transfers,
        payouts
      });
    } catch (error) {
      console.error("Error getting account finances:", error);
      res.status(500).json({
        error: "Failed to get account finances",
        message: error.message
      });
    }
  });

  // Admin: Approve withdrawal and create payout
  app.post("/api/admin/approve-withdrawal", authenticateToken, requireRole(["admin"]), async (req, res) => {
    try {
      const { requestId, adminRemarks } = req.body;

      await mongoStorage.connect();
      const { ObjectId } = await import("mongodb");
      const withdrawalRequestsCollection = mongoStorage.db.collection("withdrawal_requests");
      const usersCollection = mongoStorage.db.collection("users");

      // Get withdrawal request
      const request = await withdrawalRequestsCollection.findOne({ _id: new ObjectId(requestId) });
      if (!request) {
        return res.status(404).json({ error: "Withdrawal request not found" });
      }

      // Get organizer's Stripe account
      const organizer = await usersCollection.findOne({ _id: request.organizerId });
      if (!organizer?.stripeConnectedAccountId) {
        return res.status(400).json({ error: "Organizer doesn't have connected Stripe account" });
      }

      // Create Stripe payout
      const payout = await stripeConnectService.createPayout(
        organizer.stripeConnectedAccountId,
        request.requestedAmount,
        requestId
      );

      // Update withdrawal request
      await withdrawalRequestsCollection.updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            status: 'approved',
            stripePayout: {
              id: payout.id,
              amount: payout.amount / 100,
              status: payout.status
            },
            adminRemarks,
            processedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      // Update organization earnings
      const earningsCollection = mongoStorage.db.collection("organization_earnings");
      await earningsCollection.updateOne(
        { organizationId: request.organizationId },
        {
          $inc: {
            pendingEarnings: -request.requestedAmount,
            requestedEarnings: -request.requestedAmount,
            paidEarnings: request.requestedAmount
          },
          $set: { updatedAt: new Date() }
        }
      );

      res.json({
        success: true,
        payout,
        message: "Withdrawal approved and payout created"
      });
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      res.status(500).json({
        error: "Failed to approve withdrawal",
        message: error.message
      });
    }
  });

  // GET /api/admin/organizations/:userId/earnings
  app.get(
    "/api/admin/organizations/:userId/earnings",
    authenticateToken,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        const { userId } = req.params;

        // Connect to MongoDB
        await mongoStorage.connect();
        const { ObjectId } = await import("mongodb");

        // Fetch user's events with multiple query variations
        const eventsCollection = mongoStorage.db.collection("events");

        // Try different organizerId formats
        let userEvents = await eventsCollection
          .find({
            organizerId: userId,
          })
          .toArray();

        // If no events found with string ID, try ObjectId
        if (userEvents.length === 0 && ObjectId.isValid(userId)) {
          userEvents = await eventsCollection
            .find({
              organizerId: new ObjectId(userId),
            })
            .toArray();
        }

        // Also try with the id field
        if (userEvents.length === 0) {
          userEvents = await eventsCollection
            .find({
              id: userId,
            })
            .toArray();
        }

        console.log(`Found ${userEvents.length} events for user ${userId}`);

        // Fetch bookings for these events with multiple collection names
        let bookings = [];
        const bookingsCollection = mongoStorage.db.collection("bookings");
        const attendeesCollection = mongoStorage.db.collection("attendees");

        if (userEvents.length > 0) {
          const eventIds = userEvents.map((event) => event._id.toString());
          const eventObjectIds = userEvents.map((event) => event._id);

          // Try bookings collection first
          bookings = await bookingsCollection
            .find({
              $or: [
                { eventId: { $in: eventIds } },
                { eventId: { $in: eventObjectIds } },
              ],
            })
            .toArray();

          console.log(
            `Found ${bookings.length} bookings in bookings collection`,
          );

          // If no bookings found, try attendees collection
          if (bookings.length === 0) {
            const attendees = await attendeesCollection
              .find({
                $or: [
                  { eventId: { $in: eventIds } },
                  { eventId: { $in: eventObjectIds } },
                ],
              })
              .toArray();

            // Convert attendees to booking format
            bookings = attendees.map((attendee) => ({
              eventId: attendee.eventId,
              totalAmount: attendee.totalAmount || attendee.ticketPrice || 0,
              ticketDetails: attendee.quantity
                ? [{ quantity: attendee.quantity }]
                : null,
              status: attendee.status || "confirmed",
            }));

            console.log(
              `Found ${attendees.length} attendees, converted to bookings`,
            );
          }

          // Also check for sample bookings data
          if (bookings.length === 0) {
            const sampleBookings = await mongoStorage.db
              .collection("sample_bookings")
              .find({
                $or: [
                  { eventId: { $in: eventIds } },
                  { eventId: { $in: eventObjectIds } },
                ],
              })
              .toArray();

            if (sampleBookings.length > 0) {
              bookings = sampleBookings;
              console.log(`Found ${sampleBookings.length} sample bookings`);
            }
          }
        }

        // Calculate earnings per event
        const eventEarnings = userEvents.map((event) => {
          const eventBookings = bookings.filter((booking) => {
            const bookingEventId = booking.eventId?.toString();
            const eventId = event._id.toString();
            return bookingEventId === eventId;
          });

          const revenue = eventBookings.reduce((total, booking) => {
            return total + (booking.totalAmount || 0);
          }, 0);

          let ticketsSold = 0;
          eventBookings.forEach((booking) => {
            if (booking.ticketDetails && Array.isArray(booking.ticketDetails)) {
              ticketsSold += booking.ticketDetails.reduce(
                (sum, ticket) => sum + (ticket.quantity || 0),
                0,
              );
            } else if (booking.quantity) {
              ticketsSold += booking.quantity;
            } else {
              ticketsSold += 1; // Default to 1 ticket if no details
            }
          });

          console.log(
            `Event ${event.title}: ${eventBookings.length} bookings, $${revenue} revenue, ${ticketsSold} tickets sold`,
          );

          return {
            _id: event._id,
            title: event.title,
            revenue: revenue,
            ticketsSold: ticketsSold,
            createdAt: event.createdAt,
          };
        });

        // Calculate totals
        const totalRevenue = eventEarnings.reduce(
          (total, event) => total + event.revenue,
          0,
        );
        const totalTicketsSold = eventEarnings.reduce(
          (total, event) => total + event.ticketsSold,
          0,
        );
        const totalEvents = userEvents.length;

        const earningsData = {
          totalRevenue,
          totalTicketsSold,
          totalEvents,
          events: eventEarnings,
        };

        console.log("Final earnings data:", earningsData);
        res.json(earningsData);
      } catch (error) {
        console.error("Error getting server info:", error);
        res.status(500).json({ message: "Error getting server info" });
      }
    },
  );

  // GET /api/admin/users/:id
  app.get(
    "/api/admin/users/:id",
    authenticateToken,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        const { id } = req.params;

        await mongoStorage.connect();
        const { ObjectId } = await import("mongodb");

        const usersCollection = mongoStorage.db.collection("users");

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
            ...userWithoutPassword,
          });
        } else {
          res.status(404).json({ message: "User not found" });
        }
      } catch (error) {
        console.error("User fetch error:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    },
  );

  // POST /api/admin/create-sample-bookings - for testing earnings
  app.post(
    "/api/admin/create-sample-bookings",
    authenticateToken,
    requireRole(["admin"]),
    async (req, res) => {
      try {
        await mongoStorage.connect();
        const { ObjectId } = await import("mongodb");

        const eventsCollection = mongoStorage.db.collection("events");
        const bookingsCollection = mongoStorage.db.collection("bookings");

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
              ticketDetails: [
                {
                  type: "General",
                  price: ticketPrice,
                  quantity: quantity,
                },
              ],
              status: "confirmed",
              createdAt: new Date(),
              attendeeInfo: {
                firstName: `User${i + 1}`,
                lastName: "Test",
                email: `user${i + 1}@example.com`,
              },
            });
          }
        }

        if (sampleBookings.length > 0) {
          await bookingsCollection.insertMany(sampleBookings);
          console.log(`Created ${sampleBookings.length} sample bookings`);
        }

        res.json({
          message: `Created ${sampleBookings.length} sample bookings`,
          bookings: sampleBookings.length,
        });
      } catch (error) {
        console.error("Error creating sample bookings:", error);
        res.status(500).json({ message: "Failed to create sample bookings" });
      }
    },
  );

  // POST /api/create-dummy-bookings-for-org - Create dummy bookings for specific organization
  app.post("/api/create-dummy-bookings-for-org", async (req, res) => {
    try {
      const { organizerEmail } = req.body;

      if (!organizerEmail) {
        return res.status(400).json({ message: "Organizer email is required" });
      }

      await mongoStorage.connect();
      const { ObjectId } = await import("mongodb");

      const eventsCollection = mongoStorage.db.collection("events");
      const bookingsCollection = mongoStorage.db.collection("bookings");
      const usersCollection = mongoStorage.db.collection("users");

      // Find the organizer
      const organizer = await usersCollection.findOne({
        email: organizerEmail,
      });

      if (!organizer) {
        return res.status(404).json({ message: "Organizer not found" });
      }

      const organizerId = organizer._id?.toString() || organizer.id;

      // Get events for this organizer
      let organizerEvents = await eventsCollection
        .find({
          organizerId: organizerId,
        })
        .toArray();

      // If no events found with string ID, try ObjectId
      if (organizerEvents.length === 0 && ObjectId.isValid(organizerId)) {
        organizerEvents = await eventsCollection
          .find({
            organizerId: new ObjectId(organizerId),
          })
          .toArray();
      }

      if (organizerEvents.length === 0) {
        return res
          .status(404)
          .json({ message: "No events found for this organizer" });
      }

      console.log(
        `Found ${organizerEvents.length} events for organizer ${organizerEmail}`,
      );

      // Create dummy bookings for each event
      const dummyBookings = [];
      const customerNames = [
        "John Smith",
        "Sarah Johnson",
        "Michael Davis",
        "Emily Wilson",
        "David Brown",
        "Jessica Miller",
        "Chris Anderson",
        "Amanda Taylor",
        "Ryan Martinez",
        "Ashley Thomas",
        "Kevin White",
        "Nicole Garcia",
      ];

      for (const event of organizerEvents) {
        // Create 3-8 random bookings per event
        const bookingCount = Math.floor(Math.random() * 6) + 3;

        for (let i = 0; i < bookingCount; i++) {
          const customerName =
            customerNames[Math.floor(Math.random() * customerNames.length)];
          const nameParts = customerName.split(" ");
          const ticketTypes = [
            "General Admission",
            "VIP",
            "Early Bird",
            "Standard",
          ];
          const ticketType =
            ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
          const ticketPrice = Math.floor(Math.random() * 300) + 25; // $25-$325
          const quantity = Math.floor(Math.random() * 4) + 1; // 1-4 tickets
          const totalAmount = ticketPrice * quantity;

          const booking = {
            _id: new ObjectId(),
            bookingId: `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            paymentIntentId: `pi_${Math.random().toString(36).substr(2, 24)}`,
            eventId: event._id.toString(),
            eventTitle: event.title,
            ticketDetails: [
              {
                type: ticketType,
                price: ticketPrice,
                quantity: quantity,
                name: ticketType,
              },
            ],
            userEmail: `${nameParts[0].toLowerCase()}.${nameParts[1].toLowerCase()}@example.com`,
            userName: customerName,
            totalAmount: totalAmount,
            currency: "usd",
            status: "confirmed",
            paymentStatus: "completed",
            bookingDate: new Date(
              Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
            ), // Random date within last 30 days
            createdAt: new Date(
              Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
            ),
            attendeeInfo: {
              firstName: nameParts[0],
              lastName: nameParts[1],
              email: `${nameParts[0].toLowerCase()}.${nameParts[1].toLowerCase()}@example.com`,
              phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            },
          };

          dummyBookings.push(booking);
        }
      }

      if (dummyBookings.length > 0) {
        await bookingsCollection.insertMany(dummyBookings);
        console.log(
          `Created ${dummyBookings.length} dummy bookings for ${organizerEmail}`,
        );
      }

      // Calculate total earnings
      const totalEarnings = dummyBookings.reduce(
        (sum, booking) => sum + booking.totalAmount,
        0,
      );
      const totalBookings = dummyBookings.length;

      res.json({
        message: `Successfully created ${totalBookings} dummy bookings for ${organizerEmail}`,
        bookings: totalBookings,
        totalEarnings: totalEarnings,
        events: organizerEvents.length,
        details: dummyBookings.map((b) => ({
          bookingId: b.bookingId,
          eventTitle: b.eventTitle,
          customerName: b.userName,
          amount: b.totalAmount,
          tickets: b.ticketDetails[0].quantity,
        })),
      });
    } catch (error) {
      console.error("Error creating dummy bookings:", error);
      res
        .status(500)
        .json({
          message: "Failed to create dummy bookings",
          error: error.message,
        });
    }
  });

  // DISABLED - Use enhanced routes instead
  // app.get('/api/organizer/bookings', authenticateToken, requireRole(['organizer']), async (req, res) => {
  // DISABLED - Conflicts with enhanced routes system
  // });

  // REMOVED DUPLICATE - Using organizerRoutes.js implementation instead
  // This was causing route conflicts and authentication issues

  // The /api/organizer/earnings endpoint is handled by organizerRoutes.js with proper authentication

  // DISABLED - Use organizerRoutes.js instead
  // GET /api/organizer/events - Get organizer's events
  // app.get(
  //   "/api/organizer/events",
  //   authenticateToken,
  //   requireRole(["organizer"]),
  //   async (req, res) => {
  //     try {
  //       const organizerId = req.user._id || req.user.id;

  //       await mongoStorage.connect();

  //       const eventsCollection = mongoStorage.db.collection("events");
  //       const events = await eventsCollection
  //         .find({ organizerId: organizerId })
  //         .toArray();

  //       res.json(events);
  //     } catch (error) {
  //       console.error("Get organizer events error:", error);
  //       res.status(500).json({ message: "Failed to fetch events" });
  //     }
  //   },
  // );

  // DISABLED - Use organizerRoutes.js instead
  // POST /api/organizer/events - Create a new event
  // app.post(
  //   "/api/organizer/events",
  //   authenticateToken,
  //   requireRole(["organizer"]),
  //   async (req, res) => {
  //     try {
  //       const organizerId = req.user._id || req.user.id;
  //       const eventData = { ...req.body, organizerId: organizerId };

  //       await mongoStorage.connect();

  //       const eventsCollection = mongoStorage.db.collection("events");
  //       const result = await eventsCollection.insertOne(eventData);

  //       res
  //         .status(201)
  //         .json({ message: "Event created", eventId: result.insertedId });
  //     } catch (error) {
  //       console.error("Create event error:", error);
  //       res.status(500).json({ message: "Failed to create event" });
  //     }
  //   },
  // );

  // Public events routes (no authentication required)
  app.get("/api/events", async (req, res) => {
    try {
      const { mongoStorage } = await import("./mongodb-storage.js");
      await mongoStorage.connect();

      const eventsCollection = mongoStorage.db.collection("events");

      // Return all events for public view (including draft for development)
      let events = await eventsCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      // If no events exist, create some sample ones for demo
      if (events.length === 0) {
        const sampleEvents = [
          {
            title: "Summer Music Festival 2025",
            description:
              "Join us for an amazing summer music festival featuring top artists",
            location: "Central Park, New York",
            startDate: "2025-07-15T18:00:00.000Z",
            endDate: "2025-07-15T23:00:00.000Z",
            category: "MUSIC",
            status: "published",
            image:
              "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
            ticketTypes: [
              {
                name: "General Admission",
                price: 75,
                quantity: 500,
                sold: 0,
              },
            ],
            createdAt: new Date(),
            organizerId: "sample_organizer",
          },
          {
            title: "Tech Conference 2025",
            description: "Learn about the latest in technology and innovation",
            location: "Convention Center, San Francisco",
            startDate: "2025-08-20T09:00:00.000Z",
            endDate: "2025-08-20T17:00:00.000Z",
            category: "TECHNOLOGY",
            status: "published",
            image:
              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop",
            ticketTypes: [
              {
                name: "Standard Pass",
                price: 150,
                quantity: 300,
                sold: 0,
              },
            ],
            createdAt: new Date(),
            organizerId: "sample_organizer",
          },
          {
            title: "Food & Wine Festival",
            description:
              "Taste the finest cuisine and wines from around the world",
            location: "Harbor District, Miami",
            startDate: "2025-09-10T16:00:00.000Z",
            endDate: "2025-09-10T22:00:00.000Z",
            category: "FOOD & DRINK",
            status: "published",
            image:
              "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
            ticketTypes: [
              {
                name: "Tasting Pass",
                price: 95,
                quantity: 200,
                sold: 0,
              },
            ],
            createdAt: new Date(),
            organizerId: "sample_organizer",
          },
        ];

        const insertResult = await eventsCollection.insertMany(sampleEvents);
        events = await eventsCollection.find({}).sort({ createdAt: -1 }).toArray();
      }

      res.json(events);
    } catch (error) {
      console.error("Error fetching public events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Public trending events
  app.get("/api/events/trending", async (req, res) => {
    try {
      const { mongoStorage } = await import("./mongodb-storage.js");
      await mongoStorage.connect();

      const eventsCollection = mongoStorage.db.collection("events");

      // Return trending events (for demo, just return recent events)
      const events = await eventsCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(8)
        .toArray();

      res.json(events);
    } catch (error) {
      console.error("Error fetching trending events:", error);
      res.status(500).json({ message: "Failed to fetch trending events" });
    }
  });

  // Public past events
  app.get("/api/events/past", async (req, res) => {
    try {
      const { mongoStorage } = await import("./mongodb-storage.js");
      await mongoStorage.connect();

      const eventsCollection = mongoStorage.db.collection("events");

      // Return past events (for demo, return older events)
      const currentDate = new Date();
      const events = await eventsCollection
        .find({
          endDate: { $lt: currentDate.toISOString() },
        })
        .sort({ endDate: -1 })
        .limit(6)
        .toArray();

      res.json(events);
    } catch (error) {
      console.error("Error fetching past events:", error);
      res.status(500).json({ message: "Failed to fetch past events" });
    }
  });

  // Public events by category
  app.get("/api/events/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { mongoStorage } = await import("./mongodb-storage.js");
      await mongoStorage.connect();

      const eventsCollection = mongoStorage.db.collection("events");

      // Return events by category
      const events = await eventsCollection
        .find({
          category: { $regex: new RegExp(category, "i") },
        })
        .sort({ createdAt: -1 })
        .limit(12)
        .toArray();

      res.json(events);
    } catch (error) {
      console.error("Error fetching events by category:", error);
      res.status(500).json({ message: "Failed to fetch events by category" });
    }
  });

  // Cart routes
  app.post("/api/cart/add", async (req, res) => {
    try {
      const { userEmail, eventId, eventTitle, ticketType, quantity } = req.body;

      console.log("Cart add request:", {
        userEmail,
        eventId,
        eventTitle,
        ticketType,
        quantity,
      });

      if (!userEmail || !eventId || !eventTitle || !ticketType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { mongoStorage } = await import("./mongodb-storage.js");
      await mongoStorage.connect();

      // Check if item already exists in cart
      const existingItem = await mongoStorage.cart.findOne({
        userEmail,
        eventId,
        "ticketType.name": ticketType.name,
      });

      if (existingItem) {
        // Update quantity if item exists
        await mongoStorage.cart.updateOne(
          { _id: existingItem._id },
          { $inc: { quantity: parseInt(quantity) || 1 } },
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
            price: parseFloat(
              ticketType.coverTicket && ticketType.creditPrice !== null && ticketType.creditPrice !== undefined
                ? ticketType.creditPrice
                : ticketType.price
            ) || 25.0,
            description: ticketType.description || "Standard event ticket",
            // Store Cover Ticket information for proper display
            coverTicket: ticketType.coverTicket || false,
            creditPrice: ticketType.creditPrice || null,
            originalPrice: parseFloat(ticketType.price) || 25.0,
          },
          quantity: parseInt(quantity) || 1,
          addedAt: new Date(),
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

  app.delete("/api/cart/remove", async (req, res) => {
    try {
      const { userEmail, itemId } = req.body;

      console.log("Cart remove request:", { userEmail, itemId });

      if (!userEmail || !itemId) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: userEmail and itemId",
        });
      }

      const { mongoStorage } = await import("./mongodb-storage.js");
      await mongoStorage.connect();

      const { ObjectId } = await import("mongodb");

      // Remove item from cart
      let result;
      if (ObjectId.isValid(itemId)) {
        result = await mongoStorage.cart.deleteOne({
          _id: new ObjectId(itemId),
          userEmail: userEmail,
        });
      } else {
        result = await mongoStorage.cart.deleteOne({
          _id: itemId,
          userEmail: userEmail,
        });
      }

      console.log(`[Cart] Remove result for ${itemId}:`, result);

      if (result.deletedCount > 0) {
        res.json({
          success: true,
          message: "Item removed from cart",
          deletedCount: result.deletedCount,
        });
      } else {
        res.status(404).json({
          success: false,
          error: "Item not found in cart",
        });
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({
        success: false,
        error: "Failed to remove item from cart",
        message: error.message,
      });
    }
  });

  app.put("/api/cart/update", async (req, res) => {
    try {
      const { userEmail, itemId, quantity } = req.body;

      console.log("Cart update request:", { userEmail, itemId, quantity });

      if (!userEmail || !itemId || quantity === undefined) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields",
        });
      }

      const { mongoStorage } = await import("./mongodb-storage.js");
      await mongoStorage.connect();

      const { ObjectId } = await import("mongodb");

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        let result;
        if (ObjectId.isValid(itemId)) {
          result = await mongoStorage.cart.deleteOne({
            _id: new ObjectId(itemId),
            userEmail: userEmail,
          });
        } else {
          result = await mongoStorage.cart.deleteOne({
            _id: itemId,
            userEmail: userEmail,
          });
        }

        if (result.deletedCount > 0) {
          res.json({ success: true, message: "Item removed from cart" });
        } else {
          res.status(404).json({ success: false, error: "Item not found" });
        }
      } else {
        // Update quantity
        let result;
        if (ObjectId.isValid(itemId)) {
          result = await mongoStorage.cart.updateOne(
            { _id: new ObjectId(itemId), userEmail: userEmail },
            { $set: { quantity: parseInt(quantity), updatedAt: new Date() } },
          );
        } else {
          result = await mongoStorage.cart.updateOne(
            { _id: itemId, userEmail: userEmail },
            { $set: { quantity: parseInt(quantity), updatedAt: new Date() } },
          );
        }

        if (result.matchedCount > 0) {
          res.json({ success: true, message: "Cart item updated" });
        } else {
          res.status(404).json({ success: false, error: "Item not found" });
        }
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update cart item",
        message: error.message,
      });
    }
  });

  app.delete("/api/cart/clear/:userEmail", async (req, res) => {
    try {
      const { userEmail } = req.params;

      console.log("Cart clear request for:", userEmail);

      if (!userEmail) {
        return res.status(400).json({
          success: false,
          error: "User email is required",
        });
      }

      const { mongoStorage } = await import("./mongodb-storage.js");
      await mongoStorage.connect();

      const result = await mongoStorage.cart.deleteMany({ userEmail });

      console.log(
        `[Cart] Cleared ${result.deletedCount} items for user ${userEmail}`,
      );

      res.json({
        success: true,
        message: "Cart cleared successfully",
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear cart",
        message: error.message,
      });
    }
  });

  app.get("/api/cart/count/:userEmail", async (req, res) => {
    try {
      const { userEmail } = req.params;
      const { mongoStorage } = await import("./mongodb-storage.js");
      await mongoStorage.connect();

      const result = await mongoStorage.cart
        .aggregate([
          { $match: { userEmail } },
          { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } },
        ])
        .toArray();

      const count = result.length > 0 ? result[0].totalQuantity : 0;
      res.json({ count });
    } catch (error) {
      console.error("Error getting cart count:", error);
      res.status(500).json({ error: "Failed to get cart count", count: 0 });
    }
  });
  app.get("/api/cart/:userEmail", async (req, res) => {
    try {
      const { userEmail } = req.params;
      const { mongoStorage } = await import("./mongodb-storage.js");
      await mongoStorage.connect();

      const cartItems = await mongoStorage.cart.find({ userEmail }).toArray();

      const result = await mongoStorage.cart
        .aggregate([
          { $match: { userEmail } },
          { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } },
        ])
        .toArray();

      const count = result.length > 0 ? result[0].totalQuantity : 0;

      console.log(
        `[Cart] Retrieved ${cartItems?.length || 0} items for user ${userEmail}`,
      );

      res.json({
        items: cartItems || [],
        count: count || 0,
        success: true,
      });
    } catch (error) {
      console.error("Error fetching cart:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch cart", items: [], count: 0 });
    }
  });

  // ==================== PAYOUT SYSTEM ROUTES ====================

  // Get organization earnings summary
  app.get("/api/organization/earnings", authenticateToken, requireRole(['organizer']), async (req, res) => {
    try {
      console.log('[Earnings] Route accessed, user:', req.user);
      const userId = (req as any).user.id || (req as any).user._id;
      console.log('[Earnings] User ID:', userId);

      // Get organization by user ID or use user ID directly as organizer ID
      const organizationsCollection = mongoStorage.db.collection("organizations");
      let organization = await organizationsCollection.findOne({ ownerId: new (await import("mongodb")).ObjectId(userId) });

      // If no organization found, treat the user as the organizer directly
      if (!organization) {
        console.log(`[Earnings] No organization found for user ${userId}, using user ID as organizer ID`);
        const earnings = await payoutService.getOrganizationEarnings(userId);
        return res.json({ success: true, earnings });
      }

      const earnings = await payoutService.getOrganizationEarnings(organization._id);
      res.json({ success: true, earnings });
    } catch (error: any) {
      console.error("Error getting organization earnings:", error);
      res.status(500).json({ error: "Failed to get earnings", message: error.message });
    }
  });

  // Create withdrawal request
  app.post("/api/organization/withdrawal-request", authenticateToken, requireRole(['organizer']), async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { requestedAmount, requestReason, bankDetails } = req.body;

      // Get organization by user ID
      const organizationsCollection = mongoStorage.db.collection("organizations");
      const organization = await organizationsCollection.findOne({ ownerId: new (await import("mongodb")).ObjectId(userId) });

      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const result = await payoutService.createWithdrawalRequest({
        organizationId: organization._id,
        organizerId: userId,
        requestedAmount,
        requestReason,
        bankDetails
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ error: "Failed to create withdrawal request", message: error.message });
    }
  });

  // Get organization withdrawal requests
  app.get("/api/organization/withdrawal-requests", authenticateToken, requireRole(['organizer']), async (req, res) => {
    try {
      const userId = (req as any).user.id || (req as any).user._id;
      const { status } = req.query;

      // Get organization by user ID or use user ID directly as organizer ID
      const organizationsCollection = mongoStorage.db.collection("organizations");
      let organization = await organizationsCollection.findOne({ ownerId: new (await import("mongodb")).ObjectId(userId) });

      let organizationId = organization ? organization._id : userId;

      const requests = await payoutService.getOrganizationWithdrawals(organizationId, status as string);
      res.json({ success: true, requests });
    } catch (error: any) {
      console.error("Error getting withdrawal requests:", error);
      res.status(500).json({ error: "Failed to get withdrawal requests", message: error.message });
    }
  });

  // ==================== ADMIN PAYOUT ROUTES ====================

  // Get admin payout dashboard stats
  app.get("/api/admin/payout/stats", authenticateToken, requireRole(["super_admin", "admin"]), async (req, res) => {
    try {
      const stats = await payoutService.getAdminPayoutStats();
      res.json({ success: true, stats });
    } catch (error: any) {
      console.error("Error getting admin payout stats:", error);
      res.status(500).json({ error: "Failed to get payout stats", message: error.message });
    }
  });

  // Get all withdrawal requests for admin
  app.get("/api/admin/payout/withdrawal-requests", authenticateToken, requireRole(["super_admin", "admin"]), async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const result = await payoutService.getAllWithdrawalRequests(
        status as string,
        parseInt(page as string),
        parseInt(limit as string)
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Error getting admin withdrawal requests:", error);
      res.status(500).json({ error: "Failed to get withdrawal requests", message: error.message });
    }
  });

  // Approve or reject withdrawal request
  app.patch("/api/admin/payout/withdrawal-requests/:requestId", authenticateToken, requireRole(["super_admin", "admin"]), async (req, res) => {
    try {
      const { requestId } = req.params;
      const { action, remarks } = req.body;
      const adminId = (req as any).user.id;

      if (!["approve", "reject"].includes(action)) {
        return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'" });
      }

      const result = await payoutService.reviewWithdrawalRequest(requestId, action, adminId, remarks);
      res.json(result);
    } catch (error: any) {
      console.error("Error reviewing withdrawal request:", error);
      res.status(500).json({ error: "Failed to review withdrawal request", message: error.message });
    }
  });

  const httpServer = createServer(app);

  // Add WebSocket server for real-time messaging
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
    verifyClient: (info) => {
      // Basic WebSocket connection verification
      return true;
    }
  });

  // Store WebSocket connections
  const connections = new Map();

  wss.on('connection', (ws, req) => {
    console.log('WebSocket connected');

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'subscribe') {
          // Store connection with user info for targeting messages
          connections.set(ws, {
            userEmail: message.userEmail,
            userType: message.userType, // 'admin' or 'organizer'
            channels: message.channels || []
          });
          console.log(`WebSocket subscribed: ${message.userType} - ${message.userEmail}`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      connections.delete(ws);
      console.log('WebSocket disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connections.delete(ws);
    });
  });

  // Global function to broadcast messages
  global.broadcastMessage = (data) => {
    const message = JSON.stringify(data);
    connections.forEach((connectionInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Send to relevant users based on message type
        if (data.type === 'new-message') {
          if (data.senderType === 'admin' && connectionInfo.userType === 'organizer' && connectionInfo.userEmail === data.organizerEmail) {
            ws.send(message);
          } else if (data.senderType === 'organizer' && connectionInfo.userType === 'admin') {
            ws.send(message);
          }
        }
      }
    });
  };

  return httpServer;
}
