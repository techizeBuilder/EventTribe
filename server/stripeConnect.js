/**
 * Stripe Connect Service - Handles organizer onboarding and payouts
 */

import Stripe from "stripe";
import { mongoStorage } from "./mongodb-storage.js";
import { ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
});

class StripeConnectService {
  constructor() {
    this.stripe = stripe;
  }

  /**
   * Create a Stripe Connect account for an organizer
   */
  async createConnectedAccount(organizerData) {
    try {
      const { email, firstName, lastName, businessName, country = 'US' } = organizerData;

      const account = await this.stripe.accounts.create({
        type: 'express',
        country: country,
        email: email,
        metadata: {
          organizerId: organizerData.organizerId,
          businessName: businessName || `${firstName} ${lastName}`
        }
      });

      console.log(`[Stripe Connect] Created account ${account.id} for organizer ${organizerData.organizerId}`);

      return account;
    } catch (error) {
      console.error('[Stripe Connect] Error creating connected account:', error);
      throw error;
    }
  }

  /**
   * Create onboarding link for organizer
   */
  async createOnboardingLink(accountId, returnUrl, refreshUrl) {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      console.log(`[Stripe Connect] Created onboarding link for account ${accountId}`);

      return accountLink;
    } catch (error) {
      console.error('[Stripe Connect] Error creating onboarding link:', error);
      throw error;
    }
  }

  /**
   * Get account status and capabilities
   */
  async getAccountStatus(accountId) {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);

      return {
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        capabilities: account.capabilities,
        requirements: account.requirements
      };
    } catch (error) {
      console.error('[Stripe Connect] Error getting account status:', error);
      throw error;
    }
  }

  /**
   * Create transfer to connected account (80% immediate)
   */
  async createTransfer(organizerAccountId, amount, paymentIntentId, eventId) {
    try {
      // Calculate 80% for immediate transfer
      const transferAmount = Math.round(amount * 0.80 * 100); // 80% in cents

      const transfer = await this.stripe.transfers.create({
        amount: transferAmount,
        currency: 'usd',
        destination: organizerAccountId,
        metadata: {
          paymentIntentId: paymentIntentId,
          eventId: eventId,
          type: 'immediate_payout'
        }
      });

      console.log(`[Stripe Connect] Created transfer ${transfer.id} of $${transferAmount / 100} to ${organizerAccountId}`);

      return transfer;
    } catch (error) {
      console.error('[Stripe Connect] Error creating transfer:', error);
      throw error;
    }
  }

  /**
   * Create payout to bank account (20% after approval)
   */
  async createPayout(accountId, amount, withdrawalRequestId) {
    try {
      const payoutAmount = Math.round(amount * 100); // Convert to cents

      const payout = await this.stripe.payouts.create({
        amount: payoutAmount,
        currency: 'usd',
        metadata: {
          withdrawalRequestId: withdrawalRequestId,
          type: 'approved_withdrawal'
        }
      }, {
        stripeAccount: accountId
      });

      console.log(`[Stripe Connect] Created payout ${payout.id} of $${amount} for account ${accountId}`);

      return payout;
    } catch (error) {
      console.error('[Stripe Connect] Error creating payout:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId) {
    try {
      const balance = await this.stripe.balance.retrieve({
        stripeAccount: accountId
      });

      return {
        available: balance.available,
        pending: balance.pending
      };
    } catch (error) {
      console.error('[Stripe Connect] Error getting account balance:', error);
      throw error;
    }
  }

  /**
   * List transfers for an account
   */
  async listTransfers(accountId, limit = 10) {
    try {
      const transfers = await this.stripe.transfers.list({
        destination: accountId,
        limit: limit
      });

      return transfers.data;
    } catch (error) {
      console.error('[Stripe Connect] Error listing transfers:', error);
      throw error;
    }
  }

  /**
   * List payouts for an account
   */
  async listPayouts(accountId, limit = 10) {
    try {
      const payouts = await this.stripe.payouts.list({
        limit: limit
      }, {
        stripeAccount: accountId
      });

      return payouts.data;
    } catch (error) {
      console.error('[Stripe Connect] Error listing payouts:', error);
      throw error;
    }
  }
}

export const stripeConnectService = new StripeConnectService();