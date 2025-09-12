# Event Tribe Stripe 80/20 Payment Split Flow

This document explains the 80/20 payment split flow for event ticket sales on Event Tribe, where organizers receive 80% of ticket sales and the platform keeps 20% as commission.

## Prerequisites

Before testing, make sure you have:

1. A Stripe account with Connect API enabled
2. Valid Stripe API keys in your `.env` file:
   - `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with sk_)
   - `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (starts with pk_)
   - `STRIPE_WEBHOOK_SECRET` - (Optional) For webhook processing

## Payment Flow Overview

1. **Organizer Setup**
   - Organizer signs up on the platform
   - Organizer creates a Stripe Connect account through our API
   - Stripe verifies the organizer's banking details

2. **Attendee Ticket Purchase**
   - Attendee selects tickets and proceeds to checkout
   - Backend creates a Payment Intent with the 80/20 split
   - Attendee completes payment using Stripe Elements
   - Payment succeeds and tickets are confirmed

3. **Commission Split**
   - Platform collects 100% of the payment initially
   - 80% is automatically transferred to the organizer's Stripe account
   - 20% is retained by the platform

4. **Organizer Payout**
   - Organizer can request payouts from their available balance
   - Payouts are processed through Stripe Connect
   - Money arrives in organizer's bank account (timing depends on country)

## Testing with Postman

Import the provided Postman collection to test the complete flow:

1. Import `stripe-payment-flow-postman-collection.json` into Postman
2. Create an environment with these variables:
   - `baseUrl`: Your API base URL (e.g., http://localhost:3000)
   - `token`: Will be set automatically after login
   - `adminToken`: Set this manually by logging in as an admin
   - `userId`: Will be set automatically after login
   - `eventId`: Set this to a valid event ID from your database
   - `stripeConnectAccountId`: Will be set after creating a Connect account
   - `paymentIntentId`: Will be set after creating a payment intent
   - `clientSecret`: Will be set after creating a payment intent
   - `payoutRequestId`: Set this when testing admin approvals

3. Follow the request flow in the collection:
   - Authenticate as organizer
   - Create a Stripe Connect account for the organizer
   - Generate and use the onboarding link for bank setup
   - Create a payment intent for an event ticket
   - Confirm the payment
   - Check organizer balance
   - Request payout as organizer
   - Approve/reject payout as admin

## Implementation Notes

- The platform initially receives the full payment amount
- An immediate transfer of 80% to the organizer happens automatically
- The remaining 20% is held by the platform as commission
- For transfers, we use Stripe's Transfer API with the destination being the organizer's connected account
- Webhook handling is crucial for capturing payment events

## Troubleshooting

- **"You can only create new accounts if you've signed up for Connect"**: Ensure your Stripe account has Connect enabled and you're using the correct API keys
- **"Invalid API key provided"**: Check that your .env file has the correct Stripe API keys
- **"This account cannot currently make transfers"**: The organizer's Stripe account may not be fully verified

## Need Help?

If you encounter any issues with the Stripe integration, check:
1. That your Stripe API keys are correct in the .env file
2. Your Stripe account has Connect capabilities enabled
3. The server logs for detailed error messages
4. The Stripe Dashboard for payment/transfer status
