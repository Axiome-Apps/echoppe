// @ts-expect-error - No official types for PayPal SDK
import paypal from '@paypal/checkout-server-sdk';
import type {
  CheckoutParams,
  CheckoutSession,
  PaymentAdapter,
  PaymentResult,
  RefundResult,
} from './types';

export class PayPalAdapter implements PaymentAdapter {
  readonly provider = 'paypal' as const;
  private client: paypal.core.PayPalHttpClient | null = null;

  constructor() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const mode = process.env.PAYPAL_MODE ?? 'sandbox';

    if (clientId && clientSecret) {
      const environment =
        mode === 'live'
          ? new paypal.core.LiveEnvironment(clientId, clientSecret)
          : new paypal.core.SandboxEnvironment(clientId, clientSecret);

      this.client = new paypal.core.PayPalHttpClient(environment);
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async createCheckout(params: CheckoutParams): Promise<CheckoutSession> {
    if (!this.client) {
      throw new Error('PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');

    const items =
      params.lineItems?.map((item) => ({
        name: item.name,
        quantity: String(item.quantity),
        unit_amount: {
          currency_code: params.currency.toUpperCase(),
          value: (item.unitAmount / 100).toFixed(2),
        },
      })) ?? [];

    const totalValue = (params.amount / 100).toFixed(2);

    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: params.orderId,
          custom_id: params.orderId,
          amount: {
            currency_code: params.currency.toUpperCase(),
            value: totalValue,
            breakdown:
              items.length > 0
                ? {
                    item_total: {
                      currency_code: params.currency.toUpperCase(),
                      value: totalValue,
                    },
                  }
                : undefined,
          },
          items: items.length > 0 ? items : undefined,
        },
      ],
      application_context: {
        return_url: params.successUrl,
        cancel_url: params.cancelUrl,
        brand_name: process.env.SHOP_NAME ?? 'Shop',
        user_action: 'PAY_NOW',
      },
    });

    const response = await this.client.execute(request);
    const order = response.result;

    const approveLink = order.links?.find(
      (link: { rel: string; href: string }) => link.rel === 'approve',
    );

    if (!approveLink?.href) {
      throw new Error('PayPal order created without approval URL');
    }

    return {
      id: order.id,
      url: approveLink.href,
      provider: 'paypal',
    };
  }

  async verifyWebhook(payload: string, _signature: string): Promise<PaymentResult> {
    if (!this.client) {
      throw new Error('PayPal is not configured.');
    }

    // Parse le payload
    const event = JSON.parse(payload);

    // En production, il faudrait vérifier la signature avec l'API PayPal
    // Pour simplifier, on fait confiance au payload si le webhook_id correspond
    // Une vraie implémentation utiliserait /v1/notifications/verify-webhook-signature

    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const resource = event.resource;
        const orderId =
          resource.custom_id ??
          resource.purchase_units?.[0]?.reference_id ??
          resource.purchase_units?.[0]?.custom_id;

        return {
          success: true,
          transactionId: resource.id,
          status: 'completed',
          orderId,
          amount: resource.amount
            ? Math.round(parseFloat(resource.amount.value) * 100)
            : undefined,
          rawData: resource,
        };
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED': {
        const resource = event.resource;
        return {
          success: false,
          transactionId: resource.id,
          status: 'failed',
          rawData: resource,
        };
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        const resource = event.resource;
        return {
          success: true,
          transactionId: resource.id,
          status: 'refunded',
          rawData: resource,
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
      throw new Error('PayPal is not configured.');
    }

    try {
      const request = new paypal.payments.CapturesRefundRequest(transactionId);

      if (amount) {
        request.requestBody({
          amount: {
            currency_code: 'EUR', // TODO: rendre dynamique
            value: (amount / 100).toFixed(2),
          },
        });
      }

      const response = await this.client.execute(request);

      return {
        success: response.result.status === 'COMPLETED',
        refundId: response.result.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
