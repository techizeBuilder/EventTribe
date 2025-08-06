import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { mongoStorage } from "./mongodb-storage.js";
import { AuthService, authenticateToken } from "./auth.js";
import {
  requireRole,
  requireVerification,
} from "./middleware/authMiddleware.js";
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
      enhanced: true,
    });
  });
  app.get(
    "/api/organizer/dashboard",
    authenticateToken,
    requireRole(["organizer"]),
    requireVerification("both"),
    async (req, res) => {
      try {
        // Organizer dashboard logic here
        res.json({
          message: "Welcome to organizer dashboard",
          user: req.user,
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to load organizer dashboard" });
      }
    },
  );
  // TEMPORARY: Organizer bookings without authentication for testing
  app.get("/api/test/organizer-bookings-simple", async (req, res) => {
    try {
      await mongoStorage.connect();
      const bookings = await mongoStorage.db
        .collection("bookings")
        .find({})
        .toArray();

      // Group by event
      const groupedBookings = bookings.reduce((acc, booking) => {
        const eventTitle = booking.eventTitle || "Unknown Event";
        if (!acc[eventTitle]) acc[eventTitle] = [];
        acc[eventTitle].push(booking);
        return acc;
      }, {});

      // Return bookings in the format expected by the frontend
      const formattedBookings = bookings.map((b) => ({
        _id: b._id,
        bookingId: b.bookingId,
        eventTitle: b.eventTitle,
        attendeeName: b.attendeeName,
        attendeeEmail: b.attendeeEmail,
        status: b.status,
        paymentStatus: b.paymentStatus || "paid",
        totalAmount: b.totalAmount,
        amount: b.totalAmount, // Fallback for older code
        bookingDate: b.bookingDate,
        createdAt: b.createdAt,
      }));

      res.json(formattedBookings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/test/organization-earnings-simple - No auth organization earnings endpoint
  app.get("/api/test/organization-earnings-simple", async (req, res) => {
    try {
      await mongoStorage.connect();

      // Fetch all bookings from the database
      const bookings = await mongoStorage.db
        .collection("bookings")
        .find({})
        .toArray();
      console.log(
        `Found ${bookings.length} total bookings for earnings calculation`,
      );

      // Group bookings by event title
      const eventGroups = bookings.reduce((acc, booking) => {
        const eventTitle = booking.eventTitle || "Unknown Event";
        if (!acc[eventTitle]) {
          acc[eventTitle] = [];
        }
        acc[eventTitle].push(booking);
        return acc;
      }, {});

      // Calculate earnings per event
      const eventEarnings = Object.entries(eventGroups).map(
        ([eventTitle, eventBookings]) => {
          const revenue = eventBookings.reduce((total, booking) => {
            return total + (booking.totalAmount || booking.amount || 0);
          }, 0);

          const ticketsSold = eventBookings.length; // Each booking is at least 1 ticket

          return {
            title: eventTitle,
            revenue: revenue,
            ticketsSold: ticketsSold,
            bookingsCount: eventBookings.length,
            createdAt: eventBookings[0]?.createdAt || new Date(),
          };
        },
      );

      // Calculate totals
      const totalRevenue = eventEarnings.reduce(
        (total, event) => total + event.revenue,
        0,
      );
      const totalTicketsSold = eventEarnings.reduce(
        (total, event) => total + event.ticketsSold,
        0,
      );
      const totalEvents = eventEarnings.length;

      const earningsData = {
        totalRevenue,
        totalTicketsSold,
        totalEvents,
        events: eventEarnings.sort((a, b) => b.revenue - a.revenue), // Sort by revenue descending
      };

      console.log("Organization earnings calculated:", {
        totalRevenue: earningsData.totalRevenue,
        totalTicketsSold: earningsData.totalTicketsSold,
        totalEvents: earningsData.totalEvents,
        eventTitles: earningsData.events.map((e) => e.title),
      });

      res.json(earningsData);
    } catch (error) {
      console.error("Organization earnings calculation error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  // Enhanced organizer bookings endpoint with better filtering
  app.get(
    "/api/enhanced/organizer/bookings",
    authenticateToken,
    requireRole(["organizer"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const organizerId = req.user?._id || req.user?.id;

        await mongoStorage.connect();
        const bookingsCollection = mongoStorage.db.collection("bookings");

        // Enhanced filtering: only return valid and complete booking data
        const bookings = await bookingsCollection
          .find({
            organizerId: organizerId,
            // Filter for complete bookings
            $and: [
              { eventId: { $exists: true, $ne: null } },
              { userId: { $exists: true, $ne: null } },
              { status: { $exists: true, $ne: null } },
              { createdAt: { $exists: true } },
            ],
          })
          .toArray();

        // Enhanced data integrity: populate event details
        const eventsCollection = mongoStorage.db.collection("events");
        const usersCollection = mongoStorage.db.collection("users");

        const enhancedBookings = await Promise.all(
          bookings.map(async (booking: any) => {
            try {
              const event = await eventsCollection.findOne({
                _id: booking.eventId,
              });
              const user = await usersCollection.findOne({
                _id: booking.userId,
              });

              return {
                ...booking,
                eventDetails: event
                  ? {
                      title: event.title,
                      date: event.date,
                      price: event.price,
                    }
                  : null,
                userDetails: user
                  ? {
                      name: user.name,
                      email: user.email,
                    }
                  : null,
              };
            } catch (err) {
              console.warn("Error enhancing booking data:", err);
              return booking; // Return original booking if enhancement fails
            }
          }),
        );

        res.json(enhancedBookings);
      } catch (error) {
        console.error("Enhanced bookings error:", error);
        res.status(500).json({ message: "Failed to fetch enhanced bookings" });
      }
    },
  );
  // Get user bookings for attendee dashboard
  app.get("/api/attendee/bookings", async (req, res) => {
    try {
      const { userEmail } = req.query;

      console.log("Fetching bookings for email:", userEmail);

      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      const bookings = await mongoStorage.withRetry(async () => {
        return await mongoStorage.db
          .collection("bookings")
          .find({ userEmail })
          .sort({ bookingDate: -1 })
          .toArray();
      });

      console.log("Found bookings:", bookings.length);
      console.log("Bookings data:", bookings);

      res.json({ bookings });
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      // Return empty array instead of error for better UX
      res.json({ bookings: [] });
    }
  });
  const httpServer = createServer(app);
  return httpServer;
}
