/**
 * Sample Data Generation Service for Organizer Dashboard
 * Creates realistic test data for comprehensive event management platform
 */

import { organizerStorage } from './organizerStorageService.js';

class SampleDataService {
  constructor() {
    this.sampleEvents = [
      {
        title: "Tech Conference 2025",
        description: "Annual technology conference featuring the latest innovations in AI, blockchain, and cloud computing.",
        shortDescription: "Premier tech conference for professionals",
        category: "Technology",
        subcategory: "Conference",
        startDate: new Date("2025-08-15"),
        endDate: new Date("2025-08-17"),
        startTime: "09:00",
        endTime: "18:00",
        timezone: "UTC",
        locationType: "physical",
        venue: "Convention Center",
        address: "123 Tech Street",
        city: "San Francisco",
        state: "CA",
        country: "USA",
        zipCode: "94105",
        coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
        ticketTypes: [
          {
            name: "Early Bird",
            description: "Limited time early bird pricing",
            price: 299,
            quantity: 100,
            sold: 75,
            isActive: true,
            saleStartDate: new Date("2025-01-01"),
            saleEndDate: new Date("2025-06-01"),
            perks: ["Priority seating", "Welcome kit", "Networking session"]
          },
          {
            name: "Standard",
            description: "Regular conference ticket",
            price: 399,
            quantity: 500,
            sold: 234,
            isActive: true,
            saleStartDate: new Date("2025-01-01"),
            saleEndDate: new Date("2025-08-10"),
            perks: ["Conference access", "Lunch included"]
          }
        ],
        status: "published",
        allowRefunds: true,
        tags: ["technology", "networking", "AI", "blockchain"],
        totalRevenue: 115191,
        totalTicketsSold: 309,
        platformFee: 5759.55,
        processingFee: 2303.82,
        views: 2543,
        uniqueViews: 1876,
        socialShares: 142
      },
      {
        title: "Summer Music Festival",
        description: "Three-day music festival featuring top artists from around the world.",
        shortDescription: "Epic summer music experience",
        category: "Music",
        subcategory: "Festival",
        startDate: new Date("2025-07-10"),
        endDate: new Date("2025-07-12"),
        startTime: "14:00",
        endTime: "23:00",
        timezone: "UTC",
        locationType: "physical",
        venue: "Festival Grounds",
        address: "456 Music Avenue",
        city: "Austin",
        state: "TX",
        country: "USA",
        zipCode: "78701",
        coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f",
        ticketTypes: [
          {
            name: "General Admission",
            description: "3-day festival pass",
            price: 199,
            quantity: 1000,
            sold: 567,
            isActive: true,
            saleStartDate: new Date("2025-01-15"),
            saleEndDate: new Date("2025-07-05"),
            perks: ["3-day access", "Water stations"]
          },
          {
            name: "VIP",
            description: "Premium festival experience",
            price: 399,
            quantity: 200,
            sold: 123,
            isActive: true,
            saleStartDate: new Date("2025-01-15"),
            saleEndDate: new Date("2025-07-05"),
            perks: ["VIP area", "Premium bars", "Artist meet & greet", "Express entry"]
          }
        ],
        status: "published",
        allowRefunds: true,
        tags: ["music", "festival", "summer", "outdoor"],
        totalRevenue: 161910,
        totalTicketsSold: 690,
        platformFee: 8095.50,
        processingFee: 3238.20,
        views: 4567,
        uniqueViews: 3201,
        socialShares: 287
      },
      {
        title: "Business Leadership Workshop",
        description: "Intensive workshop for executives and business leaders to develop strategic thinking and leadership skills.",
        shortDescription: "Executive leadership development",
        category: "Business",
        subcategory: "Workshop",
        startDate: new Date("2025-09-05"),
        endDate: new Date("2025-09-05"),
        startTime: "09:00",
        endTime: "17:00",
        timezone: "UTC",
        locationType: "hybrid",
        venue: "Business Center",
        address: "789 Corporate Blvd",
        city: "New York",
        state: "NY",
        country: "USA",
        zipCode: "10001",
        virtualLink: "https://zoom.us/j/123456789",
        coverImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43",
        ticketTypes: [
          {
            name: "In-Person",
            description: "Attend the workshop in person",
            price: 599,
            quantity: 50,
            sold: 32,
            isActive: true,
            saleStartDate: new Date("2025-02-01"),
            saleEndDate: new Date("2025-09-01"),
            perks: ["In-person networking", "Materials kit", "Lunch included"]
          },
          {
            name: "Virtual",
            description: "Join the workshop online",
            price: 299,
            quantity: 200,
            sold: 89,
            isActive: true,
            saleStartDate: new Date("2025-02-01"),
            saleEndDate: new Date("2025-09-01"),
            perks: ["Digital materials", "Recording access"]
          }
        ],
        status: "published",
        allowRefunds: true,
        tags: ["business", "leadership", "professional-development"],
        totalRevenue: 45779,
        totalTicketsSold: 121,
        platformFee: 2288.95,
        processingFee: 915.58,
        views: 1234,
        uniqueViews: 987,
        socialShares: 56
      }
    ];

    this.sampleAttendees = [
      {
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        phone: "+1-555-0101",
        ticketType: "Early Bird",
        ticketPrice: 299,
        quantity: 1,
        totalAmount: 299,
        status: "confirmed",
        checkedIn: false,
        company: "Tech Corp",
        jobTitle: "Software Engineer",
        hearAboutEvent: "Social Media",
        marketingConsent: true,
        paymentStatus: "completed"
      },
      {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@example.com",
        phone: "+1-555-0102",
        ticketType: "VIP",
        ticketPrice: 399,
        quantity: 2,
        totalAmount: 798,
        status: "confirmed",
        checkedIn: true,
        company: "Music Inc",
        jobTitle: "Marketing Manager",
        hearAboutEvent: "Email",
        marketingConsent: true,
        paymentStatus: "completed"
      },
      {
        firstName: "Michael",
        lastName: "Davis",
        email: "michael.davis@example.com",
        phone: "+1-555-0103",
        ticketType: "Standard",
        ticketPrice: 399,
        quantity: 1,
        totalAmount: 399,
        status: "registered",
        checkedIn: false,
        company: "Business Solutions",
        jobTitle: "CEO",
        hearAboutEvent: "Referral",
        marketingConsent: false,
        paymentStatus: "completed"
      }
    ];

    this.sampleMarketingCampaigns = [
      {
        name: "Early Bird Promotion",
        description: "Promote early bird tickets for Tech Conference",
        type: "email",
        subject: "🎉 Early Bird Tickets Now Available - Save 25%!",
        htmlContent: "<h1>Don't Miss Out!</h1><p>Get your Tech Conference tickets now at early bird prices.</p>",
        plainTextContent: "Don't Miss Out! Get your Tech Conference tickets now at early bird prices.",
        targetAudience: "potential",
        status: "sent",
        sentCount: 5000,
        deliveredCount: 4890,
        openCount: 1467,
        clickCount: 293,
        conversionCount: 75
      },
      {
        name: "Festival Reminder",
        description: "Remind registered attendees about upcoming festival",
        type: "sms",
        smsContent: "🎵 Summer Music Festival starts tomorrow! Get ready for an amazing experience. See you there!",
        targetAudience: "registered",
        status: "scheduled",
        scheduledAt: new Date("2025-07-09T10:00:00Z")
      },
      {
        name: "Leadership Discount",
        description: "Offer discount for leadership workshop",
        type: "discount",
        discountCode: "LEADER20",
        discountType: "percentage",
        discountValue: 20,
        maxUsage: 100,
        usageCount: 23,
        validUntil: new Date("2025-08-31"),
        targetAudience: "all",
        status: "active"
      }
    ];

    this.sampleAudience = [
      {
        email: "subscriber1@example.com",
        firstName: "Alice",
        lastName: "Wilson",
        phone: "+1-555-0201",
        tags: ["tech", "professional"],
        segments: ["early-adopters", "high-value"],
        subscribed: true,
        totalEvents: 3,
        totalSpent: 1197,
        interests: ["technology", "business"],
        preferredEventTypes: ["conference", "workshop"],
        age: 32,
        gender: "Female",
        location: "San Francisco, CA",
        source: "website",
        marketingConsent: true
      },
      {
        email: "subscriber2@example.com",
        firstName: "Bob",
        lastName: "Martinez",
        phone: "+1-555-0202",
        tags: ["music", "entertainment"],
        segments: ["festival-goers"],
        subscribed: true,
        totalEvents: 1,
        totalSpent: 399,
        interests: ["music", "festivals"],
        preferredEventTypes: ["festival", "concert"],
        age: 28,
        gender: "Male",
        location: "Austin, TX",
        source: "social-media",
        marketingConsent: true
      }
    ];

    this.sampleTeamMembers = [
      {
        email: "manager@example.com",
        firstName: "Emma",
        lastName: "Thompson",
        role: "manager",
        permissions: {
          events: true,
          marketing: true,
          finances: false,
          analytics: true,
          team: false
        },
        status: "active",
        joinedAt: new Date("2025-01-15")
      },
      {
        email: "staff@example.com",
        firstName: "David",
        lastName: "Brown",
        role: "staff",
        permissions: {
          events: true,
          marketing: false,
          finances: false,
          analytics: false,
          team: false
        },
        status: "active",
        joinedAt: new Date("2025-02-01")
      }
    ];

    this.samplePayouts = [
      {
        amount: 10000,
        platformFee: 500,
        processingFee: 200,
        netAmount: 9300,
        status: "completed",
        paymentMethod: "bank_transfer",
        bankAccount: "****1234",
        completedAt: new Date("2025-06-15"),
        transactionId: "TXN123456789",
        notes: "Monthly payout for June events"
      },
      {
        amount: 15000,
        platformFee: 750,
        processingFee: 300,
        netAmount: 13950,
        status: "pending",
        paymentMethod: "bank_transfer",
        bankAccount: "****1234",
        notes: "Payout request for July events"
      }
    ];

    this.sampleDisputes = [
      {
        type: "refund",
        reason: "Event cancelled",
        description: "Customer requesting refund due to event cancellation",
        amount: 299,
        status: "resolved",
        priority: "medium",
        resolution: "Full refund processed",
        resolvedAt: new Date("2025-06-20"),
        messages: [
          {
            message: "Customer requesting refund for cancelled event",
            timestamp: new Date("2025-06-18"),
            isInternal: false
          },
          {
            message: "Processing refund as per policy",
            timestamp: new Date("2025-06-19"),
            isInternal: true
          }
        ]
      }
    ];

    this.sampleSupportTickets = [
      {
        subject: "Payment Processing Issue",
        description: "Customer unable to complete payment for event tickets",
        category: "technical",
        priority: "high",
        status: "in_progress",
        messages: [
          {
            message: "Customer reports payment failing at checkout",
            timestamp: new Date("2025-07-01"),
            isStaff: false
          },
          {
            message: "Investigating payment gateway logs",
            timestamp: new Date("2025-07-01"),
            isStaff: true
          }
        ]
      },
      {
        subject: "Feature Request: Bulk Email",
        description: "Request for bulk email functionality in marketing tools",
        category: "feature_request",
        priority: "low",
        status: "open",
        messages: [
          {
            message: "Would like to send emails to all attendees at once",
            timestamp: new Date("2025-07-02"),
            isStaff: false
          }
        ]
      }
    ];

    this.sampleAnalytics = [
      {
        date: new Date("2025-07-01"),
        pageViews: 1250,
        uniqueVisitors: 890,
        bounceRate: 0.35,
        avgSessionDuration: 180,
        ticketsSold: 45,
        revenue: 13455,
        conversionRate: 0.036,
        trafficSources: {
          direct: 350,
          social: 420,
          search: 280,
          referral: 120,
          email: 80
        },
        topCountries: [
          { country: "USA", visitors: 567 },
          { country: "Canada", visitors: 123 },
          { country: "UK", visitors: 89 }
        ],
        topCities: [
          { city: "San Francisco", visitors: 234 },
          { city: "New York", visitors: 156 },
          { city: "Los Angeles", visitors: 98 }
        ],
        deviceTypes: {
          desktop: 534,
          mobile: 267,
          tablet: 89
        }
      }
    ];
  }

  async generateSampleData(organizerId, organizationId) {
    try {
      console.log(`[Sample Data] Generating data for organizer: ${organizerId}`);
      
      // Create sample events
      const createdEvents = [];
      for (const eventData of this.sampleEvents) {
        const event = await organizerStorage.createEvent({
          ...eventData,
          organizerId,
          organizationId
        });
        createdEvents.push(event);
        console.log(`[Sample Data] Created event: ${event.title}`);
      }

      // Create sample attendees for events
      for (const event of createdEvents) {
        for (const attendeeData of this.sampleAttendees) {
          await organizerStorage.createAttendee({
            ...attendeeData,
            eventId: event._id,
            organizerId,
            userId: event._id // Using event ID as placeholder user ID
          });
        }
      }

      // Create sample marketing campaigns
      for (const campaignData of this.sampleMarketingCampaigns) {
        await organizerStorage.createMarketingCampaign({
          ...campaignData,
          organizerId,
          eventId: createdEvents[0]._id
        });
      }

      // Create sample audience members
      for (const audienceData of this.sampleAudience) {
        await organizerStorage.createAudienceMember({
          ...audienceData,
          organizerId
        });
      }

      // Create sample team members
      for (const memberData of this.sampleTeamMembers) {
        await organizerStorage.createTeamMember({
          ...memberData,
          organizerId,
          organizationId
        });
      }

      // Create sample payouts
      for (const payoutData of this.samplePayouts) {
        await organizerStorage.createPayout({
          ...payoutData,
          organizerId,
          eventId: createdEvents[0]._id
        });
      }

      // Create sample disputes
      for (const disputeData of this.sampleDisputes) {
        await organizerStorage.createDispute({
          ...disputeData,
          organizerId,
          eventId: createdEvents[0]._id,
          attendeeId: createdEvents[0]._id // Using event ID as placeholder
        });
      }

      // Create sample support tickets
      for (const ticketData of this.sampleSupportTickets) {
        await organizerStorage.createSupportTicket({
          ...ticketData,
          organizerId
        });
      }

      // Create sample analytics
      for (const analyticsData of this.sampleAnalytics) {
        await organizerStorage.createAnalyticsEntry({
          ...analyticsData,
          organizerId,
          eventId: createdEvents[0]._id
        });
      }

      console.log(`[Sample Data] Successfully generated complete sample data for organizer`);
      return {
        message: "Sample data generated successfully",
        events: createdEvents.length,
        attendees: this.sampleAttendees.length * createdEvents.length,
        campaigns: this.sampleMarketingCampaigns.length,
        audience: this.sampleAudience.length,
        teamMembers: this.sampleTeamMembers.length,
        payouts: this.samplePayouts.length,
        disputes: this.sampleDisputes.length,
        supportTickets: this.sampleSupportTickets.length,
        analytics: this.sampleAnalytics.length
      };

    } catch (error) {
      console.error('[Sample Data] Generation error:', error);
      throw error;
    }
  }

  async clearAllData(organizerId) {
    try {
      console.log(`[Sample Data] Clearing all data for organizer: ${organizerId}`);
      
      // This would require implementing delete methods in storage service
      // For now, we'll just log the intent
      console.log(`[Sample Data] Data clearing not yet implemented`);
      
      return { message: "Data clearing not yet implemented" };
    } catch (error) {
      console.error('[Sample Data] Clear data error:', error);
      throw error;
    }
  }
}

export const sampleDataService = new SampleDataService();