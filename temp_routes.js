/**
 * Complete API Routes for Organizer Dashboard
 * All endpoints for comprehensive event management platform
 */

import express from 'express';
import { organizerStorage } from '../services/organizerStorageService.js';
import { authenticateToken, requireRole, requireVerification } from '../middleware/authMiddleware.js';
import { sampleDataService } from '../services/sampleDataService.js';
import { payoutService } from '../services/payoutService.js';
import { mongoSupportTicketService } from '../services/mongoSupportTicketService.js';
import cleanBankAccountRouter from './cleanBankAccountRoutes.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['organizer']));
// Temporarily disable verification requirement for development
// router.use(requireVerification('both'));

// Test endpoint to verify authentication
router.get('/test-auth', async (req, res) => {
  try {
    res.json({
      message: 'Authentication successful',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Test auth error', error: error.message });
  }
});

// ==================== DASHBOARD OVERVIEW ====================

// GET /api/organizer/dashboard - Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const overview = await organizerStorage.getDashboardOverview(organizerId);
    res.json(overview);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Failed to load dashboard overview' });
  }
});

// ==================== ORGANIZATION MANAGEMENT ====================

// POST /api/organizer/organizations - Create organization
router.post('/organizations', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const orgData = { ...req.body, ownerId: organizerId };

    const organization = await organizerStorage.createOrganization(orgData);
    res.status(201).json(organization);
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ message: 'Failed to create organization' });
  }
});

// GET /api/organizer/organizations - Get user's organizations
router.get('/organizations', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const organizations = await organizerStorage.getOrganizationsByOwner(organizerId);
    res.json(organizations);
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ message: 'Failed to fetch organizations' });
  }
});

// PUT /api/organizer/organizations/:id - Update organization
router.put('/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.updateOrganization(id, req.body);

    if (success) {
      const organization = await organizerStorage.getOrganizationById(id);
      res.json(organization);
    } else {
      res.status(404).json({ message: 'Organization not found' });
    }
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ message: 'Failed to update organization' });
  }
});

// DELETE /api/organizer/organizations/:id - Delete organization
router.delete('/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.deleteOrganization(id);

    if (success) {
      res.json({ message: 'Organization deleted successfully' });
    } else {
      res.status(404).json({ message: 'Organization not found' });
    }
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ message: 'Failed to delete organization' });
  }
});

// ==================== EVENT MANAGEMENT ====================

// POST /api/organizer/events - Create event
router.post('/events', async (req, res) => {
  try {
    const organizerId = req.user._id;

    // Event creation request received

    // Process ticket types to ensure proper data structure
    const processedTicketTypes = req.body.ticketTypes ? req.body.ticketTypes.map(ticket => {
      // Helper function to properly convert boolean values
      const toBool = (value) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') return value === 'true' || value === '1';
        return Boolean(value);
      };

      // Helper function to handle datetime values
      const processDateTime = (dateValue) => {
        if (!dateValue || dateValue === '') return null;
        try {
          // If it's already a valid date string, return it
          const date = new Date(dateValue);
          return date.toISOString();
        } catch (error) {
          console.error('Invalid date format:', dateValue);
          return null;
        }
      };

      return {
        name: ticket.name || 'General Admission',
        description: ticket.description || 'Event ticket',
        price: parseFloat(ticket.price) || 0,
        quantity: parseInt(ticket.quantity) || 100,
        displayPrice: parseFloat(ticket.displayPrice) || parseFloat(ticket.price) || 0,
        maxCartQty: parseInt(ticket.maxCartQty) || 10,
        availability: ticket.availability || 'Available',
        isActive: ticket.isActive !== false,
        sold: 0,
        saleStartDate: ticket.saleStartDate || new Date().toISOString(),
        saleEndDate: ticket.saleEndDate || req.body.endDate || new Date().toISOString(),
        // Advanced settings with proper boolean conversion
        enableSkipLine: toBool(ticket.enableSkipLine),
        passwordProtect: toBool(ticket.passwordProtect),
        enableBundle: toBool(ticket.enableBundle),
        enableEarlyBird: toBool(ticket.enableEarlyBird),
        coverTicket: toBool(ticket.coverTicket),
        enableComboTickets: toBool(ticket.enableComboTickets),
        enableWaitlist: toBool(ticket.enableWaitlist),
        hideTicket: toBool(ticket.hideTicket),
        bundlePrice: ticket.bundlePrice && ticket.bundlePrice !== '' ? parseFloat(ticket.bundlePrice) : null,
        waitlistTicket: ticket.waitlistTicket || null,
        perks: ticket.perks || [],
        // Additional dynamic fields with proper processing
        ticketPassword: ticket.ticketPassword || null,
        earlyBirdPrice: ticket.earlyBirdPrice && ticket.earlyBirdPrice !== '' ? parseFloat(ticket.earlyBirdPrice) : null,
        earlyBirdEndDate: processDateTime(ticket.earlyBirdEndDate),
        creditPrice: ticket.creditPrice && ticket.creditPrice !== '' ? parseFloat(ticket.creditPrice) : null,
        // Combo ticket fields  
        comboTitle: ticket.comboTitle && ticket.comboTitle !== '' ? ticket.comboTitle : null,
        comboTickets: ticket.comboTickets && ticket.comboTickets !== '' ? ticket.comboTickets : null,
        comboDiscount: ticket.comboDiscount && ticket.comboDiscount !== '' ? parseFloat(ticket.comboDiscount) : null,
        // Store all original form data for complete functionality
        additionalSettings: {
          enableSkipLine: toBool(ticket.enableSkipLine),
          passwordProtect: toBool(ticket.passwordProtect),
          enableBundle: toBool(ticket.enableBundle),
          enableEarlyBird: toBool(ticket.enableEarlyBird),
          coverTicket: toBool(ticket.coverTicket),
          enableComboTickets: toBool(ticket.enableComboTickets),
          enableWaitlist: toBool(ticket.enableWaitlist),
          hideTicket: toBool(ticket.hideTicket),
          ticketPassword: ticket.ticketPassword || null,
          earlyBirdPrice: ticket.earlyBirdPrice && ticket.earlyBirdPrice !== '' ? parseFloat(ticket.earlyBirdPrice) : null,
          earlyBirdEndDate: processDateTime(ticket.earlyBirdEndDate),
          creditPrice: ticket.creditPrice && ticket.creditPrice !== '' ? parseFloat(ticket.creditPrice) : null,
          bundlePrice: ticket.bundlePrice && ticket.bundlePrice !== '' ? parseFloat(ticket.bundlePrice) : null,
          waitlistTicket: ticket.waitlistTicket || null,
          // Combo ticket fields  
          comboTitle: ticket.comboTitle && ticket.comboTitle !== '' ? ticket.comboTitle : null,
          comboTickets: ticket.comboTickets && ticket.comboTickets !== '' ? ticket.comboTickets : null,
          comboDiscount: ticket.comboDiscount && ticket.comboDiscount !== '' ? parseFloat(ticket.comboDiscount) : null
        }
      };
    }) : [];

    // Simple event creation without complex organization setup
    const eventData = {
      ...req.body,
      organizerId,
      // Ensure event dates are properly stored
      eventDate: req.body.eventDate || req.body.startDate,
      // Event-level password protection
      enableSkipLine: req.body.enableSkipLine || false,
      passwordProtect: req.body.passwordProtect || false,
      eventPassword: req.body.passwordProtect ? req.body.eventPassword : null,
      eventTime: req.body.eventTime || "18:00",
      eventEndDate: req.body.eventEndDate || req.body.endDate,
      eventEndTime: req.body.eventEndTime || "22:00",
      organizationId: organizerId, // Use organizer ID as organization ID for simplicity
      ticketTypes: processedTicketTypes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in MongoDB using the existing storage
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    // Insert event into MongoDB events collection
    const eventsCollection = mongoStorage.db.collection('events');
    const result = await eventsCollection.insertOne(eventData);

    const createdEvent = await eventsCollection.findOne({ _id: result.insertedId });
    res.status(201).json(createdEvent);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
});

// GET /api/organizer/events - Get organizer's events
router.get('/events', async (req, res) => {
  try {
    const organizerId = req.user._id;

    // Use MongoDB directly like the create endpoint
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    // Get events from MongoDB events collection
    const eventsCollection = mongoStorage.db.collection('events');
    const bookingsCollection = mongoStorage.db.collection('bookings');

    const events = await eventsCollection.find({ organizerId }).sort({ createdAt: -1 }).toArray();

    // Calculate revenue and registration counts for each event
    const eventsWithStats = await Promise.all(events.map(async (event) => {
      try {
        // Get bookings for this event - try multiple possible field names
        const bookings = await bookingsCollection.find({
          $or: [
            { eventId: event._id.toString() },
            { eventId: event._id },
            { eventTitle: event.title },
            { 'event._id': event._id },
            { 'event.id': event._id.toString() }
          ]
        }).toArray();

        // Calculate total revenue and registration count
        const totalRevenue = bookings.reduce((sum, booking) => {
          return sum + (booking.totalAmount || booking.amount || 0);
        }, 0);

        const totalRegistrations = bookings.length;

        // Add calculated stats to event
        return {
          ...event,
          revenue: totalRevenue,
          ticketsSold: totalRegistrations,
          registrations: totalRegistrations
        };
      } catch (error) {
        console.error(`Error calculating stats for event ${event._id}:`, error);
        // Return event with zero stats if calculation fails
        return {
          ...event,
          revenue: 0,
          ticketsSold: 0,
          registrations: 0
        };
      }
    }));

    res.json(eventsWithStats);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Failed to fetch events', error: error.message });
  }
});

// POST /api/organizer/events/:id/duplicate - Duplicate event
router.post('/events/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user._id;

    // Use MongoDB directly
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    const eventsCollection = mongoStorage.db.collection('events');
    const { ObjectId } = await import('mongodb');

    // Get the original event
    const originalEvent = await eventsCollection.findOne({
      _id: new ObjectId(id),
      organizerId: organizerId
    });

    if (!originalEvent) {
      return res.status(404).json({ message: 'Event not found or access denied' });
    }

    // Create duplicate event data
    const duplicateEventData = {
      ...originalEvent,
      _id: new ObjectId(), // Create new ID
      title: `${originalEvent.title} (Copy)`,
      status: 'draft', // Always start as draft
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create the duplicate event
    const result = await eventsCollection.insertOne(duplicateEventData);

    if (result.insertedId) {
      const duplicatedEvent = await eventsCollection.findOne({ _id: result.insertedId });
      res.json(duplicatedEvent);
    } else {
      res.status(500).json({ message: 'Failed to create duplicate event' });
    }
  } catch (error) {
    console.error('Duplicate event error:', error);
    res.status(500).json({ message: 'Failed to duplicate event', error: error.message });
  }
});

// GET /api/organizer/events/:id - Get specific event
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Use MongoDB directly
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    const eventsCollection = mongoStorage.db.collection('events');
    const { ObjectId } = await import('mongodb');
    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });

    if (event) {
      res.json(event);
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Failed to fetch event', error: error.message });
  }
});

// PUT /api/organizer/events/:id - Update event
router.put('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user._id;

    // Use MongoDB directly
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    const eventsCollection = mongoStorage.db.collection('events');
    const { ObjectId } = await import('mongodb');

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID format' });
    }

    // First check if event exists
    const existingEvent = await eventsCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!existingEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Process ticket types with additional settings if they exist
    const processedTicketTypes = req.body.ticketTypes ? req.body.ticketTypes.map(ticket => {
      // Helper function to properly convert boolean values
      const toBool = (value) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') return value === 'true' || value === '1';
        return Boolean(value);
      };

      // Helper function to handle datetime values
      const processDateTime = (dateValue) => {
        if (!dateValue || dateValue === '') return null;
        try {
          // If it's already a valid date string, return it
          const date = new Date(dateValue);
          return date.toISOString();
        } catch (error) {
          console.error('Invalid date format:', dateValue);
          return null;
        }
      };

      return {
        name: ticket.name || 'General Admission',
        description: ticket.description || 'Event ticket',
        price: parseFloat(ticket.price) || 0,
        quantity: parseInt(ticket.quantity) || 100,
        displayPrice: parseFloat(ticket.displayPrice) || parseFloat(ticket.price) || 0,
        maxCartQty: parseInt(ticket.maxCartQty) || 10,
        availability: ticket.availability || 'Available',
        isActive: ticket.isActive !== false,
        sold: ticket.sold || 0,
        saleStartDate: ticket.saleStartDate || new Date().toISOString(),
        saleEndDate: ticket.saleEndDate || req.body.endDate || new Date().toISOString(),
        // Advanced settings with proper boolean conversion
        enableSkipLine: toBool(ticket.enableSkipLine),
        passwordProtect: toBool(ticket.passwordProtect),
        enableBundle: toBool(ticket.enableBundle),
        enableEarlyBird: toBool(ticket.enableEarlyBird),
        coverTicket: toBool(ticket.coverTicket),
        enableComboTickets: toBool(ticket.enableComboTickets),
        enableWaitlist: toBool(ticket.enableWaitlist),
        hideTicket: toBool(ticket.hideTicket),
        bundlePrice: ticket.bundlePrice && ticket.bundlePrice !== '' ? parseFloat(ticket.bundlePrice) : null,
        waitlistTicket: ticket.waitlistTicket || null,
        perks: ticket.perks || [],
        // Additional dynamic fields with proper processing
        ticketPassword: ticket.ticketPassword || null,
        earlyBirdPrice: ticket.earlyBirdPrice && ticket.earlyBirdPrice !== '' ? parseFloat(ticket.earlyBirdPrice) : null,
        earlyBirdEndDate: processDateTime(ticket.earlyBirdEndDate),
        creditPrice: ticket.creditPrice && ticket.creditPrice !== '' ? parseFloat(ticket.creditPrice) : null,
        // Combo ticket fields  
        comboTitle: ticket.comboTitle && ticket.comboTitle !== '' ? ticket.comboTitle : null,
        comboTickets: ticket.comboTickets && ticket.comboTickets !== '' ? ticket.comboTickets : null,
        comboDiscount: ticket.comboDiscount && ticket.comboDiscount !== '' ? parseFloat(ticket.comboDiscount) : null,
        // Store all original form data for complete functionality
        additionalSettings: {
          enableSkipLine: toBool(ticket.enableSkipLine),
          passwordProtect: toBool(ticket.passwordProtect),
          enableBundle: toBool(ticket.enableBundle),
          enableEarlyBird: toBool(ticket.enableEarlyBird),
          coverTicket: toBool(ticket.coverTicket),
          enableComboTickets: toBool(ticket.enableComboTickets),
          enableWaitlist: toBool(ticket.enableWaitlist),
          hideTicket: toBool(ticket.hideTicket),
          ticketPassword: ticket.ticketPassword || null,
          earlyBirdPrice: ticket.earlyBirdPrice && ticket.earlyBirdPrice !== '' ? parseFloat(ticket.earlyBirdPrice) : null,
          earlyBirdEndDate: processDateTime(ticket.earlyBirdEndDate),
          creditPrice: ticket.creditPrice && ticket.creditPrice !== '' ? parseFloat(ticket.creditPrice) : null,
          bundlePrice: ticket.bundlePrice && ticket.bundlePrice !== '' ? parseFloat(ticket.bundlePrice) : null,
          waitlistTicket: ticket.waitlistTicket || null,
          // Combo ticket fields
          comboTitle: ticket.comboTitle || null,
          comboTickets: ticket.comboTickets || null,
          comboDiscount: ticket.comboDiscount && ticket.comboDiscount !== '' ? parseFloat(ticket.comboDiscount) : null
        }
      };
    }) : (req.body.ticketTypes || existingEvent.ticketTypes || []);

    const updateData = {
      ...req.body,
      ticketTypes: processedTicketTypes,
      updatedAt: new Date()
    };

    // Update data prepared

    // Check if organizer matches (handle both string and ObjectId cases)
    const organizerMatch = existingEvent.organizerId === organizerId ||
      existingEvent.organizerId === String(organizerId) ||
      String(existingEvent.organizerId) === String(organizerId);

    if (!organizerMatch) {
      return res.status(403).json({ message: 'Access denied - event belongs to different organizer' });
    }

    // Update the event
    const updateResult = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (updateResult.modifiedCount > 0 || updateResult.matchedCount > 0) {
      // Get the updated event
      const updatedEvent = await eventsCollection.findOne({
        _id: new ObjectId(id)
      });
      res.json(updatedEvent);
    } else {
      res.status(404).json({ message: 'Failed to update event' });
    }
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
});

// DELETE /api/organizer/events/:id - Delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user._id;

    // Use MongoDB directly
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    const eventsCollection = mongoStorage.db.collection('events');
    const { ObjectId } = await import('mongodb');

    // Only delete if event belongs to this organizer
    const result = await eventsCollection.deleteOne({
      _id: new ObjectId(id),
      organizerId: organizerId
    });

    if (result.deletedCount > 0) {
      res.json({ message: 'Event deleted successfully' });
    } else {
      res.status(404).json({ message: 'Event not found or access denied' });
    }
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
});

// POST /api/organizer/events/:id/submit - Submit event for admin approval
router.post('/events/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user._id;

    // Use MongoDB directly
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    const eventsCollection = mongoStorage.db.collection('events');
    const { ObjectId } = await import('mongodb');

    // Check if event belongs to this organizer
    const event = await eventsCollection.findOne({
      _id: new ObjectId(id),
      organizerId: organizerId
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found or access denied' });
    }

    // Only allow submission if event is in draft status
    if (event.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft events can be submitted for approval' });
    }

    const result = await eventsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: 'pending_approval', updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (result.value) {
      res.json(result.value);
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    console.error('Submit event error:', error);
    res.status(500).json({ message: 'Failed to submit event for approval', error: error.message });
  }
});

// PUT /api/organizer/events/:id - Update event
router.put('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.updateEvent(id, req.body);

    if (success) {
      const event = await organizerStorage.getEventById(id);
      res.json(event);
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// DELETE /api/organizer/events/:id - Delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.deleteEvent(id);

    if (success) {
      res.json({ message: 'Event deleted successfully' });
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// GET /api/organizer/events/stats - Get event statistics
router.get('/events/stats', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const stats = await organizerStorage.getEventStats(organizerId);
    res.json(stats);
  } catch (error) {
    console.error('Get event stats error:', error);
    res.status(500).json({ message: 'Failed to fetch event statistics' });
  }
});

// ==================== ATTENDEE MANAGEMENT ====================

// POST /api/organizer/attendees - Create attendee
router.post('/attendees', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const attendeeData = { ...req.body, organizerId };

    const attendee = await organizerStorage.createAttendee(attendeeData);
    res.status(201).json(attendee);
  } catch (error) {
    console.error('Create attendee error:', error);
    res.status(500).json({ message: 'Failed to create attendee' });
  }
});

// GET /api/organizer/attendees - Get all attendees
router.get('/attendees', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const attendees = await organizerStorage.getAttendeesByOrganizer(organizerId);
    res.json(attendees);
  } catch (error) {
    console.error('Get attendees error:', error);
    res.status(500).json({ message: 'Failed to fetch attendees' });
  }
});

// GET /api/organizer/events/:eventId/attendees - Get event attendees
router.get('/events/:eventId/attendees', async (req, res) => {
  try {
    const { eventId } = req.params;
    const attendees = await organizerStorage.getAttendeesByEvent(eventId);
    res.json(attendees);
  } catch (error) {
    console.error('Get event attendees error:', error);
    res.status(500).json({ message: 'Failed to fetch event attendees' });
  }
});

// PUT /api/organizer/attendees/:id - Update attendee
router.put('/attendees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.updateAttendee(id, req.body);

    if (success) {
      res.json({ message: 'Attendee updated successfully' });
    } else {
      res.status(404).json({ message: 'Attendee not found' });
    }
  } catch (error) {
    console.error('Update attendee error:', error);
    res.status(500).json({ message: 'Failed to update attendee' });
  }
});

// POST /api/organizer/attendees/:id/checkin - Check in attendee
router.post('/attendees/:id/checkin', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.checkInAttendee(id);

    if (success) {
      res.json({ message: 'Attendee checked in successfully' });
    } else {
      res.status(404).json({ message: 'Attendee not found' });
    }
  } catch (error) {
    console.error('Check in attendee error:', error);
    res.status(500).json({ message: 'Failed to check in attendee' });
  }
});

// ==================== MARKETING MANAGEMENT ====================

// POST /api/organizer/marketing/campaigns - Create marketing campaign
router.post('/marketing/campaigns', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const campaignData = { ...req.body, organizerId };

    const campaign = await organizerStorage.createMarketingCampaign(campaignData);
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create marketing campaign error:', error);
    res.status(500).json({ message: 'Failed to create marketing campaign' });
  }
});

// GET /api/organizer/marketing/campaigns - Get marketing campaigns
router.get('/marketing/campaigns', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const { eventId } = req.query;

    const campaigns = await organizerStorage.getMarketingCampaigns(organizerId, eventId);
    res.json(campaigns);
  } catch (error) {
    console.error('Get marketing campaigns error:', error);
    res.status(500).json({ message: 'Failed to fetch marketing campaigns' });
  }
});

// PUT /api/organizer/marketing/campaigns/:id - Update marketing campaign
router.put('/marketing/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.updateMarketingCampaign(id, req.body);

    if (success) {
      res.json({ message: 'Marketing campaign updated successfully' });
    } else {
      res.status(404).json({ message: 'Marketing campaign not found' });
    }
  } catch (error) {
    console.error('Update marketing campaign error:', error);
    res.status(500).json({ message: 'Failed to update marketing campaign' });
  }
});

// DELETE /api/organizer/marketing/campaigns/:id - Delete marketing campaign
router.delete('/marketing/campaigns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.deleteMarketingCampaign(id);

    if (success) {
      res.json({ message: 'Marketing campaign deleted successfully' });
    } else {
      res.status(404).json({ message: 'Marketing campaign not found' });
    }
  } catch (error) {
    console.error('Delete marketing campaign error:', error);
    res.status(500).json({ message: 'Failed to delete marketing campaign' });
  }
});

// ==================== AUDIENCE MANAGEMENT ====================

// POST /api/organizer/audience - Create audience member
router.post('/audience', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const audienceData = { ...req.body, organizerId };

    const audience = await organizerStorage.createAudienceMember(audienceData);
    res.status(201).json(audience);
  } catch (error) {
    console.error('Create audience member error:', error);
    res.status(500).json({ message: 'Failed to create audience member' });
  }
});

// GET /api/organizer/audience - Get audience members
router.get('/audience', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const filters = req.query;

    const audience = await organizerStorage.getAudience(organizerId, filters);
    res.json(audience);
  } catch (error) {
    console.error('Get audience error:', error);
    res.status(500).json({ message: 'Failed to fetch audience' });
  }
});

// PUT /api/organizer/audience/:id - Update audience member
router.put('/audience/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.updateAudienceMember(id, req.body);

    if (success) {
      res.json({ message: 'Audience member updated successfully' });
    } else {
      res.status(404).json({ message: 'Audience member not found' });
    }
  } catch (error) {
    console.error('Update audience member error:', error);
    res.status(500).json({ message: 'Failed to update audience member' });
  }
});

// DELETE /api/organizer/audience/:id - Delete audience member
router.delete('/audience/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.deleteAudienceMember(id);

    if (success) {
      res.json({ message: 'Audience member deleted successfully' });
    } else {
      res.status(404).json({ message: 'Audience member not found' });
    }
  } catch (error) {
    console.error('Delete audience member error:', error);
    res.status(500).json({ message: 'Failed to delete audience member' });
  }
});

// GET /api/organizer/audience/stats - Get audience statistics
router.get('/audience/stats', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const stats = await organizerStorage.getAudienceStats(organizerId);
    res.json(stats);
  } catch (error) {
    console.error('Get audience stats error:', error);
    res.status(500).json({ message: 'Failed to fetch audience statistics' });
  }
});

// ==================== FINANCIAL MANAGEMENT ====================

// POST /api/organizer/finances/payouts - Create payout request
router.post('/finances/payouts', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const payoutData = { ...req.body, organizerId };

    const payout = await organizerStorage.createPayout(payoutData);
    res.status(201).json(payout);
  } catch (error) {
    console.error('Create payout error:', error);
    res.status(500).json({ message: 'Failed to create payout request' });
  }
});

// GET /api/organizer/finances/payouts - Get payouts
router.get('/finances/payouts', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const { status } = req.query;

    const payouts = await organizerStorage.getPayouts(organizerId, status);
    res.json(payouts);
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({ message: 'Failed to fetch payouts' });
  }
});

// GET /api/organizer/finances/transactions - Get transaction history
router.get('/finances/transactions', async (req, res) => {
  try {
    const organizerId = req.user._id.toString();
    const { status, startDate, endDate } = req.query;

    await organizerStorage.connect();
    const { ObjectId } = await import('mongodb');

    // Get organizer's events
    const eventsCollection = organizerStorage.db.collection('events');
    const organizerEvents = await eventsCollection.find({
      $or: [
        { organizerId: organizerId },
        { organizationId: organizerId },
        { organizerId: new ObjectId(organizerId) },
        { organizationId: new ObjectId(organizerId) }
      ]
    }).toArray();

    const eventIds = organizerEvents.map(event => event._id.toString());

    // Get bookings for these events
    const bookingsCollection = organizerStorage.db.collection('bookings');
    let filter = {
      eventId: { $in: eventIds }
    };

    // Apply status filter if provided
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Apply date filter if provided
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await bookingsCollection.find(filter).sort({ createdAt: -1 }).toArray();

    // Format transactions for frontend
    const transactions = bookings.map(booking => {
      const event = organizerEvents.find(e => e._id.toString() === booking.eventId);
      return {
        id: booking._id,
        type: 'payment',
        description: `Ticket sale - ${event ? event.title : 'Unknown Event'}`,
        amount: parseFloat(booking.totalAmount || booking.amount) || 0,
        status: booking.status,
        date: booking.createdAt || booking.bookingDate,
        customer: booking.userName || 'Unknown',
        customerEmail: booking.userEmail,
        paymentMethod: booking.paymentIntentId ? 'Stripe' : 'Unknown',
        currency: booking.currency || 'USD',
        bookingId: booking.bookingId,
        paymentIntentId: booking.paymentIntentId,
        eventName: event ? event.title : 'Unknown Event',
        ticketType: booking.ticketDetails && booking.ticketDetails[0] ?
          booking.ticketDetails[0].type : 'General Admission'
      };
    });

    res.json({
      success: true,
      transactions: transactions,
      total: transactions.length,
      summary: {
        totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        confirmedTransactions: transactions.filter(t => t.status === 'confirmed').length,
        pendingTransactions: transactions.filter(t => t.status === 'pending').length,
        cancelledTransactions: transactions.filter(t => t.status === 'cancelled').length
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// POST /api/organizer/withdrawals - Create withdrawal request with payment gateway integration
router.post('/withdrawals', async (req, res) => {
  try {
    const organizerId = req.user._id.toString();
    const { amount, type, reason, bankDetails, method } = req.body;

    // Validate request
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.routingNumber ||
      !bankDetails.accountHolderName || !bankDetails.bankName) {
      return res.status(400).json({ message: 'Complete bank details are required' });
    }

    await organizerStorage.connect();
    const { ObjectId } = await import('mongodb');

    // Generate reference number
    const referenceNumber = `WD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create withdrawal record
    const withdrawal = {
      _id: new ObjectId(),
      organizerId: new ObjectId(organizerId),
      amount: parseFloat(amount),
      type: type, // 'immediate' or 'pending'
      reason: reason || '',
      bankDetails: {
        accountNumber: bankDetails.accountNumber,
        routingNumber: bankDetails.routingNumber,
        accountHolderName: bankDetails.accountHolderName,
        bankName: bankDetails.bankName
      },
      method: method || 'bank_transfer',
      status: type === 'immediate' ? 'processing' : 'pending_approval',
      referenceNumber: referenceNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentGateway: {
        provider: 'stripe', // Integration ready
        status: 'initialized',
        transactionId: null
      }
    };

    // For immediate withdrawals (80%), integrate with payment gateway
    if (type === 'immediate') {
      try {
        // Stripe Transfer Integration (dummy implementation ready for real keys)
        const stripeTransfer = {
          id: `tr_${Math.random().toString(36).substr(2, 24)}`, // Mock Stripe transfer ID
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          destination: `acct_${Math.random().toString(36).substr(2, 16)}`, // Mock account
          status: 'pending'
        };

        withdrawal.paymentGateway.transactionId = stripeTransfer.id;
        withdrawal.paymentGateway.status = 'pending';
        withdrawal.stripeTransferId = stripeTransfer.id;

        console.log(`[Payment Gateway] Initiated Stripe transfer: ${stripeTransfer.id} for $${amount}`);
      } catch (paymentError) {
        console.error('Payment gateway error:', paymentError);
        withdrawal.status = 'failed';
        withdrawal.paymentGateway.status = 'failed';
        withdrawal.paymentGateway.error = paymentError.message;
      }
    }

    // Save withdrawal request
    const withdrawalsCollection = organizerStorage.db.collection('withdrawals');
    await withdrawalsCollection.insertOne(withdrawal);

    // Update organizer's requested earnings
    const earningsCollection = organizerStorage.db.collection('earnings');
    await earningsCollection.updateOne(
      { organizerId: new ObjectId(organizerId) },
      {
        $inc: { requestedEarnings: parseFloat(amount) },
        $set: { lastWithdrawalAt: new Date() }
      },
      { upsert: true }
    );

    console.log(`[Withdrawal] Created ${type} withdrawal request: ${referenceNumber} for $${amount}`);

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      referenceNumber: referenceNumber,
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        type: withdrawal.type,
        status: withdrawal.status,
        referenceNumber: withdrawal.referenceNumber,
        estimatedProcessingTime: type === 'immediate' ? '1-3 business days' : '5-7 business days (pending approval)'
      }
    });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({
      message: 'Failed to create withdrawal request',
      error: error.message
    });
  }
});

// POST /api/organizer/withdraw-immediate - Process immediate 80% withdrawal
router.post('/withdraw-immediate', async (req, res) => {
  try {
    const organizerId = req.user._id.toString();
    const { amount, type } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    if (type !== 'immediate') {
      return res.status(400).json({ message: 'This endpoint only handles immediate withdrawals' });
    }

    await organizerStorage.connect();
    const { ObjectId } = await import('mongodb');

    // Verify user has sufficient immediate earnings
    const earningsCollection = organizerStorage.db.collection('earnings');
    const earningsDoc = await earningsCollection.findOne({ organizerId: new ObjectId(organizerId) });

    if (!earningsDoc || (earningsDoc.immediateEarnings || 0) < amount) {
      return res.status(400).json({
        message: 'Insufficient immediate earnings balance'
      });
    }

    // Create completed payout record immediately
    const payoutsCollection = organizerStorage.db.collection('payouts');
    const payoutRecord = {
      organizerId: new ObjectId(organizerId),
      amount: parseFloat(amount),
      status: 'completed',
      method: 'instant_transfer',
      description: `Immediate withdrawal of 80% earnings`,
      type: 'immediate',
      createdAt: new Date(),
      processedAt: new Date(),
      referenceNumber: `IMM-${Date.now()}-${organizerId.slice(-6)}`
    };

    await payoutsCollection.insertOne(payoutRecord);

    // Update earnings - subtract from immediate earnings and add to paid earnings
    await earningsCollection.updateOne(
      { organizerId: new ObjectId(organizerId) },
      {
        $inc: {
          immediateEarnings: -parseFloat(amount),
          paidEarnings: parseFloat(amount)
        },
        $set: { lastWithdrawalAt: new Date() }
      }
    );

    console.log(`[Immediate Withdrawal] Processed $${amount} for organizer ${organizerId}`);

    res.json({
      success: true,
      message: 'Immediate withdrawal processed successfully!',
      payout: {
        id: payoutRecord._id,
        amount: payoutRecord.amount,
        status: payoutRecord.status,
        referenceNumber: payoutRecord.referenceNumber,
        processedAt: payoutRecord.processedAt
      }
    });

  } catch (error) {
    console.error('Immediate withdrawal error:', error);
    res.status(500).json({
      message: 'Failed to process immediate withdrawal',
      error: error.message
    });
  }
});

// PUT /api/organizer/finances/payouts/:id/status - Update payout status
router.put('/finances/payouts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, ...additionalData } = req.body;

    const success = await organizerStorage.updatePayoutStatus(id, status, additionalData);

    if (success) {
      res.json({ message: 'Payout status updated successfully' });
    } else {
      res.status(404).json({ message: 'Payout not found' });
    }
  } catch (error) {
    console.error('Update payout status error:', error);
    res.status(500).json({ message: 'Failed to update payout status' });
  }
});

// GET /api/organizer/finances/summary - Get financial summary
router.get('/finances/summary', async (req, res) => {
  try {
    const organizerId = req.user._id.toString();
    const { startDate, endDate } = req.query;

    await organizerStorage.connect();
    const { ObjectId } = await import('mongodb');

    // Get organizer's events
    const eventsCollection = organizerStorage.db.collection('events');
    const organizerEvents = await eventsCollection.find({
      $or: [
        { organizerId: organizerId },
        { organizationId: organizerId },
        { organizerId: new ObjectId(organizerId) },
        { organizationId: new ObjectId(organizerId) }
      ]
    }).toArray();

    const eventIds = organizerEvents.map(event => event._id.toString());

    // Get confirmed bookings for these events
    const bookingsCollection = organizerStorage.db.collection('bookings');
    let filter = {
      eventId: { $in: eventIds },
      status: 'confirmed'
    };

    // Apply date filter if provided
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const confirmedBookings = await bookingsCollection.find(filter).toArray();

    // Calculate totals
    let totalRevenue = 0;
    let totalTicketsSold = 0;

    confirmedBookings.forEach(booking => {
      const amount = parseFloat(booking.totalAmount || booking.amount) || 0;
      totalRevenue += amount;

      // Count tickets from ticket details
      if (booking.ticketDetails && Array.isArray(booking.ticketDetails)) {
        booking.ticketDetails.forEach(ticket => {
          totalTicketsSold += parseInt(ticket.quantity) || 1;
        });
      } else {
        totalTicketsSold += 1; // Default to 1 if no ticket details
      }
    });

    // Calculate 80/20 split like in earnings
    const immediateRevenue = totalRevenue * 0.8; // 80% immediate
    const pendingRevenue = totalRevenue * 0.2;   // 20% pending

    // Get withdrawal requests
    const withdrawalRequestsCollection = organizerStorage.db.collection('withdrawal_requests');
    const withdrawalRequests = await withdrawalRequestsCollection.find({
      organizationId: new ObjectId(organizerId)
    }).toArray();

    let availableBalance = immediateRevenue;
    let pendingBalance = pendingRevenue;
    let platformFees = 0; // No platform fees for simplicity

    withdrawalRequests.forEach(request => {
      if (request.status === 'pending') {
        // Reduce available balance by pending requests
        availableBalance -= parseFloat(request.requestedAmount) || 0;
      }
    });

    const summary = {
      events: {
        _id: null,
        totalRevenue: totalRevenue,
        totalTicketsSold: totalTicketsSold,
        totalPlatformFees: platformFees,
        totalProcessingFees: 0
      },
      financials: {
        totalRevenue: totalRevenue,
        availableBalance: Math.max(0, availableBalance),
        pendingRevenue: pendingBalance,
        platformFees: platformFees
      },
      bookings: {
        total: confirmedBookings.length,
        confirmed: confirmedBookings.length,
        pending: 0,
        cancelled: 0
      },
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    };

    res.json(summary);
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({ message: 'Failed to fetch financial summary' });
  }
});

// ==================== DISPUTE MANAGEMENT ====================

// GET /api/organizer/disputes - Get organizer disputes and stats
router.get('/disputes', async (req, res) => {
  try {
    const organizerId = req.user._id.toString();
    const { status } = req.query;

    await organizerStorage.connect();
    const { ObjectId } = await import('mongodb');

    // Get organizer's events to find disputed bookings
    const eventsCollection = organizerStorage.db.collection('events');
    const organizerEvents = await eventsCollection.find({
      $or: [
        { organizerId: organizerId },
        { organizationId: organizerId },
        { organizerId: new ObjectId(organizerId) },
        { organizationId: new ObjectId(organizerId) }
      ]
    }).toArray();

    const eventIds = organizerEvents.map(event => event._id.toString());

    // Get disputed bookings (bookings with status 'disputed' or 'chargeback')
    const bookingsCollection = organizerStorage.db.collection('bookings');
    const filter = {
      eventId: { $in: eventIds },
      status: { $in: ['disputed', 'chargeback', 'refund_requested'] }
    };

    if (status && status !== 'All') {
      if (status === 'Need Response') {
        filter.disputeStatus = 'pending_response';
      } else if (status === 'In Review') {
        filter.disputeStatus = 'under_review';
      } else if (status === 'Won') {
        filter.disputeStatus = 'won';
      } else if (status === 'Lost') {
        filter.disputeStatus = 'lost';
      }
    }

    const disputes = await bookingsCollection.find(filter).sort({ createdAt: -1 }).toArray();

    // Calculate dispute stats
    const allDisputes = await bookingsCollection.find({
      eventId: { $in: eventIds },
      status: { $in: ['disputed', 'chargeback', 'refund_requested'] }
    }).toArray();

    const totalTransactions = await bookingsCollection.countDocuments({
      eventId: { $in: eventIds },
      status: 'confirmed'
    });

    const needResponse = allDisputes.filter(d => d.disputeStatus === 'pending_response' || !d.disputeStatus).length;
    const disputeRate = totalTransactions > 0 ? ((allDisputes.length / totalTransactions) * 100).toFixed(1) : 0;
    const wonDisputes = allDisputes.filter(d => d.disputeStatus === 'won').length;
    const winRate = allDisputes.length > 0 ? ((wonDisputes / allDisputes.length) * 100).toFixed(1) : 0;
    const moneyOnHold = allDisputes.reduce((sum, d) => sum + (parseFloat(d.totalAmount || d.amount) || 0), 0);

    const stats = {
      needResponse,
      disputeRate: `${disputeRate}%`,
      moneyOnHold: `â‚¹ ${moneyOnHold.toFixed(2)}`,
      winRate: `${winRate}%`
    };

    // Format disputes for frontend
    const formattedDisputes = disputes.map(dispute => {
      const event = organizerEvents.find(e => e._id.toString() === dispute.eventId);
      return {
        id: dispute._id,
        customer: dispute.userName || 'Unknown Customer',
        customerEmail: dispute.userEmail,
        orderName: event ? event.title : 'Unknown Event',
        amount: `$${(parseFloat(dispute.totalAmount || dispute.amount) || 0).toFixed(2)}`,
        disputeDate: new Date(dispute.updatedAt || dispute.createdAt).toLocaleDateString(),
        evidenceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 7 days from now
        status: dispute.disputeStatus || (dispute.status === 'disputed' ? 'Under Review' : 'Pending'),
        bookingId: dispute.bookingId,
        paymentIntentId: dispute.paymentIntentId
      };
    });

    res.json({
      success: true,
      disputes: formattedDisputes,
      stats
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({
      message: 'Failed to fetch disputes',
      error: error.message
    });
  }
});

// POST /api/organizer/disputes/:id/respond - Respond to a dispute
router.post('/disputes/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    const { response, evidence } = req.body;

    await organizerStorage.connect();
    const { ObjectId } = await import('mongodb');

    const bookingsCollection = organizerStorage.db.collection('bookings');
    const result = await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          disputeStatus: 'under_review',
          disputeResponse: response,
          disputeEvidence: evidence,
          disputeResponseDate: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    res.json({
      success: true,
      message: 'Dispute response submitted successfully'
    });
  } catch (error) {
    console.error('Respond to dispute error:', error);
    res.status(500).json({
      message: 'Failed to respond to dispute',
      error: error.message
    });
  }
});

// ==================== TEAM MANAGEMENT ====================

// POST /api/organizer/team - Create team member
router.post('/team', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const memberData = { ...req.body, organizerId };

    const member = await organizerStorage.createTeamMember(memberData);
    res.status(201).json(member);
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({ message: 'Failed to create team member' });
  }
});

// GET /api/organizer/team - Get team members
router.get('/team', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const members = await organizerStorage.getTeamMembers(organizerId);
    res.json(members);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ message: 'Failed to fetch team members' });
  }
});

// PUT /api/organizer/team/:id - Update team member
router.put('/team/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.updateTeamMember(id, req.body);

    if (success) {
      res.json({ message: 'Team member updated successfully' });
    } else {
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ message: 'Failed to update team member' });
  }
});

// DELETE /api/organizer/team/:id - Delete team member
router.delete('/team/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.deleteTeamMember(id);

    if (success) {
      res.json({ message: 'Team member deleted successfully' });
    } else {
      res.status(404).json({ message: 'Team member not found' });
    }
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ message: 'Failed to delete team member' });
  }
});

// ==================== BOOKINGS ====================

// GET /api/organizer/bookings - Get all bookings for organizer's events
router.get('/bookings', async (req, res) => {
  try {
    const organizerId = req.user._id;

    // Use MongoDB directly
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    const eventsCollection = mongoStorage.db.collection('events');
    const bookingsCollection = mongoStorage.db.collection('bookings');
    const usersCollection = mongoStorage.db.collection('users');

    // Get all events for this organizer
    const events = await eventsCollection.find({ organizerId }).toArray();
    const eventIds = events.map(event => event._id.toString());

    if (eventIds.length === 0) {
      return res.json([]);
    }

    // Get all bookings for these events - SORT BY LATEST FIRST
    const bookings = await bookingsCollection.find({
      eventId: { $in: eventIds }
    }).sort({ createdAt: -1, bookingDate: -1 }).toArray();

    // Get unique user emails from bookings
    const userEmails = [...new Set(bookings.map(booking => booking.userEmail).filter(Boolean))];

    // Fetch user details
    const users = await usersCollection.find({
      email: { $in: userEmails }
    }).toArray();

    // Create a map for quick user lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user.email] = user;
    });

    // Enrich bookings with event and user information
    const enrichedBookings = bookings.map(booking => {
      const event = events.find(e => e._id.toString() === booking.eventId);
      const user = userMap[booking.userEmail];

      return {
        ...booking,
        // Event details
        eventTitle: event ? event.title : 'Unknown Event',
        eventDate: event ? event.startDate : null,
        eventLocation: event ? (event.location || event.venue) : null,
        eventImage: event ? event.image : null,

        // User details
        user: user ? {
          name: user.name || user.firstName + ' ' + user.lastName || 'Unknown User',
          email: user.email,
          phone: user.phone || 'N/A',
          profileImage: user.profileImage || user.avatar || null,
          firstName: user.firstName || '',
          lastName: user.lastName || ''
        } : {
          name: booking.userName || 'Unknown User',
          email: booking.userEmail || 'N/A',
          phone: 'N/A',
          profileImage: null,
          firstName: '',
          lastName: ''
        },

        // Additional booking details
        ticketDetails: booking.ticketDetails || [],
        customerName: booking.userName || (user ? user.name : 'Unknown User'),
        customerEmail: booking.userEmail,
        customerPhone: user ? user.phone : booking.customerPhone || 'N/A'
      };
    });

    res.json(enrichedBookings);
  } catch (error) {
    console.error('Get organizer bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

// GET /api/organizer/bookings/:bookingId - Get specific booking details
router.get('/bookings/:bookingId', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const { bookingId } = req.params;

    // Use MongoDB directly
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    const { ObjectId } = await import('mongodb');
    const eventsCollection = mongoStorage.db.collection('events');
    const bookingsCollection = mongoStorage.db.collection('bookings');
    const usersCollection = mongoStorage.db.collection('users');

    // Get the booking
    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId)
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify that this booking belongs to an event created by this organizer
    const event = await eventsCollection.findOne({
      _id: new ObjectId(booking.eventId),
      organizerId: organizerId
    });

    if (!event) {
      return res.status(403).json({ message: 'Access denied to this booking' });
    }

    // Get user details
    const user = await usersCollection.findOne({
      email: booking.userEmail
    });

    // Enrich booking with complete information
    const enrichedBooking = {
      ...booking,
      // Event details
      event: {
        title: event.title,
        date: event.startDate,
        endDate: event.endDate,
        location: event.location || event.venue,
        address: event.address,
        image: event.image,
        description: event.description,
        category: event.category
      },

      // User details
      user: user ? {
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
        email: user.email,
        phone: user.phone || 'N/A',
        profileImage: user.profileImage || user.avatar || null,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        dateJoined: user.createdAt || user.dateJoined || null
      } : {
        name: booking.userName || 'Unknown User',
        email: booking.userEmail || 'N/A',
        phone: 'N/A',
        profileImage: null,
        firstName: '',
        lastName: '',
        dateJoined: null
      },

      // Ticket details
      tickets: booking.ticketDetails || [],

      // Payment details
      payment: {
        status: booking.paymentStatus,
        method: booking.paymentMethod || 'Unknown',
        transactionId: booking.transactionId || booking.paymentId || 'N/A',
        amount: booking.totalAmount || booking.amount,
        currency: booking.currency || 'USD',
        processingFee: booking.processingFee || 0,
        netAmount: (booking.totalAmount || booking.amount) - (booking.processingFee || 0)
      }
    };

    res.json(enrichedBooking);
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({ message: 'Failed to fetch booking details', error: error.message });
  }
});

// ==================== ANALYTICS ====================

// POST /api/organizer/analytics - Create analytics entry
router.post('/analytics', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const analyticsData = { ...req.body, organizerId };

    const analytics = await organizerStorage.createAnalyticsEntry(analyticsData);
    res.status(201).json(analytics);
  } catch (error) {
    console.error('Create analytics entry error:', error);
    res.status(500).json({ message: 'Failed to create analytics entry' });
  }
});

// GET /api/organizer/analytics - Get analytics data
router.get('/analytics', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const { eventId, startDate, endDate } = req.query;

    const dateRange = startDate && endDate ? { startDate, endDate } : null;
    const analytics = await organizerStorage.getAnalytics(organizerId, eventId, dateRange);

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// GET /api/organizer/analytics/summary - Get analytics summary
router.get('/analytics/summary', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const { eventId } = req.query;

    const summary = await organizerStorage.getAnalyticsSummary(organizerId, eventId);
    res.json(summary);
  } catch (error) {
    console.error('Get analytics summary error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics summary' });
  }
});

// ==================== SUPPORT CENTER ====================

// POST /api/organizer/support - Create support ticket
router.post('/support', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const ticketData = { ...req.body, organizerId };

    const ticket = await organizerStorage.createSupportTicket(ticketData);
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ message: 'Failed to create support ticket' });
  }
});

// GET /api/organizer/support - Get support tickets
router.get('/support', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const { status } = req.query;

    const tickets = await organizerStorage.getSupportTickets(organizerId, status);
    res.json(tickets);
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ message: 'Failed to fetch support tickets' });
  }
});

// PUT /api/organizer/support/:id - Update support ticket
router.put('/support/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.updateSupportTicket(id, req.body);

    if (success) {
      res.json({ message: 'Support ticket updated successfully' });
    } else {
      res.status(404).json({ message: 'Support ticket not found' });
    }
  } catch (error) {
    console.error('Update support ticket error:', error);
    res.status(500).json({ message: 'Failed to update support ticket' });
  }
});

// POST /api/organizer/support/:id/messages - Add support message
router.post('/support/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const senderId = req.user._id;
    const message = { ...req.body, sender: senderId };

    const success = await organizerStorage.addSupportMessage(id, message);

    if (success) {
      res.json({ message: 'Support message added successfully' });
    } else {
      res.status(404).json({ message: 'Support ticket not found' });
    }
  } catch (error) {
    console.error('Add support message error:', error);
    res.status(500).json({ message: 'Failed to add support message' });
  }
});

// ==================== SAMPLE DATA GENERATION ====================

// POST /api/organizer/sample-data/generate - Generate sample data
router.post('/sample-data/generate', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const { organizationId } = req.body;

    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const result = await sampleDataService.generateSampleData(organizerId, organizationId);
    res.json(result);
  } catch (error) {
    console.error('Generate sample data error:', error);
    res.status(500).json({ message: 'Failed to generate sample data' });
  }
});

// POST /api/organizer/sample-data/clear - Clear all data
router.post('/sample-data/clear', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const result = await sampleDataService.clearAllData(organizerId);
    res.json(result);
  } catch (error) {
    console.error('Clear sample data error:', error);
    res.status(500).json({ message: 'Failed to clear sample data' });
  }
});

// PUT /api/organizer/profile - Update current user profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, contactNumber, location, organizationName, instagramUsername, profileColor } = req.body;

    // Import and connect to MongoDB following the same pattern as other routes
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();

    const usersCollection = mongoStorage.db.collection('auth_users');

    const updateData = {
      firstName,
      lastName,
      contactNumber,
      location,
      organizationName,
      instagramUsername,
      profileColor,
      updatedAt: new Date()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { ObjectId } = await import('mongodb');
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get updated user data
    const updatedUser = await usersCollection.findOne({ _id: new ObjectId(userId) });

    // Remove sensitive data
    const userResponse = {
      _id: updatedUser._id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      contactNumber: updatedUser.contactNumber,
      location: updatedUser.location,
      organizationName: updatedUser.organizationName,
      instagramUsername: updatedUser.instagramUsername,
      profileColor: updatedUser.profileColor,
      role: updatedUser.role
    };

    res.json({
      message: 'Profile updated successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// GET /api/organizer/earnings - Get organizer earnings with payout split
router.get('/earnings', async (req, res) => {
  try {
    const organizerId = req.user._id.toString();
    console.log('[Earnings] Calculating for organizer:', organizerId);

    await organizerStorage.connect();
    const { ObjectId } = await import('mongodb');

    // Get organizer's events - check both organizerId and organizationId fields
    const eventsCollection = organizerStorage.db.collection('events');
    const organizerEvents = await eventsCollection.find({
      $or: [
        { organizerId: organizerId },
        { organizationId: organizerId },
        { organizerId: new ObjectId(organizerId) },
        { organizationId: new ObjectId(organizerId) }
      ]
    }).toArray();

    console.log('[Earnings] Found events:', organizerEvents.length);

    // Get confirmed bookings for these events
    const bookingsCollection = organizerStorage.db.collection('bookings');
    let confirmedBookings = [];

    if (organizerEvents.length > 0) {
      const eventIds = organizerEvents.map(event => event._id.toString());
      confirmedBookings = await bookingsCollection.find({
        eventId: { $in: eventIds },
        status: 'confirmed'
      }).toArray();
    }

    console.log('[Earnings] Found confirmed bookings:', confirmedBookings.length);

    // Calculate totals from actual booking data
    let totalRevenue = 0;
    let totalTransactions = 0;

    confirmedBookings.forEach(booking => {
      const amount = parseFloat(booking.totalAmount || booking.amount) || 0;
      if (amount > 0) {
        totalRevenue += amount;
        totalTransactions++;
      }
    });

    console.log('[Earnings] Total revenue:', totalRevenue);

    // Calculate 80/20 split (no platform fee for simplicity)
    const immediateEarnings = totalRevenue * 0.8; // 80% immediate
    const pendingEarnings = totalRevenue * 0.2;   // 20% pending for withdrawal

    // Get withdrawal requests
    const withdrawalRequestsCollection = organizerStorage.db.collection('withdrawal_requests');
    const withdrawalRequests = await withdrawalRequestsCollection.find({
      organizationId: new ObjectId(organizerId)
    }).toArray();

    let requestedEarnings = 0;
    let paidEarnings = 0;
    let totalWithdrawals = 0;

    withdrawalRequests.forEach(request => {
      const amount = parseFloat(request.requestedAmount) || 0;
      if (request.status === 'pending') {
        requestedEarnings += amount;
      } else if (request.status === 'approved' || request.status === 'processed') {
        paidEarnings += amount;
        totalWithdrawals++;
      }
    });

    const availableForWithdrawal = Math.max(0, pendingEarnings - requestedEarnings);

    const earnings = {
      totalEarnings: totalRevenue,
      immediateEarnings: immediateEarnings,
      pendingEarnings: pendingEarnings,
      requestedEarnings: requestedEarnings,
      paidEarnings: paidEarnings,
      availableForWithdrawal: availableForWithdrawal,
      totalTransactions: totalTransactions,
      totalWithdrawals: totalWithdrawals,
      averageTransactionAmount: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
      lastTransactionAt: confirmedBookings.length > 0 ?
        new Date(Math.max(...confirmedBookings.map(b => new Date(b.createdAt || b.bookingDate).getTime()))) : null,
      lastWithdrawalAt: withdrawalRequests.length > 0 ?
        new Date(Math.max(...withdrawalRequests.map(r => new Date(r.createdAt).getTime()))) : null
    };

    console.log('[Earnings] Final calculated earnings:', earnings);

    res.json({
      success: true,
      earnings: earnings
    });
  } catch (error) {
    console.error('Get organizer earnings error:', error);
    res.status(500).json({
      message: 'Failed to fetch earnings',
      error: error.message
    });
  }
});

// GET /api/organizer/withdrawal-requests - Get organizer withdrawal requests
router.get('/withdrawal-requests', async (req, res) => {
  try {
    const organizerId = req.user._id.toString();
    const { status } = req.query;

    await organizerStorage.connect();
    const { ObjectId } = await import('mongodb');

    const withdrawalRequestsCollection = organizerStorage.db.collection('withdrawal_requests');
    const filter = { organizationId: new ObjectId(organizerId) };
    if (status) {
      filter.status = status;
    }

    const requests = await withdrawalRequestsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error('Get withdrawal requests error:', error);
    res.status(500).json({
      message: 'Failed to fetch withdrawal requests',
      error: error.message
    });
  }
});

// POST /api/organizer/withdrawal-request - Create withdrawal request
router.post('/withdrawal-request', async (req, res) => {
  try {
    const organizerId = req.user._id.toString();
    const { requestedAmount, requestReason, bankDetails } = req.body;

    await organizerStorage.connect();
    const { ObjectId } = await import('mongodb');

    const withdrawalRequest = {
      organizationId: new ObjectId(organizerId),
      organizerId: organizerId,
      requestedAmount: parseFloat(requestedAmount),
      requestReason: requestReason,
      bankDetails: bankDetails,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const withdrawalRequestsCollection = organizerStorage.db.collection('withdrawal_requests');
    const result = await withdrawalRequestsCollection.insertOne(withdrawalRequest);

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully',
      request: { ...withdrawalRequest, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Create withdrawal request error:', error);
    res.status(500).json({
      message: 'Failed to create withdrawal request',
      error: error.message
    });
  }
});

// ==================== SUPPORT TICKET SYSTEM ====================

// GET /api/organizer/support/tickets - Get organizer's support tickets
router.get('/support/tickets', async (req, res) => {
  try {
    const organizerId = req.user._id.toString();
    const { status } = req.query;
    const { mongoStorage } = await import('../mongodb-storage.js');
    const tickets = await mongoSupportTicketService.getOrganizerTickets(organizerId, status, mongoStorage);
    res.json(tickets);
  } catch (error) {
    console.error('Get organizer tickets error:', error);
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

// POST /api/organizer/support/tickets - Create new support ticket
router.post('/support/tickets', async (req, res) => {
  try {
    const organizerId = req.user._id.toString();
    const { title, description, priority = 'medium', category = 'general' } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const organizerName = req.user.firstName && req.user.lastName
      ? `${req.user.firstName} ${req.user.lastName}`
      : req.user.organizationName || req.user.email || 'Unknown';

    const ticketData = {
      organizerId,
      organizerEmail: req.user.email,
      organizerName,
      title: title.trim(),
      description: description.trim(),
      priority,
      category
    };

    const { mongoStorage } = await import('../mongodb-storage.js');
    const ticket = await mongoSupportTicketService.createTicket(ticketData, mongoStorage);

    // Send real-time notification to admins about new ticket
    try {
      const { pusherService } = await import('../services/pusherService.js');
      console.log(`[Pusher] Sending new ticket notification for ticket: ${ticket.ticketNumber}`);

      await pusherService.notifyAdmin({
        type: 'new_ticket',
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        organizerName: ticket.organizerName,
        priority: ticket.priority,
        message: `New support ticket created by ${ticket.organizerName}`
      });

      // Update ticket counters for admin dashboard
      console.log(`[Pusher] Sending counter update notification`);
      await pusherService.updateTicketCounters();
      console.log(`[Pusher] Notifications sent successfully`);
    } catch (pusherError) {
      console.error('[Pusher] Error sending notifications:', pusherError);
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create organizer ticket error:', error);
    res.status(500).json({ message: 'Failed to create ticket' });
  }
});

// GET /api/organizer/support/tickets/:id - Get specific ticket with messages
router.get('/support/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user._id.toString();
    const { mongoStorage } = await import('../mongodb-storage.js');
    const result = await mongoSupportTicketService.getTicketById(id, mongoStorage);

    res.json(result);
  } catch (error) {
    console.error('Get organizer ticket details error:', error);
    if (error.message === 'Access denied') {
      res.status(403).json({ message: 'Access denied' });
    } else {
      res.status(500).json({ message: 'Failed to fetch ticket details' });
    }
  }
});

// POST /api/organizer/support/tickets/:id/messages - Add message to ticket
router.post('/support/tickets/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const organizerName = req.user.firstName && req.user.lastName
      ? `${req.user.firstName} ${req.user.lastName}`
      : req.user.organizationName || req.user.email || 'Organizer';

    const messageData = {
      ticketId: id,
      senderId: req.user._id.toString(),
      senderName: organizerName,
      senderType: 'organizer',
      message: message.trim(),
      messageType: 'text',
      isInternal: false
    };

    const { mongoStorage } = await import('../mongodb-storage.js');
    const result = await mongoSupportTicketService.addMessage(id, messageData, mongoStorage);

    // Send WebSocket notification for real-time updates  
    try {
      if (global.broadcastMessage) {
        // Get ticket details to get ticket number
        const ticket = await mongoSupportTicketService.getTicketById(id, mongoStorage);
        global.broadcastMessage({
          type: 'new-message',
          senderType: 'organizer',
          senderName: organizerName,
          ticketId: id,
          ticketNumber: ticket?.ticketNumber || `ST-${id.slice(-8)}`,
          organizerEmail: req.user?.email,
          message: result
        });
      }
    } catch (error) {
      console.error('Error sending WebSocket notification:', error);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Add organizer message error:', error);
    res.status(500).json({ message: 'Failed to add message' });
  }
});

// PUT /api/organizer/support/tickets/:id/mark-read - Mark messages as read
router.put('/support/tickets/:id/mark-read', async (req, res) => {
  try {
    const { id } = req.params;
    const { mongoSupportTicketService } = await import('../services/mongoSupportTicketService.js');
    const { mongoStorage } = await import('../mongodb-storage.js');

    await mongoSupportTicketService.markMessagesAsRead(id, 'organizer', mongoStorage);
    res.json({ message: 'Messages marked as read successfully' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});
