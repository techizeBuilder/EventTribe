/**
 * Complete API Routes for Organizer Dashboard
 * All endpoints for comprehensive event management platform
 */

import express from 'express';
import { organizerStorage } from '../services/organizerStorageService.js';
import { authenticateToken, requireRole, requireVerification } from '../middleware/authMiddleware.js';
import { sampleDataService } from '../services/sampleDataService.js';

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
    const processedTicketTypes = req.body.ticketTypes ? req.body.ticketTypes.map(ticket => ({
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
      // Advanced settings
      enableSkipLine: ticket.enableSkipLine || false,
      passwordProtect: ticket.passwordProtect || false,
      enableBundle: ticket.enableBundle || false,
      enableEarlyBird: ticket.enableEarlyBird || false,
      coverTicket: ticket.coverTicket || false,
      enableComboTickets: ticket.enableComboTickets || false,
      enableWaitlist: ticket.enableWaitlist || false,
      hideTicket: ticket.hideTicket || false,
      bundlePrice: ticket.bundlePrice ? parseFloat(ticket.bundlePrice) : null,
      waitlistTicket: ticket.waitlistTicket || null,
      perks: ticket.perks || [],
      // Additional dynamic fields
      ticketPassword: ticket.ticketPassword || null,
      earlyBirdPrice: ticket.earlyBirdPrice ? parseFloat(ticket.earlyBirdPrice) : null,
      earlyBirdEndDate: ticket.earlyBirdEndDate || null,
      creditPrice: ticket.creditPrice ? parseFloat(ticket.creditPrice) : null,
      // Store all original form data for complete functionality
      additionalSettings: {
        enableSkipLine: ticket.enableSkipLine || false,
        passwordProtect: ticket.passwordProtect || false,
        enableBundle: ticket.enableBundle || false,
        enableEarlyBird: ticket.enableEarlyBird || false,
        coverTicket: ticket.coverTicket || false,
        enableComboTickets: ticket.enableComboTickets || false,
        enableWaitlist: ticket.enableWaitlist || false,
        hideTicket: ticket.hideTicket || false,
        ticketPassword: ticket.ticketPassword || null,
        earlyBirdPrice: ticket.earlyBirdPrice ? parseFloat(ticket.earlyBirdPrice) : null,
        earlyBirdEndDate: ticket.earlyBirdEndDate || null,
        creditPrice: ticket.creditPrice ? parseFloat(ticket.creditPrice) : null,
        bundlePrice: ticket.bundlePrice ? parseFloat(ticket.bundlePrice) : null,
        waitlistTicket: ticket.waitlistTicket || null
      }
    })) : [];
    
    // Simple event creation without complex organization setup
    const eventData = { 
      ...req.body, 
      organizerId,
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
    const events = await eventsCollection.find({ organizerId }).toArray();
    
    res.json(events);
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
    const processedTicketTypes = req.body.ticketTypes ? req.body.ticketTypes.map(ticket => ({
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
      // Advanced settings
      enableSkipLine: ticket.enableSkipLine || false,
      passwordProtect: ticket.passwordProtect || false,
      enableBundle: ticket.enableBundle || false,
      enableEarlyBird: ticket.enableEarlyBird || false,
      coverTicket: ticket.coverTicket || false,
      enableComboTickets: ticket.enableComboTickets || false,
      enableWaitlist: ticket.enableWaitlist || false,
      hideTicket: ticket.hideTicket || false,
      bundlePrice: ticket.bundlePrice ? parseFloat(ticket.bundlePrice) : null,
      waitlistTicket: ticket.waitlistTicket || null,
      perks: ticket.perks || [],
      // Additional dynamic fields
      ticketPassword: ticket.ticketPassword || null,
      earlyBirdPrice: ticket.earlyBirdPrice ? parseFloat(ticket.earlyBirdPrice) : null,
      earlyBirdEndDate: ticket.earlyBirdEndDate || null,
      creditPrice: ticket.creditPrice ? parseFloat(ticket.creditPrice) : null,
      // Store all original form data for complete functionality
      additionalSettings: {
        enableSkipLine: ticket.enableSkipLine || false,
        passwordProtect: ticket.passwordProtect || false,
        enableBundle: ticket.enableBundle || false,
        enableEarlyBird: ticket.enableEarlyBird || false,
        coverTicket: ticket.coverTicket || false,
        enableComboTickets: ticket.enableComboTickets || false,
        enableWaitlist: ticket.enableWaitlist || false,
        hideTicket: ticket.hideTicket || false,
        ticketPassword: ticket.ticketPassword || null,
        earlyBirdPrice: ticket.earlyBirdPrice ? parseFloat(ticket.earlyBirdPrice) : null,
        earlyBirdEndDate: ticket.earlyBirdEndDate || null,
        creditPrice: ticket.creditPrice ? parseFloat(ticket.creditPrice) : null,
        bundlePrice: ticket.bundlePrice ? parseFloat(ticket.bundlePrice) : null,
        waitlistTicket: ticket.waitlistTicket || null
      }
    })) : (req.body.ticketTypes || existingEvent.ticketTypes || []);
    
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

// POST /api/organizer/events/:id/publish - Publish/unpublish event
router.post('/events/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'published' or 'draft'
    
    // Use MongoDB directly
    const { mongoStorage } = await import('../mongodb-storage.js');
    await mongoStorage.connect();
    
    const eventsCollection = mongoStorage.db.collection('events');
    const { ObjectId } = await import('mongodb');
    const result = await eventsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    
    if (result.value) {
      res.json(result.value);
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    console.error('Publish event error:', error);
    res.status(500).json({ message: 'Failed to publish event', error: error.message });
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
    const organizerId = req.user._id;
    const summary = await organizerStorage.getFinancialSummary(organizerId);
    res.json(summary);
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({ message: 'Failed to fetch financial summary' });
  }
});

// ==================== DISPUTE MANAGEMENT ====================

// POST /api/organizer/disputes - Create dispute
router.post('/disputes', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const disputeData = { ...req.body, organizerId };
    
    const dispute = await organizerStorage.createDispute(disputeData);
    res.status(201).json(dispute);
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ message: 'Failed to create dispute' });
  }
});

// GET /api/organizer/disputes - Get disputes
router.get('/disputes', async (req, res) => {
  try {
    const organizerId = req.user._id;
    const { status } = req.query;
    
    const disputes = await organizerStorage.getDisputes(organizerId, status);
    res.json(disputes);
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ message: 'Failed to fetch disputes' });
  }
});

// PUT /api/organizer/disputes/:id - Update dispute
router.put('/disputes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await organizerStorage.updateDispute(id, req.body);
    
    if (success) {
      res.json({ message: 'Dispute updated successfully' });
    } else {
      res.status(404).json({ message: 'Dispute not found' });
    }
  } catch (error) {
    console.error('Update dispute error:', error);
    res.status(500).json({ message: 'Failed to update dispute' });
  }
});

// POST /api/organizer/disputes/:id/messages - Add dispute message
router.post('/disputes/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const senderId = req.user._id;
    const message = { ...req.body, sender: senderId };
    
    const success = await organizerStorage.addDisputeMessage(id, message);
    
    if (success) {
      res.json({ message: 'Message added successfully' });
    } else {
      res.status(404).json({ message: 'Dispute not found' });
    }
  } catch (error) {
    console.error('Add dispute message error:', error);
    res.status(500).json({ message: 'Failed to add dispute message' });
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

export default router;