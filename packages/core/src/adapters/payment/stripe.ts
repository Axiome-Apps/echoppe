import Stripe from 'stripe';
import type {
  CheckoutParams,
  CheckoutSession,
  PaymentAdapter,
  PaymentResult,
  RefundResult,
} from './types';
import { getProviderCredentials, getProviderStatus } from './config';

export class StripeAdapter implements PaymentAdapter {
  readonly provider = 'stripe' as const;
  private client: Stripe | null = null;
  private webhookSecret: string | null = null;
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const credentials = await getProviderCredentials('stripe');
    if (credentials) {
      this.client = new Stripe(credentials.secretKey);
      this.webhookSecret = credentials.webhookSecret;
    }
    this.initialized = true;
  }

  async isConfigured(): Promise<boolean> {
    const status = await getProviderStatus('stripe');
    return status.isConfigured && status.isEnabled;
  }

  async createCheckout(params: CheckoutParams): Promise<CheckoutSession> {
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('Stripe is not configured.');
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      params.lineItems?.map((item) => ({
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: { name: item.name },
          unit_amount: item.unitAmount,
        },
        quantity: item.quantity,
      })) ?? [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: { name: `Commande ${params.orderId}` },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ];

    const session = await this.client.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      metadata: {
        orderId: params.orderId,
        ...params.metadata,
      },
      client_reference_id: params.orderId,
    });

    if (!session.url) {
      throw new Error('Stripe session created without URL');
    }

    return {
      id: session.id,
      url: session.url,
      provider: 'stripe',
    };
  }

  async verifyWebhook(payload: string, signature: string): Promise<PaymentResult> {
    await this.ensureInitialized();

    if (!this.client || !this.webhookSecret) {
      throw new Error('Stripe webhook is not configured.');
    }

    const event = this.client.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        return {
          success: true,
          transactionId: session.payment_intent as string,
          status: 'completed',
          orderId: session.metadata?.orderId ?? session.client_reference_id ?? undefined,
          amount: session.amount_total ?? undefined,
          rawData: session,
        };
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        return {
          success: false,
          transactionId: session.id,
          status: 'failed',
          orderId: session.metadata?.orderId ?? session.client_reference_id ?? undefined,
          rawData: session,
        };
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        return {
          success: true,
          transactionId: charge.payment_intent as string,
          status: 'refunded',
          amount: charge.amount_refunded,
          rawData: charge,
        };
      }

      default:
        return {
          success: false,
          transactionId: '',
          status: 'pending',
          rawData: event,
        };
    }
  }

  async refund(transactionId: string, amount?: number): Promise<RefundResult> {
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('Stripe is not configured.');
    }

    try {
      const refund = await this.client.refunds.create({
        payment_intent: transactionId,
        amount,
      });

      return {
        success: refund.status === 'succeeded',
        refundId: refund.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
