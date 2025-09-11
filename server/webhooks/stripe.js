import { stripeConnectService } from '../stripeConnect.js';
import { mongoStorage } from '../mongodb-storage.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil'
});

const handlePaymentIntentSucceeded = async (event) => {
  const paymentIntent = event.data.object;
  const { eventId, organizerId, platformFee } = paymentIntent.metadata;
  
  try {
    // 1. Fetch event and organizer details
    await mongoStorage.connect();
    const eventsCollection = mongoStorage.db.collection('events');
    const event = await eventsCollection.findOne({ _id: eventId });
    
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    // 2. Process immediate 80% transfer to organizer
    const transferAmount = Math.round(paymentIntent.amount * 0.8); // 80% of total
    const transfer = await stripeConnectService.createTransfer(
      event.organizerStripeAccountId,
      transferAmount,
      paymentIntent.id,
      eventId
    );

    // 3. Track the 20% commission in pending_payouts collection
    const pendingPayoutsCollection = mongoStorage.db.collection('pending_payouts');
    await pendingPayoutsCollection.insertOne({
      organizerId: event.organizerId,
      eventId: eventId,
      paymentIntentId: paymentIntent.id,
      amount: Math.round(paymentIntent.amount * 0.2), // 20% of total
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Successfully processed payment: PI=${paymentIntent.id}, Transfer=${transfer.id}`);
  } catch (error) {
    console.error('Error handling payment_intent.succeeded:', error);
    throw error;
  }
};

const handleTransferPaid = async (event) => {
  const transfer = event.data.object;
  try {
    await mongoStorage.connect();
    const transfersCollection = mongoStorage.db.collection('transfers');
    await transfersCollection.updateOne(
      { stripeTransferId: transfer.id },
      { 
        $set: { 
          status: 'paid',
          updatedAt: new Date()
        }
      }
    );
  } catch (error) {
    console.error('Error handling transfer.paid:', error);
    throw error;
  }
};

const handlePayoutPaid = async (event) => {
  const payout = event.data.object;
  try {
    await mongoStorage.connect();
    const payoutsCollection = mongoStorage.db.collection('payouts');
    await payoutsCollection.updateOne(
      { stripePayoutId: payout.id },
      { 
        $set: { 
          status: 'paid',
          updatedAt: new Date()
        }
      }
    );
  } catch (error) {
    console.error('Error handling payout.paid:', error);
    throw error;
  }
};

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: err.message });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event);
        break;
      case 'transfer.paid':
        await handleTransferPaid(event);
        break;
      case 'payout.paid':
        await handlePayoutPaid(event);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};
