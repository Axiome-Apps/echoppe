import Stripe from 'stripe';
import type {
  CheckoutParams,
  CheckoutSession,
  PaymentAdapter,
  PaymentResult,
  RefundResult,
} from './types';

export class StripeAdapter implements PaymentAdapter {
  readonly provider = 'stripe' as const;
  private client: Stripe | null = null;
  private webhookSecret: string | null = null;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? null;

    if (secretKey) {
      this.client = new Stripe(secretKey);
    }
  }

  isConfigured(): boolean {
    return this.client !== null && this.webhookSecret !== null;
  }

  async createCheckout(params: CheckoutParams): Promise<CheckoutSession> {
    if (!this.client) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
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
    if (!this.client || !this.webhookSecret) {
      throw new Error('Stripe webhook is not configured.');
    }

    const event = this.client.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    );

    // Traiter les événements de paiement
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
    if (!this.client) {
      throw new Error('Stripe is not configured.');
    }

    try {
      const refund = await this.client.refunds.create({
        payment_intent: transactionId,
        amount, // undefined = remboursement total
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
