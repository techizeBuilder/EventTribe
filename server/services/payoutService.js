/**
 * Payout Service - Handles automatic revenue splits and payout management
 * 80% immediate to organization, 20% pending for admin approval
 */

import { mongoStorage } from '../mongodb-storage.js';
import { ObjectId } from 'mongodb';

class PayoutService {
  constructor() {
    this.ORGANIZATION_SHARE = 0.80; // 80%
    this.PENDING_SHARE = 0.20;      // 20%
    this.PLATFORM_FEE_RATE = 0.03;  // 3% platform fee (optional)
  }

  /**
   * Process payout split when a booking is completed
   * Called after successful payment processing
   */
  async processPayoutSplit(bookingData) {
    try {
      await mongoStorage.connect();
      console.log(`[Payout] Processing payout split for booking: ${bookingData.bookingId}`);
      
      const {
        bookingId,
        eventId,
        organizationId,
        organizerId,
        totalAmount,
        paymentIntentId,
        ticketDetails,
        customerEmail,
        customerName
      } = bookingData;

      // Calculate splits
      const platformFee = totalAmount * this.PLATFORM_FEE_RATE;
      const netAmount = totalAmount - platformFee;
      const organizationShare = netAmount * this.ORGANIZATION_SHARE;
      const pendingAmount = netAmount * this.PENDING_SHARE;

      console.log(`[Payout] Split calculation:`, {
        totalAmount,
        platformFee,
        netAmount,
        organizationShare,
        pendingAmount
      });

      // Create payout transaction record
      const payoutTransaction = {
        bookingId: new ObjectId(bookingId),
        eventId: new ObjectId(eventId),
        organizationId: new ObjectId(organizationId),
        organizerId: new ObjectId(organizerId),
        totalAmount,
        organizationShare,
        pendingAmount,
        platformFee,
        paymentIntentId,
        transactionType: 'ticket_sale',
        status: 'completed',
        ticketDetails,
        customerEmail,
        customerName,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert payout transaction
      const payoutTransactionsCollection = mongoStorage.db.collection('payout_transactions');
      await payoutTransactionsCollection.insertOne(payoutTransaction);

      // Update organization earnings
      await this.updateOrganizationEarnings(organizationId, organizationShare, pendingAmount, totalAmount);

      // Update admin payout stats
      await this.updateAdminPayoutStats(totalAmount, platformFee, organizationShare);

      console.log(`[Payout] Successfully processed payout split for ${organizationShare + pendingAmount} total`);
      
      return {
        success: true,
        organizationShare,
        pendingAmount,
        platformFee,
        transactionId: payoutTransaction._id
      };

    } catch (error) {
      console.error('[Payout] Error processing payout split:', error);
      throw error;
    }
  }

  /**
   * Update organization earnings balances
   */
  async updateOrganizationEarnings(organizationId, immediateAmount, pendingAmount, totalAmount) {
    try {
      const organizationEarningsCollection = mongoStorage.db.collection('organization_earnings');
      const organizationsCollection = mongoStorage.db.collection('organizations');

      // Update or create organization earnings record
      await organizationEarningsCollection.updateOne(
        { organizationId: new ObjectId(organizationId) },
        {
          $inc: {
            totalEarnings: totalAmount,
            immediateEarnings: immediateAmount,
            pendingEarnings: pendingAmount,
            totalTransactions: 1
          },
          $set: {
            lastTransactionAt: new Date(),
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date(),
            paidEarnings: 0,
            requestedEarnings: 0,
            totalWithdrawals: 0,
            averageTransactionAmount: 0,
            lastWithdrawalAt: null
          }
        },
        { upsert: true }
      );

      // Update organization totals (for backwards compatibility)
      await organizationsCollection.updateOne(
        { _id: new ObjectId(organizationId) },
        {
          $inc: {
            totalEarnings: totalAmount,
            pendingEarnings: pendingAmount
          },
          $set: { updatedAt: new Date() }
        }
      );

      // Recalculate average transaction amount
      const earnings = await organizationEarningsCollection.findOne({ organizationId: new ObjectId(organizationId) });
      if (earnings && earnings.totalTransactions > 0) {
        const avgAmount = earnings.totalEarnings / earnings.totalTransactions;
        await organizationEarningsCollection.updateOne(
          { organizationId: new ObjectId(organizationId) },
          { $set: { averageTransactionAmount: avgAmount } }
        );
      }

      console.log(`[Payout] Updated organization ${organizationId} earnings: +$${immediateAmount} immediate, +$${pendingAmount} pending`);

    } catch (error) {
      console.error('[Payout] Error updating organization earnings:', error);
      throw error;
    }
  }

  /**
   * Update admin payout statistics
   */
  async updateAdminPayoutStats(totalAmount, platformFee, organizationPayout) {
    try {
      const adminStatsCollection = mongoStorage.db.collection('admin_payout_stats');
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      await adminStatsCollection.updateOne(
        { currentMonth },
        {
          $inc: {
            totalRevenue: totalAmount,
            totalPlatformFees: platformFee,
            totalOrganizationPayouts: organizationPayout,
            monthlyRevenue: totalAmount,
            monthlyPayouts: organizationPayout
          },
          $set: { lastUpdated: new Date() },
          $setOnInsert: {
            pendingWithdrawals: 0,
            pendingRequestsCount: 0,
            approvedRequestsCount: 0,
            rejectedRequestsCount: 0
          }
        },
        { upsert: true }
      );

    } catch (error) {
      console.error('[Payout] Error updating admin stats:', error);
      throw error;
    }
  }

  /**
   * Create withdrawal request from organization
   */
  async createWithdrawalRequest(requestData) {
    try {
      await mongoStorage.connect();
      console.log(`[Payout] Creating withdrawal request for organization: ${requestData.organizationId}`);

      const {
        organizationId,
        organizerId,
        requestedAmount,
        requestReason,
        bankDetails
      } = requestData;

      // Get current organization earnings
      const earningsCollection = mongoStorage.db.collection('organization_earnings');
      const earnings = await earningsCollection.findOne({ organizationId: new ObjectId(organizationId) });

      if (!earnings) {
        throw new Error('No earnings record found for organization');
      }

      // Check available balance (pending earnings that aren't already requested)
      const availableBalance = earnings.pendingEarnings - earnings.requestedEarnings;
      
      if (requestedAmount > availableBalance) {
        throw new Error(`Insufficient balance. Available: $${availableBalance}, Requested: $${requestedAmount}`);
      }

      // Create withdrawal request
      const withdrawalRequest = {
        organizationId: new ObjectId(organizationId),
        organizerId: new ObjectId(organizerId),
        requestedAmount,
        availableBalance,
        requestReason: requestReason || '',
        bankAccountNumber: bankDetails.accountNumber,
        bankRoutingNumber: bankDetails.routingNumber,
        bankAccountHolderName: bankDetails.accountHolderName,
        bankName: bankDetails.bankName,
        status: 'pending',
        priority: 'medium',
        reviewedBy: null,
        reviewedAt: null,
        adminRemarks: '',
        rejectionReason: '',
        processedAt: null,
        transactionReference: '',
        processingFee: 0,
        actualPaidAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Insert withdrawal request
      const withdrawalRequestsCollection = mongoStorage.db.collection('withdrawal_requests');
      const result = await withdrawalRequestsCollection.insertOne(withdrawalRequest);

      // Update organization earnings to mark amount as requested
      await earningsCollection.updateOne(
        { organizationId: new ObjectId(organizationId) },
        {
          $inc: { requestedEarnings: requestedAmount },
          $set: { updatedAt: new Date() }
        }
      );

      // Update admin stats
      await this.updateAdminRequestStats('created', requestedAmount);

      console.log(`[Payout] Created withdrawal request ${result.insertedId} for $${requestedAmount}`);

      return {
        success: true,
        requestId: result.insertedId,
        message: 'Withdrawal request submitted successfully',
        requestedAmount,
        availableBalance: availableBalance - requestedAmount
      };

    } catch (error) {
      console.error('[Payout] Error creating withdrawal request:', error);
      throw error;
    }
  }

  /**
   * Admin: Approve or reject withdrawal request
   */
  async reviewWithdrawalRequest(requestId, action, adminId, remarks = '') {
    try {
      await mongoStorage.connect();
      console.log(`[Payout] Admin ${adminId} reviewing request ${requestId}: ${action}`);

      const withdrawalRequestsCollection = mongoStorage.db.collection('withdrawal_requests');
      const earningsCollection = mongoStorage.db.collection('organization_earnings');

      // Get the request
      const request = await withdrawalRequestsCollection.findOne({ _id: new ObjectId(requestId) });
      if (!request) {
        throw new Error('Withdrawal request not found');
      }

      if (request.status !== 'pending') {
        throw new Error(`Request is already ${request.status}`);
      }

      const updateData = {
        reviewedBy: new ObjectId(adminId),
        reviewedAt: new Date(),
        adminRemarks: remarks,
        updatedAt: new Date()
      };

      if (action === 'approve') {
        updateData.status = 'approved';
        
        // Move amount from pending to processing
        await earningsCollection.updateOne(
          { organizationId: request.organizationId },
          {
            $inc: {
              pendingEarnings: -request.requestedAmount,
              requestedEarnings: -request.requestedAmount,
              totalWithdrawals: 1
            },
            $set: {
              lastWithdrawalAt: new Date(),
              updatedAt: new Date()
            }
          }
        );

        await this.updateAdminRequestStats('approved', request.requestedAmount);

      } else if (action === 'reject') {
        updateData.status = 'rejected';
        updateData.rejectionReason = remarks;
        
        // Return amount to available balance
        await earningsCollection.updateOne(
          { organizationId: request.organizationId },
          {
            $inc: { requestedEarnings: -request.requestedAmount },
            $set: { updatedAt: new Date() }
          }
        );

        await this.updateAdminRequestStats('rejected', request.requestedAmount);
      }

      // Update the request
      await withdrawalRequestsCollection.updateOne(
        { _id: new ObjectId(requestId) },
        { $set: updateData }
      );

      console.log(`[Payout] Request ${requestId} ${action}ed by admin ${adminId}`);

      return {
        success: true,
        action,
        requestId,
        message: `Request ${action}ed successfully`
      };

    } catch (error) {
      console.error(`[Payout] Error ${action}ing withdrawal request:`, error);
      throw error;
    }
  }

  /**
   * Update admin request statistics
   */
  async updateAdminRequestStats(action, amount) {
    try {
      const adminStatsCollection = mongoStorage.db.collection('admin_payout_stats');
      const currentMonth = new Date().toISOString().slice(0, 7);

      const updateData = { lastUpdated: new Date() };

      if (action === 'created') {
        updateData.$inc = {
          pendingWithdrawals: amount,
          pendingRequestsCount: 1
        };
      } else if (action === 'approved') {
        updateData.$inc = {
          pendingWithdrawals: -amount,
          pendingRequestsCount: -1,
          approvedRequestsCount: 1
        };
      } else if (action === 'rejected') {
        updateData.$inc = {
          pendingWithdrawals: -amount,
          pendingRequestsCount: -1,
          rejectedRequestsCount: 1
        };
      }

      await adminStatsCollection.updateOne(
        { currentMonth },
        updateData,
        { upsert: true }
      );

    } catch (error) {
      console.error('[Payout] Error updating admin request stats:', error);
    }
  }

  /**
   * Get organization earnings summary
   */
  async getOrganizationEarnings(organizationId) {
    try {
      await mongoStorage.connect();
      const earningsCollection = mongoStorage.db.collection('organization_earnings');
      const bookingsCollection = mongoStorage.db.collection('bookings');
      const withdrawalRequestsCollection = mongoStorage.db.collection('withdrawal_requests');
      
      // Get stored earnings data
      let earnings = await earningsCollection.findOne({ organizationId: new ObjectId(organizationId) });
      
      // Calculate real-time earnings from confirmed bookings
      // First get all events for this organization/user, then find bookings for those events
      const eventsCollection = mongoStorage.db.collection('events');
      const organizerEvents = await eventsCollection.find({
        $or: [
          { organizerId: organizationId.toString() },
          { organizationId: organizationId.toString() }
        ]
      }).toArray();

      let confirmedBookings = [];
      if (organizerEvents.length > 0) {
        const eventIds = organizerEvents.map(event => event._id);
        confirmedBookings = await bookingsCollection.find({
          eventId: { $in: eventIds },
          status: 'confirmed'
        }).toArray();
      }

      let totalRevenue = 0;
      let totalTransactions = 0;

      if (confirmedBookings && confirmedBookings.length > 0) {
        totalRevenue = confirmedBookings.reduce((sum, booking) => {
          const amount = parseFloat(booking.totalAmount || booking.amount) || 0;
          if (amount > 0) {
            totalTransactions++;
            return sum + amount;
          }
          return sum;
        }, 0);
      }

      // Calculate 80/20 split
      const platformFee = totalRevenue * this.PLATFORM_FEE_RATE;
      const netAmount = totalRevenue - platformFee;
      const immediateEarnings = netAmount * this.ORGANIZATION_SHARE; // 80%
      const pendingEarnings = netAmount * this.PENDING_SHARE; // 20%

      // Get pending and processed withdrawal requests
      const withdrawalRequests = await withdrawalRequestsCollection.find({
        organizationId: new ObjectId(organizationId)
      }).toArray();

      let requestedEarnings = 0;
      let paidEarnings = 0;
      let totalWithdrawals = 0;

      if (withdrawalRequests && withdrawalRequests.length > 0) {
        withdrawalRequests.forEach(request => {
          const amount = parseFloat(request.requestedAmount) || 0;
          if (request.status === 'pending') {
            requestedEarnings += amount;
          } else if (request.status === 'approved' || request.status === 'processed') {
            paidEarnings += amount;
            totalWithdrawals++;
          }
        });
      }

      // Available for withdrawal = pending earnings - already requested amounts
      const availableForWithdrawal = Math.max(0, pendingEarnings - requestedEarnings);

      const calculatedEarnings = {
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

      // Update the earnings collection with real-time data
      if (earnings) {
        await earningsCollection.updateOne(
          { organizationId: new ObjectId(organizationId) },
          { 
            $set: {
              ...calculatedEarnings,
              updatedAt: new Date()
            }
          }
        );
      } else {
        await earningsCollection.insertOne({
          organizationId: new ObjectId(organizationId),
          ...calculatedEarnings,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return calculatedEarnings;

    } catch (error) {
      console.error('[Payout] Error getting organization earnings:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal requests for organization
   */
  async getOrganizationWithdrawals(organizationId, status = null) {
    try {
      await mongoStorage.connect();
      const withdrawalRequestsCollection = mongoStorage.db.collection('withdrawal_requests');
      
      const filter = { organizationId: new ObjectId(organizationId) };
      if (status) {
        filter.status = status;
      }

      const requests = await withdrawalRequestsCollection
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

      return requests;

    } catch (error) {
      console.error('[Payout] Error getting organization withdrawals:', error);
      throw error;
    }
  }

  /**
   * Get all withdrawal requests for admin
   */
  async getAllWithdrawalRequests(status = null, page = 1, limit = 20) {
    try {
      await mongoStorage.connect();
      const withdrawalRequestsCollection = mongoStorage.db.collection('withdrawal_requests');
      const organizationsCollection = mongoStorage.db.collection('organizations');
      
      const filter = status ? { status } : {};
      const skip = (page - 1) * limit;

      // Get requests with organization details
      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: 'organizations',
            localField: 'organizationId',
            foreignField: '_id',
            as: 'organization'
          }
        },
        { $unwind: '$organization' },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ];

      const requests = await withdrawalRequestsCollection.aggregate(pipeline).toArray();
      const totalCount = await withdrawalRequestsCollection.countDocuments(filter);

      return {
        requests,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      };

    } catch (error) {
      console.error('[Payout] Error getting all withdrawal requests:', error);
      throw error;
    }
  }

  /**
   * Get admin payout dashboard stats
   */
  async getAdminPayoutStats() {
    try {
      await mongoStorage.connect();
      const adminStatsCollection = mongoStorage.db.collection('admin_payout_stats');
      const currentMonth = new Date().toISOString().slice(0, 7);

      const stats = await adminStatsCollection.findOne({ currentMonth });
      
      if (!stats) {
        return {
          totalRevenue: 0,
          totalPlatformFees: 0,
          totalOrganizationPayouts: 0,
          pendingWithdrawals: 0,
          monthlyRevenue: 0,
          monthlyPayouts: 0,
          pendingRequestsCount: 0,
          approvedRequestsCount: 0,
          rejectedRequestsCount: 0,
          currentMonth
        };
      }

      return stats;

    } catch (error) {
      console.error('[Payout] Error getting admin payout stats:', error);
      throw error;
    }
  }
}

export const payoutService = new PayoutService();