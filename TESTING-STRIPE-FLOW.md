# Testing the Stripe 80/20 Payment Split Flow

This document provides step-by-step instructions for testing the complete 80/20 payment split flow in Event Tribe.

## Setup Instructions

### 1. Environment Setup

Make sure your `.env` file has the following Stripe configuration:

```
STRIPE_SECRET_KEY="sk_test_51Pk5D1H6mmMoS4kdnU7S7AnJqnQRsIGzsPCM6qA8ekx4eTLFpDGS7TvP1fB1JyJvfbfjoXrEtwj1CbZlf9UpUSEK00VItkryXv"
STRIPE_PUBLISHABLE_KEY="pk_test_51Pk5D1H6mmMoS4kd6Awrn8JkVVUBFuVOYYRz8YNTEpcrpbS9YwMdFj4UiyoFfhsNKwJBxm0PdQ5NGNVYrQ9NSjk900jYKfCMp9"
STRIPE_WEBHOOK_SECRET="whsec_sample_webhook_secret_for_testing"
```

### 2. Start the Server

Run the server with:

```
npm run start
```

### 3. Import Postman Collection

Import the `stripe-payment-flow-postman-collection.json` file into Postman.

## Testing Flow

### Step 1: Organizer Setup

1. **Login as Organizer**
   - Use the "Login" request in the Authentication folder
   - This will set your `token` and `userId` environment variables
   - Note: The system uses either `accessToken` or `token` from the response. The Postman collection automatically handles both formats.

2. **Create Stripe Connect Account**
   - Use the "Create Stripe Connect Account" request
   - The response will include a Stripe Connect account ID that gets stored in the `stripeConnectAccountId` environment variable

3. **Create Onboarding Link**
   - Use the "Create Onboarding Link" request
   - The response includes a URL that the organizer would use to complete their Stripe Connect onboarding

4. **Check Account Status**
   - Use the "Check Account Status" request to verify the account status
   - In a real scenario, the organizer would complete the onboarding form via the link
   - For testing, the account will work in test mode without completing onboarding

### Step 2: Attendee Ticket Purchase

1. **Create Payment Intent**
   - Use the "Create Payment Intent" request
   - This creates a payment intent with an automatic 80/20 split
   - The response includes `paymentIntentId` and `clientSecret`

2. **Complete Payment (Client-side)**
   - In a real scenario, the attendee would complete payment using Stripe Elements
   - For testing, you can use the provided `client/stripe-payment-test.html` page
   - You can also simulate this with "Confirm Payment" in Postman

3. **Verify Payment Split**
   - When payment is successful, 80% is immediately transferred to the organizer's Stripe Connect account
   - 20% remains with the platform

### Step 3: Organizer Payout Management

1. **Check Organizer Balance**
   - Use the "Get Balance" request
   - This shows the available balance in the organizer's account (80% of payments)

2. **Request Payout**
   - Use the "Request Payout" request
   - This creates a payout request in the database
   - The payout must be approved by an admin

3. **View Payout History**
   - Use the "Get Payout History" request
   - This shows all payout requests and their statuses

### Step 4: Admin Commission Management

1. **Login as Admin**
   - Use the "Login" request with admin credentials
   - Set the received token as `adminToken` in your environment

2. **View Pending Payout Requests**
   - Use the "List Pending Payout Requests" request
   - This shows all payout requests pending admin approval
   - Note the `_id` of a request to approve and set it as `payoutRequestId` in your environment

3. **Approve Payout**
   - Use the "Approve Payout Request" request
   - This approves the payout and triggers a transfer to the organizer
   - The 20% commission stays with the platform

## Test Card Numbers

Use these test card numbers for the Stripe Elements form:

- **Successful payment**: 4242 4242 4242 4242
- **Payment requires authentication**: 4000 0025 0000 3155
- **Payment declined**: 4000 0000 0000 9995

For all test cards:
- Expiration date: Any future date
- CVC: Any 3 digits
- Postal code: Any 5 digits

## Webhook Testing

For complete flow testing including webhooks:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward webhooks to your local server:
   ```
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```
3. Use the webhook secret provided by the CLI in your .env file

## Important Notes

- The platform initially receives 100% of the payment
- 80% is automatically transferred to the organizer via Stripe Connect
- The remaining 20% is retained by the platform as commission
- In test mode, payouts to bank accounts are simulated
- In production, actual payouts depend on the banking system in each country
