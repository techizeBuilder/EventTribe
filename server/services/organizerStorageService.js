/**
 * Complete MongoDB Storage Service for Organizer Dashboard
 * Handles all CRUD operations for organizer-related collections
 */

import { MongoClient, ObjectId } from 'mongodb';

class OrganizerStorageService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;
    
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl || (!dbUrl.startsWith('mongodb://') && !dbUrl.startsWith('mongodb+srv://'))) {
        console.error('[Organizer Storage] Invalid DATABASE_URL:', dbUrl);
        throw new Error('Invalid MongoDB connection string');
      }
      
      this.client = new MongoClient(dbUrl);
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      console.log('[Organizer Storage] Connected to MongoDB');
    } catch (error) {
      console.error('[Organizer Storage] Connection failed:', error);
      throw error;
    }
  }

  // ==================== ORGANIZATION METHODS ====================
  
  async createOrganization(orgData) {
    await this.connect();
    const organization = {
      ...orgData,
      ownerId: new ObjectId(orgData.ownerId),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.db.collection('organizations').insertOne(organization);
    return await this.db.collection('organizations').findOne({ _id: result.insertedId });
  }

  async getOrganizationsByOwner(ownerId) {
    await this.connect();
    return await this.db.collection('organizations')
      .find({ ownerId: new ObjectId(ownerId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getOrganizationById(orgId) {
    await this.connect();
    return await this.db.collection('organizations').findOne({ _id: new ObjectId(orgId) });
  }

  async updateOrganization(orgId, updateData) {
    await this.connect();
    const result = await this.db.collection('organizations').updateOne(
      { _id: new ObjectId(orgId) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async deleteOrganization(orgId) {
    await this.connect();
    const result = await this.db.collection('organizations').deleteOne({ _id: new ObjectId(orgId) });
    return result.deletedCount > 0;
  }

  // ==================== EVENT METHODS ====================
  
  async createEvent(eventData) {
    await this.connect();
    const event = {
      ...eventData,
      organizerId: new ObjectId(eventData.organizerId),
      organizationId: new ObjectId(eventData.organizationId),
      startDate: new Date(eventData.startDate),
      endDate: new Date(eventData.endDate),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.db.collection('events').insertOne(event);
    return await this.db.collection('events').findOne({ _id: result.insertedId });
  }

  async getEventsByOrganizer(organizerId, filters = {}) {
    await this.connect();
    const query = { organizerId: new ObjectId(organizerId) };
    
    // Apply filters
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.startDate) query.startDate = { $gte: new Date(filters.startDate) };
    if (filters.endDate) query.endDate = { $lte: new Date(filters.endDate) };
    
    return await this.db.collection('events')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getEventById(eventId) {
    await this.connect();
    return await this.db.collection('events').findOne({ _id: new ObjectId(eventId) });
  }

  async updateEvent(eventId, updateData) {
    await this.connect();
    const processedData = { ...updateData };
    if (processedData.startDate) processedData.startDate = new Date(processedData.startDate);
    if (processedData.endDate) processedData.endDate = new Date(processedData.endDate);
    
    const result = await this.db.collection('events').updateOne(
      { _id: new ObjectId(eventId) },
      { $set: { ...processedData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async deleteEvent(eventId) {
    await this.connect();
    const result = await this.db.collection('events').deleteOne({ _id: new ObjectId(eventId) });
    return result.deletedCount > 0;
  }

  async getEventStats(organizerId) {
    await this.connect();
    const pipeline = [
      { $match: { organizerId: new ObjectId(organizerId) } },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          totalRevenue: { $sum: '$totalRevenue' },
          totalTicketsSold: { $sum: '$totalTicketsSold' },
          draftEvents: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          publishedEvents: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
          completedEvents: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ];
    
    const result = await this.db.collection('events').aggregate(pipeline).toArray();
    return result[0] || {
      totalEvents: 0,
      totalRevenue: 0,
      totalTicketsSold: 0,
      draftEvents: 0,
      publishedEvents: 0,
      completedEvents: 0
    };
  }

  // ==================== ATTENDEE METHODS ====================
  
  async createAttendee(attendeeData) {
    await this.connect();
    const attendee = {
      ...attendeeData,
      userId: new ObjectId(attendeeData.userId),
      eventId: new ObjectId(attendeeData.eventId),
      organizerId: new ObjectId(attendeeData.organizerId),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.db.collection('attendees').insertOne(attendee);
    return await this.db.collection('attendees').findOne({ _id: result.insertedId });
  }

  async getAttendeesByEvent(eventId) {
    await this.connect();
    return await this.db.collection('attendees')
      .find({ eventId: new ObjectId(eventId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async getAttendeesByOrganizer(organizerId) {
    await this.connect();
    return await this.db.collection('attendees')
      .find({ organizerId: new ObjectId(organizerId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async updateAttendee(attendeeId, updateData) {
    await this.connect();
    const result = await this.db.collection('attendees').updateOne(
      { _id: new ObjectId(attendeeId) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async checkInAttendee(attendeeId) {
    await this.connect();
    const result = await this.db.collection('attendees').updateOne(
      { _id: new ObjectId(attendeeId) },
      { $set: { checkedIn: true, checkedInAt: new Date(), updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  // ==================== MARKETING METHODS ====================
  
  async createMarketingCampaign(campaignData) {
    await this.connect();
    const campaign = {
      ...campaignData,
      organizerId: new ObjectId(campaignData.organizerId),
      eventId: new ObjectId(campaignData.eventId),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.db.collection('marketing_campaigns').insertOne(campaign);
    return await this.db.collection('marketing_campaigns').findOne({ _id: result.insertedId });
  }

  async getMarketingCampaigns(organizerId, eventId = null) {
    await this.connect();
    const query = { organizerId: new ObjectId(organizerId) };
    if (eventId) query.eventId = new ObjectId(eventId);
    
    return await this.db.collection('marketing_campaigns')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  }

  async updateMarketingCampaign(campaignId, updateData) {
    await this.connect();
    const result = await this.db.collection('marketing_campaigns').updateOne(
      { _id: new ObjectId(campaignId) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async deleteMarketingCampaign(campaignId) {
    await this.connect();
    const result = await this.db.collection('marketing_campaigns').deleteOne({ _id: new ObjectId(campaignId) });
    return result.deletedCount > 0;
  }

  // ==================== FINANCIAL METHODS ====================
  
  async createPayout(payoutData) {
    await this.connect();
    const payout = {
      ...payoutData,
      organizerId: new ObjectId(payoutData.organizerId),
      eventId: new ObjectId(payoutData.eventId),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.db.collection('payouts').insertOne(payout);
    return await this.db.collection('payouts').findOne({ _id: result.insertedId });
  }

  async getPayouts(organizerId, status = null) {
    await this.connect();
    const query = { organizerId: new ObjectId(organizerId) };
    if (status) query.status = status;
    
    return await this.db.collection('payouts')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  }

  async updatePayoutStatus(payoutId, status, additionalData = {}) {
    await this.connect();
    const updateData = { status, ...additionalData, updatedAt: new Date() };
    
    if (status === 'completed') updateData.completedAt = new Date();
    if (status === 'processing') updateData.processedAt = new Date();
    
    const result = await this.db.collection('payouts').updateOne(
      { _id: new ObjectId(payoutId) },
      { $set: updateData }
    );
    return result.modifiedCount > 0;
  }

  async createDispute(disputeData) {
    await this.connect();
    const dispute = {
      ...disputeData,
      organizerId: new ObjectId(disputeData.organizerId),
      eventId: new ObjectId(disputeData.eventId),
      attendeeId: new ObjectId(disputeData.attendeeId),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.db.collection('disputes').insertOne(dispute);
    return await this.db.collection('disputes').findOne({ _id: result.insertedId });
  }

  async getDisputes(organizerId, status = null) {
    await this.connect();
    const query = { organizerId: new ObjectId(organizerId) };
    if (status) query.status = status;
    
    return await this.db.collection('disputes')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  }

  async updateDispute(disputeId, updateData) {
    await this.connect();
    const result = await this.db.collection('disputes').updateOne(
      { _id: new ObjectId(disputeId) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async addDisputeMessage(disputeId, message) {
    await this.connect();
    const result = await this.db.collection('disputes').updateOne(
      { _id: new ObjectId(disputeId) },
      { 
        $push: { messages: { ...message, timestamp: new Date() } },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  async getFinancialSummary(organizerId) {
    await this.connect();
    const pipeline = [
      { $match: { organizerId: new ObjectId(organizerId) } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalRevenue' },
          totalTicketsSold: { $sum: '$totalTicketsSold' },
          totalPlatformFees: { $sum: '$platformFee' },
          totalProcessingFees: { $sum: '$processingFee' }
        }
      }
    ];
    
    const eventStats = await this.db.collection('events').aggregate(pipeline).toArray();
    const payoutStats = await this.db.collection('payouts').aggregate([
      { $match: { organizerId: new ObjectId(organizerId) } },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    return {
      events: eventStats[0] || { totalRevenue: 0, totalTicketsSold: 0, totalPlatformFees: 0, totalProcessingFees: 0 },
      payouts: payoutStats
    };
  }

  // ==================== TEAM METHODS ====================
  
  async createTeamMember(memberData) {
    await this.connect();
    const member = {
      ...memberData,
      organizerId: new ObjectId(memberData.organizerId),
      organizationId: new ObjectId(memberData.organizationId),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.db.collection('team_members').insertOne(member);
    return await this.db.collection('team_members').findOne({ _id: result.insertedId });
  }

  async getTeamMembers(organizerId) {
    await this.connect();
    return await this.db.collection('team_members')
      .find({ organizerId: new ObjectId(organizerId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  async updateTeamMember(memberId, updateData) {
    await this.connect();
    const result = await this.db.collection('team_members').updateOne(
      { _id: new ObjectId(memberId) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async deleteTeamMember(memberId) {
    await this.connect();
    const result = await this.db.collection('team_members').deleteOne({ _id: new ObjectId(memberId) });
    return result.deletedCount > 0;
  }

  // ==================== ANALYTICS METHODS ====================
  
  async createAnalyticsEntry(analyticsData) {
    await this.connect();
    const analytics = {
      ...analyticsData,
      organizerId: new ObjectId(analyticsData.organizerId),
      eventId: new ObjectId(analyticsData.eventId),
      date: new Date(analyticsData.date),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.db.collection('analytics').insertOne(analytics);
    return await this.db.collection('analytics').findOne({ _id: result.insertedId });
  }

  async getAnalytics(organizerId, eventId = null, dateRange = null) {
    await this.connect();
    const query = { organizerId: new ObjectId(organizerId) };
    if (eventId) query.eventId = new ObjectId(eventId);
    if (dateRange) {
      query.date = {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate)
      };
    }
    
    return await this.db.collection('analytics')
      .find(query)
      .sort({ date: -1 })
      .toArray();
  }

  async getAnalyticsSummary(organizerId, eventId = null) {
    await this.connect();
    const matchStage = { organizerId: new ObjectId(organizerId) };
    if (eventId) matchStage.eventId = new ObjectId(eventId);
    
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalPageViews: { $sum: '$pageViews' },
          totalUniqueVisitors: { $sum: '$uniqueVisitors' },
          totalTicketsSold: { $sum: '$ticketsSold' },
          totalRevenue: { $sum: '$revenue' },
          avgConversionRate: { $avg: '$conversionRate' },
          avgBounceRate: { $avg: '$bounceRate' }
        }
      }
    ];
    
    const result = await this.db.collection('analytics').aggregate(pipeline).toArray();
    return result[0] || {
      totalPageViews: 0,
      totalUniqueVisitors: 0,
      totalTicketsSold: 0,
      totalRevenue: 0,
      avgConversionRate: 0,
      avgBounceRate: 0
    };
  }

  // ==================== SUPPORT METHODS ====================
  
  async createSupportTicket(ticketData) {
    await this.connect();
    const ticket = {
      ...ticketData,
      organizerId: new ObjectId(ticketData.organizerId),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.db.collection('support_tickets').insertOne(ticket);
    return await this.db.collection('support_tickets').findOne({ _id: result.insertedId });
  }

  async getSupportTickets(organizerId, status = null) {
    await this.connect();
    const query = { organizerId: new ObjectId(organizerId) };
    if (status) query.status = status;
    
    return await this.db.collection('support_tickets')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  }

  async updateSupportTicket(ticketId, updateData) {
    await this.connect();
    const result = await this.db.collection('support_tickets').updateOne(
      { _id: new ObjectId(ticketId) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async addSupportMessage(ticketId, message) {
    await this.connect();
    const result = await this.db.collection('support_tickets').updateOne(
      { _id: new ObjectId(ticketId) },
      { 
        $push: { messages: { ...message, timestamp: new Date() } },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  }

  // ==================== AUDIENCE METHODS ====================
  
  async createAudienceMember(audienceData) {
    await this.connect();
    const audience = {
      ...audienceData,
      organizerId: new ObjectId(audienceData.organizerId),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await this.db.collection('audience').insertOne(audience);
    return await this.db.collection('audience').findOne({ _id: result.insertedId });
  }

  async getAudience(organizerId, filters = {}) {
    await this.connect();
    const query = { organizerId: new ObjectId(organizerId) };
    
    if (filters.subscribed !== undefined) query.subscribed = filters.subscribed;
    if (filters.tags) query.tags = { $in: filters.tags };
    if (filters.segments) query.segments = { $in: filters.segments };
    
    return await this.db.collection('audience')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
  }

  async updateAudienceMember(audienceId, updateData) {
    await this.connect();
    const result = await this.db.collection('audience').updateOne(
      { _id: new ObjectId(audienceId) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async deleteAudienceMember(audienceId) {
    await this.connect();
    const result = await this.db.collection('audience').deleteOne({ _id: new ObjectId(audienceId) });
    return result.deletedCount > 0;
  }

  async getAudienceStats(organizerId) {
    await this.connect();
    const pipeline = [
      { $match: { organizerId: new ObjectId(organizerId) } },
      {
        $group: {
          _id: null,
          totalContacts: { $sum: 1 },
          subscribedContacts: { $sum: { $cond: ['$subscribed', 1, 0] } },
          avgTotalSpent: { $avg: '$totalSpent' },
          avgTotalEvents: { $avg: '$totalEvents' }
        }
      }
    ];
    
    const result = await this.db.collection('audience').aggregate(pipeline).toArray();
    return result[0] || {
      totalContacts: 0,
      subscribedContacts: 0,
      avgTotalSpent: 0,
      avgTotalEvents: 0
    };
  }

  // ==================== DASHBOARD OVERVIEW ====================
  
  async getDashboardOverview(organizerId) {
    await this.connect();
    const [eventStats, attendeeStats, financialStats, audienceStats] = await Promise.all([
      this.getEventStats(organizerId),
      this.getAttendeeStats(organizerId),
      this.getFinancialSummary(organizerId),
      this.getAudienceStats(organizerId)
    ]);
    
    return {
      events: eventStats,
      attendees: attendeeStats,
      finances: financialStats,
      audience: audienceStats
    };
  }

  async getAttendeeStats(organizerId) {
    await this.connect();
    const pipeline = [
      { $match: { organizerId: new ObjectId(organizerId) } },
      {
        $group: {
          _id: null,
          totalAttendees: { $sum: 1 },
          checkedInAttendees: { $sum: { $cond: ['$checkedIn', 1, 0] } },
          totalRevenue: { $sum: '$totalAmount' },
          avgTicketPrice: { $avg: '$ticketPrice' }
        }
      }
    ];
    
    const result = await this.db.collection('attendees').aggregate(pipeline).toArray();
    return result[0] || {
      totalAttendees: 0,
      checkedInAttendees: 0,
      totalRevenue: 0,
      avgTicketPrice: 0
    };
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('[Organizer Storage] Disconnected from MongoDB');
    }
  }
}

export const organizerStorage = new OrganizerStorageService();