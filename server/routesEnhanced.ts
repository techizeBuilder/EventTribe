import type { Express } from "express";
import { createServer, type Server } from "http";
import { mongoStorage } from "./mongodb-storage.js";
import { enhancedAuthService } from "./authServiceEnhanced.js";
import { triggerTicketPurchaseNotification } from "./routes/notificationRoutes.js";
import {
  authenticateToken,
  requireRole,
  requireVerification,
  rateLimitByIP,
} from "./middleware/authMiddleware.js";
import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "passport";
import organizerRoutes from "./routes/organizerRoutes.js";
import Stripe from "stripe";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
} else {
  console.log('[WARNING] Stripe not configured - missing STRIPE_SECRET_KEY environment variable. Payment features will be disabled.');
}

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate QR code for ticket
async function generateQRCode(data: any) {
  try {
    const qrData = JSON.stringify({
      bookingId: data.bookingId,
      eventId: data.eventId,
      userId: data.userEmail,
      timestamp: new Date().toISOString()
    });
    
    return await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return null;
  }
}

// Send confirmation email
async function sendConfirmationEmail(booking: any, qrCode: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.userEmail,
      subject: `Event Tribe - Ticket Confirmation for ${booking.eventTitle}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">EVENT TRIBE</h1>
            <p style="margin: 10px 0 0 0;">Your tickets are confirmed!</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">${booking.eventTitle}</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #374151; margin-bottom: 15px;">Booking Details</h3>
              <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
              <p><strong>Customer:</strong> ${booking.userName}</p>
              <p><strong>Email:</strong> ${booking.userEmail}</p>
              <p><strong>Booking Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</p>
              <p><strong>Total Amount:</strong> $${booking.totalAmount.toFixed(2)}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #374151; margin-bottom: 15px;">Ticket Details</h3>
              ${booking.ticketDetails && booking.ticketDetails.length > 0 ? 
                booking.ticketDetails.map((ticket: any) => 
                  `<p>${ticket.name} x ${ticket.quantity} - $${ticket.total.toFixed(2)}</p>`
                ).join('') : 
                '<p>General Admission</p>'
              }
            </div>
            
            ${qrCode ? `
            <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
              <h3 style="color: #374151; margin-bottom: 15px;">Your QR Code</h3>
              <img src="${qrCode}" alt="QR Code" style="max-width: 200px;">
              <p style="margin-top: 10px; color: #6b7280; font-size: 14px;">
                Present this QR code at the event entrance
              </p>
            </div>
            ` : ''}
          </div>
          
          <div style="background: #374151; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">
              Thank you for choosing Event Tribe! We can't wait to see you at the event.
            </p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully');
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
}

// HTML template for ticket PDF
function generateTicketHTML(booking: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                background: #f8f9fa; 
            }
            .ticket {
                background: white;
                border-radius: 10px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                max-width: 600px;
                margin: 0 auto;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #dc2626;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 32px;
                font-weight: bold;
                color: #dc2626;
                margin-bottom: 10px;
            }
            .event-title {
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin-bottom: 10px;
            }
            .details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
            }
            .detail-item {
                flex: 1;
                margin-right: 20px;
            }
            .detail-label {
                font-weight: bold;
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .detail-value {
                color: #1f2937;
                font-size: 16px;
            }
            .qr-section {
                text-align: center;
                background: #f3f4f6;
                padding: 20px;
                border-radius: 8px;
                margin-top: 20px;
            }
            .booking-id {
                font-size: 18px;
                font-weight: bold;
                color: #dc2626;
                margin-bottom: 10px;
            }
            .ticket-details {
                margin-top: 20px;
            }
            .ticket-item {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            .total {
                font-size: 20px;
                font-weight: bold;
                color: #dc2626;
                text-align: right;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="ticket">
            <div class="header">
                <div class="logo">EVENT TRIBE</div>
                <div class="event-title">${booking.eventTitle}</div>
            </div>
            
            <div class="details">
                <div class="detail-item">
                    <div class="detail-label">BOOKING ID</div>
                    <div class="detail-value">${booking.bookingId}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">BOOKING DATE</div>
                    <div class="detail-value">${new Date(booking.bookingDate).toLocaleDateString()}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">STATUS</div>
                    <div class="detail-value">${booking.status.toUpperCase()}</div>
                </div>
            </div>
            
            <div class="details">
                <div class="detail-item">
                    <div class="detail-label">CUSTOMER</div>
                    <div class="detail-value">${booking.userName}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">EMAIL</div>
                    <div class="detail-value">${booking.userEmail}</div>
                </div>
            </div>
            
            <div class="ticket-details">
                <h3>Ticket Details</h3>
                ${booking.ticketDetails ? booking.ticketDetails.map((ticket: any) => `
                    <div class="ticket-item">
                        <span>${ticket.name} x ${ticket.quantity}</span>
                        <span>$${ticket.total.toFixed(2)}</span>
                    </div>
                `).join('') : ''}
            </div>
            
            <div class="total">
                Total: $${booking.totalAmount.toFixed(2)}
            </div>
            
            <div class="qr-section">
                <div class="booking-id">${booking.bookingId}</div>
                <p>Present this ticket at the event entrance</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

export async function registerEnhancedRoutes(app: Express): Promise<Server> {
  // Connect to MongoDB
  await mongoStorage.connect();

  // Initialize Enhanced Auth Service
  await enhancedAuthService.connect();

  // Session configuration for Google OAuth
  app.use(
    session({
      secret: process.env.JWT_SECRET || "fallback-session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

  // Cookie parser and passport initialization
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(passport.session());

  // Rate limiting for sensitive endpoints
  const authRateLimit = rateLimitByIP(5, 15 * 60 * 1000); // 5 requests per 15 minutes
  const otpRateLimit = rateLimitByIP(3, 5 * 60 * 1000); // 3 requests per 5 minutes

  // ==================== PUBLIC API ROUTES (NO AUTH REQUIRED) ====================

  // Middleware to extract user from JWT token (optional authentication)
  const optionalAuth = (req: any, res: any, next: any) => {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
        req.user = decoded;
      } catch (error) {
        // Invalid token, continue without user
      }
    }
    next();
  };

  // Get all published events for homepage
  app.get("/api/events", optionalAuth, async (req, res) => {
    try {
      // Quick connection check
      if (!await mongoStorage.ensureConnection()) {
        console.log("Database connection failed, returning error");
        return res.status(500).json({ message: 'Database temporarily unavailable. Please try again.' });
      }

      // Get published events that are not expired and exclude user's own events if authenticated
      const currentDate = new Date();
      let query = {
        $and: [
          {
            $or: [
              { status: "published" },
              { status: { $exists: false } },
              { isPublic: { $exists: false } }
            ]
          },
          {
            $or: [
              { endDate: { $gte: currentDate.toISOString() } },
              { endDate: { $exists: false } },
              { endDate: null }
            ]
          }
        ]
      };

      // If user is authenticated, exclude their own events
      if (req.user && req.user._id) {
        query.$and.push({ 
          $and: [
            { organizerId: { $ne: req.user._id } },
            { organizerId: { $ne: req.user._id.toString() } }
          ]
        });
      }

      const events = await mongoStorage.db
        .collection("events")
        .find(query)
        .sort({ startDate: 1 })
        .toArray();

      console.log(`Found ${events.length} events from database`);

      // Transform data to match frontend expectations
      const transformedEvents = events.map((event) => ({
        id: event._id,
        _id: event._id,
        title: event.title || "Untitled Event",
        category: event.category || "General",
        date: event.startDate
          ? new Date(event.startDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          : "TBD",
        time: event.startDate
          ? new Date(event.startDate).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
          : "TBD",
        location: event.address || event.venue || "Location TBD",
        image:
          event.image ||
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop",
        description: event.description || "",
        venue: event.venue || "",
        startDate: event.startDate,
        endDate: event.endDate,
        ticketTypes: event.ticketTypes || [],
        organizer: event.organizerId,
      }));

      res.json(transformedEvents);
    } catch (error) {
      console.error("Error fetching public events:", error);
      // Return sample data on error instead of failing
      const sampleEvents = [
        {
          id: "sample1",
          _id: "sample1",
          title: "Contemporary Art Gallery Opening",
          category: "Culture",
          date: "Tue, Jul 15",
          time: "7:00 PM",
          location: "789 Art District, Los Angeles, CA",
          image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
          description: "Experience the latest contemporary art exhibition featuring local and international artists.",
          venue: "Modern Art Gallery",
          ticketTypes: [
            { name: "General Admission", price: 25, description: "Standard entry ticket" },
            { name: "VIP", price: 50, description: "VIP access with cocktails" }
          ]
        }
      ];
      res.json(sampleEvents);
    }
  });

  // Get single event by ID (public route)
  app.get("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Quick validation for special routes that should be handled elsewhere
      if (id === 'trending' || id === 'past' || id === 'upcoming') {
        return res.status(400).json({ message: 'Invalid event ID format' });
      }
      
      // Quick connection check without retry logic
      if (!await mongoStorage.ensureConnection()) {
        return res.status(500).json({ message: 'Database temporarily unavailable. Please try again.' });
      }
      
      const eventsCollection = mongoStorage.db.collection('events');
      const { ObjectId } = await import('mongodb');
      
      // Validate ObjectId format
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid event ID format' });
      }
      
      // Find the event by ID - allow all events for now (public access)
      const event = await eventsCollection.findOne({ 
        _id: new ObjectId(id)
      });
      
      if (!event) {
        console.log('Event not found in database for ID:', id);
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Transform event data to match frontend expectations
      const transformedEvent = {
        id: event._id,
        _id: event._id,
        title: event.title || "Untitled Event",
        category: event.category || "General",
        date: event.startDate
          ? new Date(event.startDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          : "TBD",
        time: event.startDate
          ? new Date(event.startDate).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
          : "TBD",
        location: event.address || event.venue || "Location TBD",
        venue: event.venue || "",
        address: event.address || "",
        image: event.image || event.coverImage || 
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop",
        description: event.description || "",
        startDate: event.startDate,
        endDate: event.endDate,
        ticketTypes: event.ticketTypes || [],
        organizer: event.organizerId,
        status: event.status,
        isPublic: event.isPublic,
        allowRefunds: event.allowRefunds,
        locationType: event.locationType,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      };
      
      res.json(transformedEvent);
    } catch (error) {
      console.error("Error fetching single event:", error);
      // Return a more user-friendly error message
      if (error.message.includes('Event not found')) {
        res.status(404).json({ message: "Event not found" });
      } else {
        res.status(500).json({ message: "Unable to load event. Please try again in a moment." });
      }
    }
  });

  // Get trending events (recent popular events)
  app.get("/api/events/trending", async (req, res) => {
    try {
      await mongoStorage.connect();

      // Get published events sorted by views/popularity
      const events = await mongoStorage.db
        .collection("events")
        .find({
          status: "published",
        })
        .sort({ views: -1, socialShares: -1 })
        .limit(12)
        .toArray();

      const transformedEvents = events.map((event) => ({
        id: event._id,
        _id: event._id,
        title: event.title || "Untitled Event",
        category: event.category || "General",
        date: event.startDate
          ? new Date(event.startDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          : "TBD",
        time: event.startDate
          ? new Date(event.startDate).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
          : "TBD",
        location: event.address || event.venue || "Location TBD",
        image:
          event.image ||
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop",
        description: event.description || "",
        venue: event.venue || "",
        startDate: event.startDate,
        endDate: event.endDate,
        ticketTypes: event.ticketTypes || [],
        organizer: event.organizerId,
      }));

      res.json(transformedEvents);
    } catch (error) {
      console.error("Error fetching trending events:", error);
      res.status(500).json({ message: "Failed to fetch trending events" });
    }
  });

  // Get past events
  app.get("/api/events/past", async (req, res) => {
    try {
      await mongoStorage.connect();

      const currentDate = new Date();
      const events = await mongoStorage.db
        .collection("events")
        .find({
          status: "published",
          endDate: { $lt: currentDate },
        })
        .sort({ endDate: -1 })
        .limit(8)
        .toArray();

      const transformedEvents = events.map((event) => ({
        id: event._id,
        _id: event._id,
        title: event.title || "Untitled Event",
        category: event.category || "General",
        date: event.startDate
          ? new Date(event.startDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          : "TBD",
        time: event.startDate
          ? new Date(event.startDate).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
          : "TBD",
        location: event.address || event.venue || "Location TBD",
        image:
          event.image ||
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop",
        description: event.description || "",
        venue: event.venue || "",
        startDate: event.startDate,
        endDate: event.endDate,
        ticketTypes: event.ticketTypes || [],
        organizer: event.organizerId,
      }));

      res.json(transformedEvents);
    } catch (error) {
      console.error("Error fetching past events:", error);
      res.status(500).json({ message: "Failed to fetch past events" });
    }
  });

  // Clean up static events and reset to only user events
  app.post("/api/cleanup-static-events", async (req, res) => {
    try {
      await mongoStorage.connect();

      // Remove events that were created by me (static events with specific titles)
      const staticEventTitles = [
        "Summer Music Festival 2025",
        "Tech Innovation Conference",
        "Contemporary Art Gallery Opening",
        "Business Workshop 2025",
        "Food & Wine Festival",
      ];

      const result = await mongoStorage.db.collection("events").deleteMany({
        title: { $in: staticEventTitles },
      });

      console.log(`Removed ${result.deletedCount} static events`);

      // Get remaining events (real user events)
      const remainingEvents = await mongoStorage.db
        .collection("events")
        .find({})
        .toArray();

      res.json({
        message: `Cleaned up ${result.deletedCount} static events`,
        remainingEvents: remainingEvents.length,
        events: remainingEvents.map((e) => ({
          id: e._id,
          title: e.title,
          organizerId: e.organizerId,
          status: e.status,
          isPublic: e.isPublic,
        })),
      });
    } catch (error) {
      console.error("Error cleaning up static events:", error);
      res.status(500).json({ message: "Failed to clean up static events" });
    }
  });

  // ==================== AUTHENTICATION ROUTES ====================

  // User Registration
  app.post("/api/auth/register", authRateLimit, async (req, res) => {
    try {
      const result = await enhancedAuthService.register(req.body);

      // Set HTTP-only cookies for tokens
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        message: result.message,
        user: result.user,
        token: result.accessToken, // For frontend compatibility
        requiresVerification: result.requiresVerification,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // User Login (including admin login)
  app.post("/api/auth/login", authRateLimit, async (req, res) => {
    try {
      const { email, password, role } = req.body;
      
      // Special handling for admin login
      if (role === "admin") {
        // For demo purposes, allow admin login with specific credentials
        if (email === "admin@eventtribe.com" && password === "admin123") {
          // Create admin user object
          const adminUser = {
            _id: "admin-001",
            email: "admin@eventtribe.com",
            role: "admin",
            firstName: "Admin",
            lastName: "User",
            emailVerified: true,
            phoneVerified: true
          };
          
          // Generate tokens for admin
          const { accessToken, refreshToken } = enhancedAuthService.generateTokens(adminUser._id, "admin");
          
          // Set HTTP-only cookies for tokens
          res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 15 * 60 * 1000, // 15 minutes
          });

          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });

          return res.json({
            message: "Admin login successful",
            user: adminUser,
            token: accessToken,
          });
        } else {
          return res.status(401).json({ message: "Invalid admin credentials" });
        }
      }
      
      // Regular user login
      const result = await enhancedAuthService.login(req.body);

      // Set HTTP-only cookies for tokens
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        message: result.message,
        user: result.user,
        token: result.accessToken, // For frontend compatibility
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: error.message });
    }
  });

  // Google OAuth Routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] }),
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect:
        "https://a74be342-6a6e-4f94-b0b2-aa72dd0c398b-00-2xm0v3rgnfipm.janeway.replit.dev/login?error=oauth_failed",
    }),
    async (req, res) => {
      try {
        const user = req.user as any;
        const { accessToken, refreshToken } =
          enhancedAuthService.generateTokens(user._id, user.role);
        await enhancedAuthService.storeRefreshToken(user._id, refreshToken);

        // Set HTTP-only cookies
        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Redirect to frontend with success
        res.redirect(
          `https://a74be342-6a6e-4f94-b0b2-aa72dd0c398b-00-2xm0v3rgnfipm.janeway.replit.dev/?login=success&token=${accessToken}`,
        );
      } catch (error) {
        console.error("Google OAuth callback error:", error);
        res.redirect(
          "https://a74be342-6a6e-4f94-b0b2-aa72dd0c398b-00-2xm0v3rgnfipm.janeway.replit.dev/login?error=oauth_callback_failed",
        );
      }
    },
  );

  // Token Refresh
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token required" });
      }

      const result = await enhancedAuthService.refreshAccessToken(refreshToken);

      // Set new access token cookie
      res.cookie("accessToken", result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 15 * 60 * 1000,
      });

      res.json({
        message: result.message,
        accessToken: result.accessToken,
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(401).json({ message: error.message });
    }
  });

  // ==================== OTP VERIFICATION ROUTES ====================

  // Verify OTP
  app.post("/api/auth/verify-otp", otpRateLimit, async (req, res) => {
    try {
      const { identifier, otp, type } = req.body;
      const result = await enhancedAuthService.verifyOTP(identifier, otp, type);

      if (result.success) {
        res.json({ message: result.message, verified: true });
      } else {
        res.status(400).json({
          message: result.error,
          remainingAttempts: result.remainingAttempts,
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Resend OTP
  app.post("/api/auth/resend-otp", otpRateLimit, async (req, res) => {
    try {
      const { identifier, type } = req.body;
      const result = await enhancedAuthService.resendOTP(identifier, type);
      res.json(result);
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // ==================== PASSWORD RESET ROUTES ====================

  // Request Password Reset
  app.post("/api/auth/forgot-password", authRateLimit, async (req, res) => {
    try {
      const { email } = req.body;
      const result = await enhancedAuthService.requestPasswordReset(email);
      res.json(result);
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Reset Password
  app.post("/api/auth/reset-password", authRateLimit, async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const result = await enhancedAuthService.resetPassword(
        token,
        newPassword,
      );
      res.json(result);
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // ==================== PROTECTED ROUTES ====================

  // Get User Profile
  app.get("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      res.json({ user });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update User Profile
  app.put("/api/auth/profile", authenticateToken, async (req, res) => {
    try {
      const userId = req.user._id;
      const updatedUser = await enhancedAuthService.updateUser(
        userId,
        req.body,
      );
      res.json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Logout
  app.post("/api/auth/logout", authenticateToken, async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (refreshToken) {
        await enhancedAuthService.logout(refreshToken);
      }

      // Clear cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Create Test Organizer (Development Only)
  app.post("/api/auth/create-test-organizer", async (req, res) => {
    try {
      const testOrganizerData = {
        email: "organizer@test.com",
        password: "password123",
        confirmPassword: "password123",
        firstName: "Test",
        lastName: "Organizer",
        role: "organizer",
        emailVerified: true,
        phoneVerified: true,
        acceptTerms: true,
      };

      // Check if user already exists
      const existingUser = await mongoStorage.getUserByEmail(
        testOrganizerData.email,
      );
      if (existingUser) {
        // Generate tokens for existing user
        const tokens = enhancedAuthService.generateTokens(
          existingUser._id,
          existingUser.role,
        );
        await enhancedAuthService.storeRefreshToken(
          existingUser._id,
          tokens.refreshToken,
        );

        return res.json({
          message: "Test organizer already exists",
          user: existingUser,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      }

      // Create new test organizer
      const result = await enhancedAuthService.register(testOrganizerData);
      res.json({
        message: "Test organizer created successfully",
        ...result,
      });
    } catch (error) {
      console.error("Test organizer creation error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // ==================== TEST ROUTES ====================

  // Quick test login for organizer (development only)
  app.post("/api/auth/test-login", async (req, res) => {
    try {
      const testOrganizerData = {
        firstName: "Test",
        lastName: "Organizer",
        email: "test@organizer.com",
        password: "password123",
        confirmPassword: "password123",
        role: "organizer",
        emailVerified: true,
        phoneVerified: true,
        phone: "+1234567890",
        acceptTerms: true,
        organizationName: "Test Organization",
        instagramHandle: "@testorganizer",
      };

      // Check if user already exists
      const existingUser = await mongoStorage.getUserByEmail(
        testOrganizerData.email,
      );
      if (existingUser) {
        // Generate tokens for existing user
        const tokens = enhancedAuthService.generateTokens(
          existingUser._id,
          existingUser.role,
        );
        await enhancedAuthService.storeRefreshToken(
          existingUser._id,
          tokens.refreshToken,
        );

        return res.json({
          message: "Test organizer logged in",
          user: existingUser,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      }

      // Create new test organizer using direct database insertion
      const hashedPassword =
        await enhancedAuthService.hashPassword("password123");
      const newUser = {
        firstName: "Test",
        lastName: "Organizer",
        email: "test@organizer.com",
        password: hashedPassword,
        role: "organizer",
        emailVerified: true,
        phoneVerified: true,
        phone: "+1234567890",
        organizationName: "Test Organization",
        instagramHandle: "@testorganizer",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertResult = await mongoStorage.db
        .collection("auth_users")
        .insertOne(newUser);
      const user = await mongoStorage.db
        .collection("auth_users")
        .findOne({ _id: insertResult.insertedId });

      // Generate tokens
      const tokens = enhancedAuthService.generateTokens(user._id, user.role);
      await enhancedAuthService.storeRefreshToken(
        user._id,
        tokens.refreshToken,
      );

      res.json({
        message: "Test organizer created and logged in",
        user: user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      console.error("Test organizer creation error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // ==================== ROLE-BASED ROUTES ====================

  // Organizer-only route example
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

  // Attendee dashboard
  app.get(
    "/api/attendee/dashboard",
    authenticateToken,
    requireRole(["attendee"]),
    async (req, res) => {
      try {
        // Attendee dashboard logic here
        res.json({
          message: "Welcome to attendee dashboard",
          user: req.user,
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to load attendee dashboard" });
      }
    },
  );

  // ==================== ADMIN DASHBOARD ROUTES ====================

  // Admin Overview Statistics
  app.get("/api/admin/overview", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      // Get total users
      const totalUsers = await mongoStorage.db.collection("auth_users").countDocuments();
      
      // Get total events
      const totalEvents = await mongoStorage.db.collection("events").countDocuments();
      
      // Get total revenue from bookings
      const revenueData = await mongoStorage.db.collection("bookings").aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]).toArray();
      const totalRevenue = revenueData[0]?.total || 0;
      
      // Get active events (published and future)
      const activeEvents = await mongoStorage.db.collection("events").countDocuments({
        status: "published",
        startDate: { $gte: new Date() }
      });
      
      // Get total attendees from bookings
      const attendeeData = await mongoStorage.db.collection("bookings").aggregate([
        { $group: { _id: null, total: { $sum: "$attendees" } } }
      ]).toArray();
      const totalAttendees = attendeeData[0]?.total || 0;
      
      // Calculate monthly growth (mock for now)
      const monthlyGrowth = 12.5;
      
      res.json({
        totalUsers,
        totalEvents,
        totalRevenue,
        activeEvents,
        totalAttendees,
        monthlyGrowth,
        userEngagement: 78,
        eventSuccessRate: 92,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error("Error fetching admin overview:", error);
      res.status(500).json({ message: "Failed to fetch admin overview" });
    }
  });

  // Admin Users Management
  app.get("/api/admin/users", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      const users = await mongoStorage.db.collection("auth_users").find({}).toArray();
      
      const formattedUsers = users.map(user => ({
        id: user._id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
        email: user.email,
        role: user.role || 'attendee',
        status: user.emailVerified ? 'active' : 'pending',
        verified: user.emailVerified && user.phoneVerified,
        joinDate: user.createdAt || new Date(),
        lastLogin: user.lastLogin || new Date()
      }));
      
      res.json(formattedUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin Events Management
  app.get("/api/admin/events", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      const events = await mongoStorage.db.collection("events").find({}).toArray();
      
      const formattedEvents = events.map(event => ({
        id: event._id,
        title: event.title,
        organizer: event.organizerId,
        date: event.startDate,
        status: event.status,
        tickets: event.ticketTypes?.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0) || 0,
        revenue: event.ticketTypes?.reduce((sum, ticket) => sum + ((ticket.price || 0) * (ticket.sold || 0)), 0) || 0,
        attendees: event.attendees || 0
      }));
      
      res.json(formattedEvents);
    } catch (error) {
      console.error("Error fetching admin events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Admin Event Statistics
  app.get("/api/admin/events/stats", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      const totalEvents = await mongoStorage.db.collection("events").countDocuments();
      const publishedEvents = await mongoStorage.db.collection("events").countDocuments({ status: "published" });
      const draftEvents = await mongoStorage.db.collection("events").countDocuments({ status: "draft" });
      
      // Get total revenue from all events
      const events = await mongoStorage.db.collection("events").find({}).toArray();
      const totalRevenue = events.reduce((sum, event) => {
        return sum + (event.ticketTypes?.reduce((ticketSum, ticket) => 
          ticketSum + ((ticket.price || 0) * (ticket.sold || 0)), 0) || 0);
      }, 0);
      
      // Get total tickets sold
      const totalTickets = events.reduce((sum, event) => {
        return sum + (event.ticketTypes?.reduce((ticketSum, ticket) => 
          ticketSum + (ticket.sold || 0), 0) || 0);
      }, 0);
      
      res.json({
        totalEvents,
        publishedEvents,
        draftEvents,
        totalRevenue,
        totalTickets
      });
    } catch (error) {
      console.error("Error fetching admin event stats:", error);
      res.status(500).json({ message: "Failed to fetch event stats" });
    }
  });

  // Admin Analytics
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      // Get revenue data
      const revenueData = await mongoStorage.db.collection("bookings").aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]).toArray();
      
      // Get event stats
      const eventStats = await mongoStorage.db.collection("events").aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]).toArray();
      
      // Get user stats
      const userStats = await mongoStorage.db.collection("auth_users").aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } }
      ]).toArray();
      
      res.json({
        totalRevenue: revenueData[0]?.total || 0,
        totalEvents: eventStats.reduce((sum, stat) => sum + stat.count, 0),
        totalUsers: userStats.reduce((sum, stat) => sum + stat.count, 0),
        avgTicketPrice: 48.5,
        conversionRate: 62.5,
        growthRate: 23.8,
        eventStats,
        userStats,
        revenueGrowth: 23.8,
        userGrowth: 18.2
      });
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin Recent Activities
  app.get("/api/admin/activities", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      // Get recent user registrations
      const recentUsers = await mongoStorage.db.collection("auth_users")
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      // Get recent events
      const recentEvents = await mongoStorage.db.collection("events")
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      const activities = [
        ...recentUsers.map(user => ({
          id: user._id,
          type: 'user_registered',
          message: `New user registered: ${user.firstName || ''} ${user.lastName || ''}`,
          timestamp: user.createdAt || new Date(),
          user: user.email
        })),
        ...recentEvents.map(event => ({
          id: event._id,
          type: 'event_created',
          message: `New event created: ${event.title}`,
          timestamp: event.createdAt || new Date(),
          user: event.organizerId
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
      
      res.json(activities);
    } catch (error) {
      console.error("Error fetching admin activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Admin User Management Actions
  
  // Get single user details
  app.get("/api/admin/users/:userId", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      const user = await mongoStorage.db.collection("auth_users").findOne({ _id: req.params.userId });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user._id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
        email: user.email,
        role: user.role || 'attendee',
        status: user.suspended ? 'suspended' : (user.emailVerified ? 'active' : 'pending'),
        verified: user.emailVerified && user.phoneVerified,
        joinDate: user.createdAt || new Date(),
        lastLogin: user.lastLogin || new Date(),
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      
      // Force reconnection on error
      try {
        await mongoStorage.connect();
      } catch (reconnectError) {
        console.error("Reconnection failed:", reconnectError);
      }
      
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  // Update user details
  app.put("/api/admin/users/:userId", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      const { firstName, lastName, role, status } = req.body;
      
      const updateData = {
        firstName,
        lastName,
        role,
        updatedAt: new Date()
      };
      
      // Handle status changes
      if (status === 'active') {
        updateData.emailVerified = true;
      } else if (status === 'suspended') {
        updateData.suspended = true;
      }
      
      const result = await mongoStorage.db.collection("auth_users").updateOne(
        { _id: req.params.userId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:userId", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      const result = await mongoStorage.db.collection("auth_users").deleteOne({ _id: req.params.userId });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Update user status
  app.put("/api/admin/users/:userId/status", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      const { status } = req.body;
      
      const updateData = {
        updatedAt: new Date()
      };
      
      if (status === 'active') {
        updateData.emailVerified = true;
        updateData.suspended = false;
      } else if (status === 'suspended') {
        updateData.suspended = true;
      } else if (status === 'pending') {
        updateData.emailVerified = false;
        updateData.suspended = false;
      }
      
      const result = await mongoStorage.db.collection("auth_users").updateOne(
        { _id: req.params.userId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User status updated successfully" });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Update user role
  app.put("/api/admin/users/:userId/role", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      const { role } = req.body;
      
      const result = await mongoStorage.db.collection("auth_users").updateOne(
        { _id: req.params.userId },
        { 
          $set: { 
            role,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Create new user
  app.post("/api/admin/users", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      const { email, firstName, lastName, role, password } = req.body;
      
      // Check if user already exists
      const existingUser = await mongoStorage.db.collection("auth_users").findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Create new user
      const newUser = {
        _id: new Date().getTime().toString(),
        email,
        firstName,
        lastName,
        role: role || 'attendee',
        password: await bcrypt.hash(password, 12),
        emailVerified: true,
        phoneVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await mongoStorage.db.collection("auth_users").insertOne(newUser);
      
      res.status(201).json({ message: "User created successfully", userId: newUser._id });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Admin Event Management Actions
  
  // Get single event details
  app.get("/api/admin/events/:eventId", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      const event = await mongoStorage.db.collection("events").findOne({ _id: req.params.eventId });
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({
        id: event._id,
        title: event.title,
        description: event.description,
        venue: event.venue,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status,
        tickets: event.tickets,
        attendees: event.attendees,
        revenue: event.revenue,
        organizer: event.organizer,
        organizerId: event.organizerId,
        category: event.category,
        imageUrl: event.imageUrl
      });
    } catch (error) {
      console.error("Error fetching event details:", error);
      res.status(500).json({ message: "Failed to fetch event details" });
    }
  });

  // Update event details
  app.put("/api/admin/events/:eventId", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      const { title, description, venue, startDate, endDate, status, category } = req.body;
      
      const updateData = {
        title,
        description,
        venue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
        category,
        updatedAt: new Date()
      };
      
      const result = await mongoStorage.db.collection("events").updateOne(
        { _id: req.params.eventId },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ message: "Event updated successfully" });
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  // Delete event
  app.delete("/api/admin/events/:eventId", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      const result = await mongoStorage.db.collection("events").deleteOne({ _id: req.params.eventId });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Update event status
  app.put("/api/admin/events/:eventId/status", async (req, res) => {
    try {
      await mongoStorage.connect();
      
      const { status } = req.body;
      
      const result = await mongoStorage.db.collection("events").updateOne(
        { _id: req.params.eventId },
        { 
          $set: { 
            status,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ message: "Event status updated successfully" });
    } catch (error) {
      console.error("Error updating event status:", error);
      res.status(500).json({ message: "Failed to update event status" });
    }
  });

  // ==================== ORGANIZER DASHBOARD ROUTES ====================

  // Mount all organizer routes under /api/organizer
  app.use("/api/organizer", organizerRoutes);

  // ==================== DATA ROUTES (EXISTING) ====================

  // Get all users (for backward compatibility)
  app.get(
    "/api/users",
    authenticateToken,
    requireRole(["organizer"]),
    async (req, res) => {
      try {
        const users = await mongoStorage.getAllUsers();
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    },
  );

  // Get user stats
  app.get(
    "/api/stats",
    authenticateToken,
    requireRole(["organizer"]),
    async (req, res) => {
      try {
        const stats = await mongoStorage.getStats();
        res.json(stats);
      } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Failed to fetch stats" });
      }
    },
  );

  // ==================== STRIPE PAYMENT ROUTES ====================

  // Create payment intent
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

  // Create payment intent for multi-event checkout
  app.post("/api/create-multi-event-payment-intent", async (req, res) => {
    try {
      const { items, amount, userEmail, userName } = req.body;
      
      console.log('Creating multi-event payment intent:', {
        items,
        amount,
        userEmail,
        userName
      });
      
      // Create payment intent with line items metadata
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userEmail: userEmail || "",
          userName: userName || "",
          itemsCount: items.length.toString(),
          items: JSON.stringify(items)
        }
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Error creating multi-event payment intent:", error);
      res.status(500).json({ 
        error: "Failed to create payment intent",
        message: error.message 
      });
    }
  });

  // Save multi-event booking after successful payment
  app.post("/api/save-multi-event-booking", async (req, res) => {
    try {
      const { paymentIntentId, cartItems, userEmail, userName, totalAmount } = req.body;
      
      console.log('Saving multi-event booking:', {
        paymentIntentId,
        cartItems,
        userEmail,
        userName,
        totalAmount
      });
      
      if (!paymentIntentId || !cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: "Missing required booking information" });
      }

      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      // Create separate booking record for each event
      const bookings = [];
      await mongoStorage.connect();
      
      for (const item of cartItems) {
        const booking = {
          bookingId: `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          paymentIntentId,
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          ticketDetails: [{
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.total
          }],
          userEmail: userEmail || "guest@example.com",
          userName: userName || "Guest User",
          totalAmount: item.total,
          currency: paymentIntent.currency,
          status: "confirmed",
          bookingDate: new Date(),
          createdAt: new Date()
        };

        console.log('Creating booking record:', booking);

        // Generate QR code for this booking
        const qrCode = await generateQRCode(booking);
        if (qrCode) {
          booking.qrCode = qrCode;
        }

        // Save booking to MongoDB
        const result = await mongoStorage.db.collection("bookings").insertOne(booking);
        bookings.push({ ...booking, _id: result.insertedId });

        // Send confirmation email for this booking
        try {
          await sendConfirmationEmail(booking, qrCode);
        } catch (emailError) {
          console.error('Email sending failed for booking:', booking.bookingId, emailError);
        }

        // Trigger notification system
        try {
          await triggerTicketPurchaseNotification(booking);
        } catch (notificationError) {
          console.error('Notification trigger failed for booking:', booking.bookingId, notificationError);
        }
      }

      console.log('All bookings saved successfully:', bookings.length);
      
      res.json({
        success: true,
        bookings: bookings,
        message: `${bookings.length} bookings confirmed successfully`
      });
    } catch (error: any) {
      console.error("Error saving multi-event booking:", error);
      res.status(500).json({ 
        error: "Failed to save bookings",
        message: error.message 
      });
    }
  });

  // Save ticket booking after successful payment
  app.post("/api/save-booking", async (req, res) => {
    try {
      const { paymentIntentId, eventId, eventTitle, ticketDetails, userEmail, userName } = req.body;
      
      console.log('Saving booking with received data:', {
        paymentIntentId,
        eventId,
        eventTitle,
        ticketDetails,
        userEmail,
        userName
      });
      
      if (!paymentIntentId || !eventId) {
        return res.status(400).json({ error: "Missing required booking information" });
      }

      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      // Create booking record
      const booking = {
        bookingId: `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        paymentIntentId,
        eventId,
        eventTitle,
        ticketDetails,
        userEmail: userEmail || "guest@example.com",
        userName: userName || "Guest User",
        totalAmount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: "confirmed",
        bookingDate: new Date(),
        createdAt: new Date()
      };

      console.log('Creating booking record:', booking);

      // Generate QR code for this booking
      const qrCode = await generateQRCode(booking);
      if (qrCode) {
        booking.qrCode = qrCode;
      }

      // Save to MongoDB
      await mongoStorage.connect();
      const result = await mongoStorage.db.collection("bookings").insertOne(booking);
      
      console.log('Booking saved successfully with ID:', result.insertedId);

      // Send confirmation email
      try {
        await sendConfirmationEmail(booking, qrCode);
      } catch (emailError) {
        console.error('Email sending failed for booking:', booking.bookingId, emailError);
      }

      // Trigger notification system
      try {
        await triggerTicketPurchaseNotification(booking);
      } catch (notificationError) {
        console.error('Notification trigger failed for booking:', booking.bookingId, notificationError);
      }
      
      res.json({
        success: true,
        bookingId: booking.bookingId,
        booking: { ...booking, _id: result.insertedId }
      });
    } catch (error: any) {
      console.error("Error saving booking:", error);
      res.status(500).json({ 
        error: "Failed to save booking",
        message: error.message 
      });
    }
  });

  // Get user bookings for attendee dashboard
  app.get("/api/attendee/bookings", async (req, res) => {
    try {
      const { userEmail } = req.query;
      
      console.log('Fetching bookings for email:', userEmail);
      
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

      console.log('Found bookings:', bookings.length);
      console.log('Bookings data:', bookings);

      res.json({ bookings });
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      // Return empty array instead of error for better UX
      res.json({ bookings: [] });
    }
  });

  // Get booking details by ID
  app.get("/api/booking/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      
      await mongoStorage.connect();
      const booking = await mongoStorage.db
        .collection("bookings")
        .findOne({ bookingId });

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      res.json({ booking });
    } catch (error: any) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ 
        error: "Failed to fetch booking",
        message: error.message 
      });
    }
  });

  // Generate and download ticket PDF
  app.get("/api/ticket/download/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      
      // Get booking details
      await mongoStorage.connect();
      const booking = await mongoStorage.db
        .collection("bookings")
        .findOne({ bookingId });

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Generate PDF content using jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Set page background color
      doc.setFillColor(248, 250, 252); // Light gray background
      doc.rect(0, 0, 210, 297, 'F'); // Fill entire page
      
      // Main ticket container with rounded corners effect
      doc.setFillColor(255, 255, 255); // White background
      doc.setDrawColor(226, 232, 240); // Light border
      doc.setLineWidth(0.5);
      doc.roundedRect(15, 15, 180, 260, 8, 8, 'FD'); // Rounded rectangle with fill and border
      
      // Header section with gradient effect
      doc.setFillColor(99, 102, 241); // Blue gradient start
      doc.roundedRect(20, 20, 170, 40, 6, 6, 'F');
      
      // EVENT TRIBE Logo
      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('EVENT TRIBE', 105, 35, { align: 'center' });
      
      // Decorative line under logo
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1);
      doc.line(70, 45, 140, 45);
      
      // Event title with modern styling
      doc.setFillColor(245, 245, 245); // Light gray background for event title
      doc.roundedRect(25, 70, 160, 25, 4, 4, 'F');
      doc.setTextColor(30, 41, 59); // Dark text
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(booking.eventTitle, 105, 87, { align: 'center' });
      
      // Customer information section
      let yPos = 110;
      doc.setFillColor(248, 250, 252); // Very light background
      doc.roundedRect(25, yPos, 160, 70, 4, 4, 'F');
      
      // Section header
      doc.setTextColor(99, 102, 241); // Blue text
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('BOOKING INFORMATION', 35, yPos + 15);
      
      // Booking details with modern layout
      doc.setTextColor(71, 85, 105); // Medium gray text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Left column
      doc.setFont('helvetica', 'bold');
      doc.text('Booking ID:', 35, yPos + 30);
      doc.text('Customer:', 35, yPos + 40);
      doc.text('Email:', 35, yPos + 50);
      doc.text('Date:', 35, yPos + 60);
      
      // Right column values
      doc.setFont('helvetica', 'normal');
      doc.text(booking.bookingId, 80, yPos + 30);
      doc.text(booking.userName, 80, yPos + 40);
      doc.text(booking.userEmail, 80, yPos + 50);
      doc.text(new Date(booking.bookingDate).toLocaleDateString(), 80, yPos + 60);
      
      // Status badge
      const statusColor = booking.status.toLowerCase() === 'confirmed' ? [34, 197, 94] : [239, 68, 68];
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(140, yPos + 25, 35, 12, 6, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(booking.status.toUpperCase(), 157.5, yPos + 33, { align: 'center' });
      
      // Ticket details section
      yPos = 190;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(25, yPos, 160, 50, 4, 4, 'F');
      
      doc.setTextColor(99, 102, 241);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TICKET DETAILS', 35, yPos + 15);
      
      // Ticket items
      doc.setTextColor(71, 85, 105);
      doc.setFontSize(10);
      let ticketYPos = yPos + 25;
      
      if (booking.ticketDetails && Array.isArray(booking.ticketDetails)) {
        booking.ticketDetails.forEach((ticket: any) => {
          doc.setFont('helvetica', 'normal');
          doc.text(`${ticket.name} x ${ticket.quantity}`, 35, ticketYPos);
          doc.setFont('helvetica', 'bold');
          doc.text(`$${ticket.total.toFixed(2)}`, 155, ticketYPos);
          ticketYPos += 10;
        });
      }
      
      // Total amount with highlight
      doc.setFillColor(99, 102, 241);
      doc.roundedRect(140, ticketYPos, 40, 15, 6, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${booking.totalAmount.toFixed(2)}`, 160, ticketYPos + 10, { align: 'center' });
      
      // QR Code section
      if (booking.qrCode) {
        try {
          yPos = 250;
          
          // QR Code container
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(25, yPos, 80, 60, 4, 4, 'FD');
          
          // QR Code
          const qrCodeImage = booking.qrCode.replace(/^data:image\/png;base64,/, '');
          doc.addImage(qrCodeImage, 'PNG', 35, yPos + 5, 40, 40);
          
          // QR Code instructions
          doc.setTextColor(71, 85, 105);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text('Present this QR code', 55, yPos + 50, { align: 'center' });
          doc.text('at the event entrance', 55, yPos + 55, { align: 'center' });
          
          // Event entry instructions
          doc.setFillColor(254, 249, 195); // Light yellow background
          doc.roundedRect(110, yPos, 75, 60, 4, 4, 'F');
          
          doc.setTextColor(146, 64, 14); // Orange text
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('IMPORTANT', 147.5, yPos + 15, { align: 'center' });
          
          doc.setTextColor(120, 53, 15);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text('• Arrive 30 minutes early', 115, yPos + 25);
          doc.text('• Bring a valid ID', 115, yPos + 32);
          doc.text('• Keep this ticket safe', 115, yPos + 39);
          doc.text('• No refunds after event', 115, yPos + 46);
          
        } catch (qrError) {
          console.error('Error adding QR code to PDF:', qrError);
        }
      } else {
        yPos = 250;
        doc.setFillColor(254, 249, 195);
        doc.roundedRect(25, yPos, 160, 25, 4, 4, 'F');
        doc.setTextColor(146, 64, 14);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Present this ticket at the event entrance', 105, yPos + 15, { align: 'center' });
      }
      
      // Footer with decorative elements
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(25, 320, 185, 320);
      
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for choosing Event Tribe!', 105, 330, { align: 'center' });
      doc.text('For support, contact us at support@eventtribe.com', 105, 335, { align: 'center' });
      
      // Set response headers for PDF display (inline, not download)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=ticket-${bookingId}.pdf`);
      
      // Send PDF buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error("Error generating ticket PDF:", error);
      res.status(500).json({ 
        error: "Failed to generate ticket PDF",
        message: error.message 
      });
    }
  });

  // Confirm payment
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

  // ==================== CART API ENDPOINTS ====================

  // Add item to cart
  app.post("/api/cart/add", async (req, res) => {
    try {
      const { userEmail, eventId, eventTitle, ticketType, quantity } = req.body;
      
      if (!userEmail || !eventId || !eventTitle || !ticketType || !quantity) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const connected = await mongoStorage.connect();
      if (!connected) {
        return res.status(503).json({ error: "Database temporarily unavailable" });
      }

      const cartItem = {
        eventId,
        eventTitle,
        ticketType,
        quantity: parseInt(quantity)
      };

      const result = await mongoStorage.addToCart(userEmail, cartItem);
      res.json({ success: true, item: result });
    } catch (error: any) {
      console.error("Add to cart error:", error);
      res.status(500).json({ error: "Failed to add item to cart" });
    }
  });

  // Get cart items for user
  app.get("/api/cart/:userEmail", async (req, res) => {
    try {
      const { userEmail } = req.params;
      
      const connected = await mongoStorage.connect();
      if (!connected) {
        return res.json({ items: [] });
      }
      
      const cartItems = await mongoStorage.getCart(userEmail);
      res.json({ items: cartItems });
    } catch (error: any) {
      console.error("Get cart error:", error);
      res.json({ items: [] });
    }
  });

  // Get cart count for user
  app.get("/api/cart/count/:userEmail", async (req, res) => {
    try {
      const { userEmail } = req.params;
      
      const connected = await mongoStorage.connect();
      if (!connected) {
        return res.json({ count: 0 });
      }
      
      const count = await mongoStorage.getCartCount(userEmail);
      res.json({ count });
    } catch (error: any) {
      console.error("Get cart count error:", error);
      res.json({ count: 0 });
    }
  });

  // Update cart item quantity
  app.put("/api/cart/update", async (req, res) => {
    try {
      const { userEmail, itemId, quantity } = req.body;
      
      if (!userEmail || !itemId || quantity === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await mongoStorage.connect();
      const result = await mongoStorage.updateCartItem(userEmail, itemId, parseInt(quantity));
      res.json({ success: true, item: result });
    } catch (error: any) {
      console.error("Update cart error:", error);
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });

  // Remove item from cart
  app.delete("/api/cart/remove", async (req, res) => {
    try {
      const { userEmail, itemId } = req.body;
      
      console.log(`[Cart API] Remove request - userEmail: ${userEmail}, itemId: ${itemId}`);
      
      if (!userEmail || !itemId) {
        console.log("[Cart API] Missing required fields");
        return res.status(400).json({ error: "Missing required fields" });
      }

      await mongoStorage.connect();
      const result = await mongoStorage.removeFromCart(userEmail, itemId);
      
      console.log(`[Cart API] Remove result: ${result}`);
      
      if (result) {
        res.json({ success: true, deleted: true });
      } else {
        console.log("[Cart API] No item was deleted");
        res.json({ success: false, error: "Item not found or already removed" });
      }
    } catch (error: any) {
      console.error("Remove from cart error:", error);
      res.status(500).json({ error: "Failed to remove item from cart" });
    }
  });

  // Clear entire cart
  app.delete("/api/cart/clear/:userEmail", async (req, res) => {
    try {
      const { userEmail } = req.params;
      
      await mongoStorage.connect();
      await mongoStorage.clearCart(userEmail);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Clear cart error:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
