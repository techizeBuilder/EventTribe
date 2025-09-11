/**
 * Payout System Schemas for Event Management Platform
 * Handles revenue splits, withdrawal requests, and payout tracking
 */

// ==================== PAYOUT TRANSACTION SCHEMA ====================
export const payoutTransactionSchema = {
  _id: { type: 'ObjectId', auto: true },
  bookingId: { type: 'ObjectId', required: true, ref: 'bookings' },
  eventId: { type: 'ObjectId', required: true, ref: 'events' },
  organizationId: { type: 'ObjectId', required: true, ref: 'organizations' },
  organizerId: { type: 'ObjectId', required: true, ref: 'auth_users' },
  
  // Financial details
  totalAmount: { type: 'number', required: true },
  organizationShare: { type: 'number', required: true }, // 80% of totalAmount
  pendingAmount: { type: 'number', required: true },     // 20% of totalAmount
  platformFee: { type: 'number', default: 0 },
  
  // Transaction details
  paymentIntentId: { type: 'string', required: true },
  transactionType: { type: 'string', enum: ['ticket_sale', 'refund'], default: 'ticket_sale' },
  status: { type: 'string', enum: ['completed', 'pending', 'failed'], default: 'completed' },
  
  // Metadata
  ticketDetails: { type: 'mixed', default: {} },
  customerEmail: { type: 'string', required: true },
  customerName: { type: 'string', required: true },
  
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
};

// ==================== WITHDRAWAL REQUEST SCHEMA ====================
export const withdrawalRequestSchema = {
  _id: { type: 'ObjectId', auto: true },
  organizationId: { type: 'ObjectId', required: true, ref: 'organizations' },
  organizerId: { type: 'ObjectId', required: true, ref: 'auth_users' },
  
  // Request details
  requestedAmount: { type: 'number', required: true },
  availableBalance: { type: 'number', required: true },
  requestReason: { type: 'string', default: '' },
  
  // Bank details for this request
  bankAccountNumber: { type: 'string', required: true },
  bankRoutingNumber: { type: 'string', required: true },
  bankAccountHolderName: { type: 'string', required: true },
  bankName: { type: 'string', required: true },
  
  // Status tracking
  status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'processed'], default: 'pending' },
  priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
  
  // Admin actions
  reviewedBy: { type: 'ObjectId', ref: 'auth_users', default: null },
  reviewedAt: { type: 'date', default: null },
  adminRemarks: { type: 'string', default: '' },
  rejectionReason: { type: 'string', default: '' },
  
  // Processing details
  processedAt: { type: 'date', default: null },
  transactionReference: { type: 'string', default: '' },
  processingFee: { type: 'number', default: 0 },
  actualPaidAmount: { type: 'number', default: 0 },
  
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
};

// ==================== ORGANIZATION EARNINGS SCHEMA ====================
export const organizationEarningsSchema = {
  _id: { type: 'ObjectId', auto: true },
  organizationId: { type: 'ObjectId', required: true, ref: 'organizations' },
  
  // Current balances
  totalEarnings: { type: 'number', default: 0 },       // All-time total earnings
  immediateEarnings: { type: 'number', default: 0 },   // 80% payments (available immediately)
  pendingEarnings: { type: 'number', default: 0 },     // 20% payments (pending admin approval)
  requestedEarnings: { type: 'number', default: 0 },   // Currently requested for withdrawal
  paidEarnings: { type: 'number', default: 0 },        // Already paid out
  
  // Statistics
  totalTransactions: { type: 'number', default: 0 },
  totalWithdrawals: { type: 'number', default: 0 },
  averageTransactionAmount: { type: 'number', default: 0 },
  
  // Last activity
  lastTransactionAt: { type: 'date', default: null },
  lastWithdrawalAt: { type: 'date', default: null },
  
  createdAt: { type: 'date', default: Date.now },
  updatedAt: { type: 'date', default: Date.now }
};

// ==================== ADMIN PAYOUT DASHBOARD SCHEMA ====================
export const adminPayoutStatsSchema = {
  _id: { type: 'ObjectId', auto: true },
  
  // System-wide stats
  totalRevenue: { type: 'number', default: 0 },
  totalPlatformFees: { type: 'number', default: 0 },
  totalOrganizationPayouts: { type: 'number', default: 0 },
  pendingWithdrawals: { type: 'number', default: 0 },
  
  // Monthly stats
  monthlyRevenue: { type: 'number', default: 0 },
  monthlyPayouts: { type: 'number', default: 0 },
  currentMonth: { type: 'string', required: true }, // Format: YYYY-MM
  
  // Request stats
  pendingRequestsCount: { type: 'number', default: 0 },
  approvedRequestsCount: { type: 'number', default: 0 },
  rejectedRequestsCount: { type: 'number', default: 0 },
  
  lastUpdated: { type: 'date', default: Date.now }
};