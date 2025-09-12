import express from 'express';
import { stripeConnectService } from '../stripeConnect.js';
import { mongoStorage } from '../mongodb-storage.js';
import { ObjectId } from 'mongodb';
import { isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// List all pending payout requests
router.get('/payout-requests', isAdmin, async (req, res) => {
  try {
    await mongoStorage.connect();
    const pendingPayoutsCollection = mongoStorage.db.collection('pending_payouts');
    
    const requests = await pendingPayoutsCollection
      .find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ payoutRequests: requests });
  } catch (error) {
    console.error('Error fetching payout requests:', error);
    res.status(500).json({ error: 'Failed to fetch payout requests' });
  }
});

// Approve payout request
router.post('/approve-payout', isAdmin, async (req, res) => {
  try {
    const { payoutRequestId, organizerId } = req.body;
    if (!payoutRequestId || !organizerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await mongoStorage.connect();
    const pendingPayoutsCollection = mongoStorage.db.collection('pending_payouts');
    const organizersCollection = mongoStorage.db.collection('users');

    // 1. Get payout request details
    const request = await pendingPayoutsCollection.findOne({
      _id: new ObjectId(payoutRequestId)
    });

    if (!request) {
      return res.status(404).json({ error: 'Payout request not found' });
    }

    // 2. Get organizer's Stripe account
    const organizer = await organizersCollection.findOne({
      _id: new ObjectId(organizerId)
    });

    if (!organizer?.stripeConnectedAccountId) {
      return res.status(400).json({
        error: 'Organizer not set up for payouts'
      });
    }

    // 3. Create transfer for the 20% commission
    const transfer = await stripeConnectService.createTransfer(
      organizer.stripeConnectedAccountId,
      request.amount,
      request.paymentIntentId,
      request.eventId
    );

    // 4. Update payout request status
    await pendingPayoutsCollection.updateOne(
      { _id: new ObjectId(payoutRequestId) },
      {
        $set: {
          status: 'approved',
          stripeTransferId: transfer.id,
          approvedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    res.json({ success: true, transfer });
  } catch (error) {
    console.error('Error approving payout:', error);
    res.status(500).json({ error: 'Failed to approve payout' });
  }
});

// Reject payout request
router.post('/reject-payout', isAdmin, async (req, res) => {
  try {
    const { payoutRequestId, reason } = req.body;
    if (!payoutRequestId) {
      return res.status(400).json({ error: 'Missing payout request ID' });
    }

    await mongoStorage.connect();
    const pendingPayoutsCollection = mongoStorage.db.collection('pending_payouts');

    await pendingPayoutsCollection.updateOne(
      { _id: new ObjectId(payoutRequestId) },
      {
        $set: {
          status: 'rejected',
          rejectionReason: reason || '',
          rejectedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting payout:', error);
    res.status(500).json({ error: 'Failed to reject payout' });
  }
});

export default router;
