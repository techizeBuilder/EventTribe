import express from 'express';
import { stripeConnectService } from '../stripeConnect.js';
import { mongoStorage } from '../mongodb-storage.js';
import { ObjectId } from 'mongodb';
import { authenticateOrganizer } from '../middleware/auth.js';

const router = express.Router();

// Get organizer's pending commission balance
router.get('/commission-balance', authenticateOrganizer, async (req, res) => {
    try {
        const { organizerId } = req.user;
        await mongoStorage.connect();
        const pendingPayoutsCollection = mongoStorage.db.collection('pending_payouts');

        const pendingAmount = await pendingPayoutsCollection.aggregate([
            {
                $match: {
                    organizerId: new ObjectId(organizerId),
                    status: 'pending'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]).toArray();

        const balance = pendingAmount[0]?.total || 0;
        res.json({ balance });
    } catch (error) {
        console.error('Error fetching commission balance:', error);
        res.status(500).json({ error: 'Failed to fetch balance' });
    }
});

// Request commission payout (20%)
router.post('/request-commission-payout', authenticateOrganizer, async (req, res) => {
    try {
        const { organizerId } = req.user;
        const { eventIds, reason } = req.body;

        if (!eventIds || !Array.isArray(eventIds)) {
            return res.status(400).json({ error: 'Event IDs are required' });
        }

        await mongoStorage.connect();
        const pendingPayoutsCollection = mongoStorage.db.collection('pending_payouts');

        // Get all pending payouts for the specified events
        const payouts = await pendingPayoutsCollection.find({
            organizerId: new ObjectId(organizerId),
            eventId: { $in: eventIds.map(id => new ObjectId(id)) },
            status: 'pending'
        }).toArray();

        if (payouts.length === 0) {
            return res.status(404).json({ error: 'No pending payouts found' });
        }

        // Calculate total amount
        const totalAmount = payouts.reduce((sum, payout) => sum + payout.amount, 0);

        // Create payout request
        const payoutRequest = {
            _id: new ObjectId(),
            organizerId: new ObjectId(organizerId),
            eventIds: eventIds.map(id => new ObjectId(id)),
            amount: totalAmount,
            status: 'pending_approval',
            payoutIds: payouts.map(p => p._id),
            reason: reason || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const payoutRequestsCollection = mongoStorage.db.collection('payout_requests');
        await payoutRequestsCollection.insertOne(payoutRequest);

        // Update status of individual payouts
        await pendingPayoutsCollection.updateMany(
            { _id: { $in: payouts.map(p => p._id) } },
            {
                $set: {
                    status: 'requested',
                    payoutRequestId: payoutRequest._id,
                    updatedAt: new Date()
                }
            }
        );

        res.json({ success: true, payoutRequest });
    } catch (error) {
        console.error('Error requesting commission payout:', error);
        res.status(500).json({ error: 'Failed to request payout' });
    }
});

// Get payout history
router.get('/payout-history', authenticateOrganizer, async (req, res) => {
    console.log('dfss');
    try {
        const { organizerId } = req.user;
        await mongoStorage.connect();
        const payoutRequestsCollection = mongoStorage.db.collection('payout_requests');

        const history = await payoutRequestsCollection
            .find({
                organizerId: new ObjectId(organizerId)
            })
            .sort({ createdAt: -1 })
            .toArray();

        res.json({ history });
    } catch (error) {
        console.error('Error fetching payout history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

export default router;
