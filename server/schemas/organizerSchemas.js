/**
 * Complete MongoDB Schemas for Organizer Dashboard
 * All collections needed for comprehensive event management platform
 */

// ==================== CORE ORGANIZATION SCHEMA ====================
export const organizationSchema = {
  _id: { type: 'ObjectId', auto: true },
  name: { type: 'string', required: true },
  email: { type: 'string', required: true, unique: true },
  ownerId: { type: 'ObjectId', required: true, ref: 'auth_users' },
  customDomain: { type: 'string', default: '' },
  currency: { type: 'string', default: 'USD' },
  country: { type: 'string', default: '' },
  instagram: { type: 'string', default: '' },
  description: { type: 'string', default: '' },
  location: { type: 'string', default: '' },
  logo: { type: 'string', default: '' },
  website: { type: 'string', default: '' },
  phone: { type: 'string', default: '' },
  isActive: { type: 'boolean', default: true },
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
};

// ==================== EVENT MANAGEMENT SCHEMA ====================
export const eventSchema = {
  _id: { type: 'ObjectId', auto: true },
  organizerId: { type: 'ObjectId', required: true, ref: 'auth_users' },
  organizationId: { type: 'ObjectId', required: true, ref: 'organizations' },
  title: { type: 'string', required: true },
  description: { type: 'string', required: true },
  shortDescription: { type: 'string', default: '' },
  category: { type: 'string', required: true },
  subcategory: { type: 'string', default: '' },
  
  // Event Details
  startDate: { type: 'date', required: true },
  endDate: { type: 'date', required: true },
  startTime: { type: 'string', required: true },
  endTime: { type: 'string', required: true },
  timezone: { type: 'string', default: 'UTC' },
  
  // Location
  locationType: { type: 'string', enum: ['physical', 'virtual', 'hybrid'], default: 'physical' },
  venue: { type: 'string', default: '' },
  address: { type: 'string', default: '' },
  city: { type: 'string', default: '' },
  state: { type: 'string', default: '' },
  country: { type: 'string', default: '' },
  zipCode: { type: 'string', default: '' },
  virtualLink: { type: 'string', default: '' },
  
  // Media
  images: [{ type: 'string' }],
  videos: [{ type: 'string' }],
  coverImage: { type: 'string', default: '' },
  
  // Ticketing
  ticketTypes: [{
    name: { type: 'string', required: true },
    description: { type: 'string', default: '' },
    price: { type: 'number', required: true },
    quantity: { type: 'number', required: true },
    sold: { type: 'number', default: 0 },
    isActive: { type: 'boolean', default: true },
    saleStartDate: { type: 'date', default: Date.now },
    saleEndDate: { type: 'date', required: true },
    perks: [{ type: 'string' }]
  }],
  
  // Status and Settings
  status: { type: 'string', enum: ['draft', 'published', 'cancelled', 'completed'], default: 'draft' },
  isPublic: { type: 'boolean', default: true },
  allowRefunds: { type: 'boolean', default: true },
  refundPolicy: { type: 'string', default: '' },
  ageRestriction: { type: 'string', default: '' },
  tags: [{ type: 'string' }],
  
  // Financial
  totalRevenue: { type: 'number', default: 0 },
  totalTicketsSold: { type: 'number', default: 0 },
  platformFee: { type: 'number', default: 0 },
  processingFee: { type: 'number', default: 0 },
  
  // Analytics
  views: { type: 'number', default: 0 },
  uniqueViews: { type: 'number', default: 0 },
  socialShares: { type: 'number', default: 0 },
  
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
};

// ==================== ATTENDEE MANAGEMENT SCHEMA ====================
export const attendeeSchema = {
  _id: { type: 'ObjectId', auto: true },
  userId: { type: 'ObjectId', required: true, ref: 'auth_users' },
  eventId: { type: 'ObjectId', required: true, ref: 'events' },
  organizerId: { type: 'ObjectId', required: true, ref: 'auth_users' },
  
  // Personal Info
  firstName: { type: 'string', required: true },
  lastName: { type: 'string', required: true },
  email: { type: 'string', required: true },
  phone: { type: 'string', default: '' },
  
  // Ticket Info
  ticketType: { type: 'string', required: true },
  ticketPrice: { type: 'number', required: true },
  quantity: { type: 'number', default: 1 },
  totalAmount: { type: 'number', required: true },
  
  // Status
  status: { type: 'string', enum: ['registered', 'confirmed', 'cancelled', 'refunded'], default: 'registered' },
  checkedIn: { type: 'boolean', default: false },
  checkedInAt: { type: 'date', default: null },
  
  // Additional Info
  specialRequests: { type: 'string', default: '' },
  dietaryRestrictions: { type: 'string', default: '' },
  company: { type: 'string', default: '' },
  jobTitle: { type: 'string', default: '' },
  
  // Marketing
  hearAboutEvent: { type: 'string', default: '' },
  marketingConsent: { type: 'boolean', default: false },
  
  // Payment
  paymentId: { type: 'string', default: '' },
  paymentStatus: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
};

// ==================== MARKETING SCHEMA ====================
export const marketingCampaignSchema = {
  _id: { type: 'ObjectId', auto: true },
  organizerId: { type: 'ObjectId', required: true, ref: 'auth_users' },
  eventId: { type: 'ObjectId', required: true, ref: 'events' },
  
  // Campaign Details
  name: { type: 'string', required: true },
  description: { type: 'string', default: '' },
  type: { type: 'string', enum: ['email', 'sms', 'social', 'discount'], required: true },
  
  // Email Campaign
  subject: { type: 'string', default: '' },
  htmlContent: { type: 'string', default: '' },
  plainTextContent: { type: 'string', default: '' },
  
  // SMS Campaign
  smsContent: { type: 'string', default: '' },
  
  // Discount Campaign
  discountCode: { type: 'string', default: '' },
  discountType: { type: 'string', enum: ['percentage', 'fixed'], default: 'percentage' },
  discountValue: { type: 'number', default: 0 },
  maxUsage: { type: 'number', default: 0 },
  usageCount: { type: 'number', default: 0 },
  validUntil: { type: 'date', default: null },
  
  // Targeting
  targetAudience: { type: 'string', enum: ['all', 'registered', 'potential', 'past-attendees'], default: 'all' },
  targetEmails: [{ type: 'string' }],
  
  // Status and Analytics
  status: { type: 'string', enum: ['draft', 'scheduled', 'sent', 'cancelled'], default: 'draft' },
  scheduledAt: { type: 'date', default: null },
  sentAt: { type: 'date', default: null },
  
  // Performance Metrics
  sentCount: { type: 'number', default: 0 },
  deliveredCount: { type: 'number', default: 0 },
  openCount: { type: 'number', default: 0 },
  clickCount: { type: 'number', default: 0 },
  conversionCount: { type: 'number', default: 0 },
  
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
};

// ==================== FINANCIAL SCHEMA ====================
export const payoutSchema = {
  _id: { type: 'ObjectId', auto: true },
  organizerId: { type: 'ObjectId', required: true, ref: 'auth_users' },
  eventId: { type: 'ObjectId', required: true, ref: 'events' },
  
  // Payout Details
  amount: { type: 'number', required: true },
  platformFee: { type: 'number', required: true },
  processingFee: { type: 'number', required: true },
  netAmount: { type: 'number', required: true },
  
  // Status
  status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  
  // Payment Method
  paymentMethod: { type: 'string', enum: ['bank_transfer', 'paypal', 'stripe'], default: 'bank_transfer' },
  bankAccount: { type: 'string', default: '' },
  paypalEmail: { type: 'string', default: '' },
  
  // Dates
  requestedAt: { type: 'date', default: Date.now },
  processedAt: { type: 'date', default: null },
  completedAt: { type: 'date', default: null },
  
  // Reference
  transactionId: { type: 'string', default: '' },
  notes: { type: 'string', default: '' },
  
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
};

export const disputeSchema = {
  _id: { type: 'ObjectId', auto: true },
  organizerId: { type: 'ObjectId', required: true, ref: 'auth_users' },
  eventId: { type: 'ObjectId', required: true, ref: 'events' },
  attendeeId: { type: 'ObjectId', required: true, ref: 'attendees' },
  
  // Dispute Details
  type: { type: 'string', enum: ['refund', 'chargeback', 'complaint', 'technical'], required: true },
  reason: { type: 'string', required: true },
  description: { type: 'string', required: true },
  amount: { type: 'number', default: 0 },
  
  // Status
  status: { type: 'string', enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  
  // Resolution
  resolution: { type: 'string', default: '' },
  resolvedBy: { type: 'ObjectId', ref: 'auth_users', default: null },
  resolvedAt: { type: 'date', default: null },
  
  // Communication
  messages: [{
    sender: { type: 'ObjectId', ref: 'auth_users', required: true },
    message: { type: 'string', required: true },
    timestamp: { type: 'date', default: Date.now },
    isInternal: { type: 'boolean', default: false }
  }],
  
  // Attachments
  attachments: [{ type: 'string' }],
  
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
};

// ==================== TEAM MANAGEMENT SCHEMA ====================
export const teamMemberSchema = {
  _id: { type: 'ObjectId', auto: true },
  organizerId: { type: 'ObjectId', required: true, ref: 'auth_users' },
  organizationId: { type: 'ObjectId', required: true, ref: 'organizations' },
  
  // Member Info
  email: { type: 'string', required: true },
  firstName: { type: 'string', required: true },
  lastName: { type: 'string', required: true },
  role: { type: 'string', enum: ['admin', 'manager', 'staff', 'viewer'], default: 'staff' },
  
  // Permissions
  permissions: {
    events: { type: 'boolean', default: false },
    marketing: { type: 'boolean', default: false },
    finances: { type: 'boolean', default: false },
    analytics: { type: 'boolean', default: false },
    team: { type: 'boolean', default: false }
  },
  
  // Status
  status: { type: 'string', enum: ['invited', 'active', 'inactive', 'suspended'], default: 'invited' },
  invitedAt: { type: 'date', default: Date.now },
  joinedAt: { type: 'date', default: null },
  lastActive: { type: 'date', default: null },
  
  // Invitation
  inviteToken: { type: 'string', default: '' },
  inviteExpiry: { type: 'date', default: null },
  
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
};

// ==================== ANALYTICS SCHEMA ====================
export const analyticsSchema = {
  _id: { type: 'ObjectId', auto: true },
  organizerId: { type: 'ObjectId', required: true, ref: 'auth_users' },
  eventId: { type: 'ObjectId', required: true, ref: 'events' },
  
  // Date tracking
  date: { type: 'date', required: true },
  
  // Traffic Analytics
  pageViews: { type: 'number', default: 0 },
  uniqueVisitors: { type: 'number', default: 0 },
  bounceRate: { type: 'number', default: 0 },
  avgSessionDuration: { type: 'number', default: 0 },
  
  // Ticket Sales
  ticketsSold: { type: 'number', default: 0 },
  revenue: { type: 'number', default: 0 },
  conversionRate: { type: 'number', default: 0 },
  
  // Traffic Sources
  trafficSources: {
    direct: { type: 'number', default: 0 },
    social: { type: 'number', default: 0 },
    search: { type: 'number', default: 0 },
    referral: { type: 'number', default: 0 },
    email: { type: 'number', default: 0 }
  },
  
  // Geographic Data
  topCountries: [{ country: String, visitors: Number }],
  topCities: [{ city: String, visitors: Number }],
  
  // Device Data
  deviceTypes: {
    desktop: { type: 'number', default: 0 },
    mobile: { type: 'number', default: 0 },
    tablet: { type: 'number', default: 0 }
  },
  
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
};

// ==================== SUPPORT SCHEMA ====================
export const supportTicketSchema = {
  _id: { type: 'ObjectId', auto: true },
  organizerId: { type: 'ObjectId', required: true, ref: 'auth_users' },
  
  // Ticket Details
  subject: { type: 'string', required: true },
  description: { type: 'string', required: true },
  category: { type: 'string', enum: ['technical', 'billing', 'general', 'feature_request'], required: true },
  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  
  // Status
  status: { type: 'string', enum: ['open', 'in_progress', 'waiting_response', 'resolved', 'closed'], default: 'open' },
  
  // Assignment
  assignedTo: { type: 'ObjectId', ref: 'auth_users', default: null },
  assignedAt: { type: 'date', default: null },
  
  // Communication
  messages: [{
    sender: { type: 'ObjectId', ref: 'auth_users', required: true },
    message: { type: 'string', required: true },
    timestamp: { type: 'date', default: Date.now },
    isStaff: { type: 'boolean', default: false }
  }],
  
  // Attachments
  attachments: [{ type: 'string' }],
  
  // Resolution
  resolvedAt: { type: 'date', default: null },
  satisfaction: { type: 'number', min: 1, max: 5, default: null },
  
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
};

// ==================== AUDIENCE SCHEMA ====================
export const audienceSchema = {
  _id: { type: 'ObjectId', auto: true },
  organizerId: { type: 'ObjectId', required: true, ref: 'auth_users' },
  
  // Contact Info
  email: { type: 'string', required: true },
  firstName: { type: 'string', default: '' },
  lastName: { type: 'string', default: '' },
  phone: { type: 'string', default: '' },
  
  // Segmentation
  tags: [{ type: 'string' }],
  segments: [{ type: 'string' }],
  
  // Engagement
  subscribed: { type: 'boolean', default: true },
  lastEngagement: { type: 'date', default: null },
  totalEvents: { type: 'number', default: 0 },
  totalSpent: { type: 'number', default: 0 },
  
  // Preferences
  interests: [{ type: 'string' }],
  preferredEventTypes: [{ type: 'string' }],
  
  // Demographics
  age: { type: 'number', default: null },
  gender: { type: 'string', default: '' },
  location: { type: 'string', default: '' },
  
  // Marketing
  source: { type: 'string', default: '' },
  marketingConsent: { type: 'boolean', default: false },
  
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
};