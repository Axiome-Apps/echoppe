// @ts-expect-error - No official types for PayPal SDK
import paypal from '@paypal/checkout-server-sdk';
import type {
  CheckoutParams,
  CheckoutSession,
  PaymentAdapter,
  PaymentResult,
  RefundResult,
} from './types';
import { getProviderCredentials, getProviderStatus } from './config';

export class PayPalAdapter implements PaymentAdapter {
  readonly provider = 'paypal' as const;
  private client: paypal.core.PayPalHttpClient | null = null;
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const credentials = await getProviderCredentials('paypal');
    if (credentials) {
      const environment =
        credentials.mode === 'live'
          ? new paypal.core.LiveEnvironment(credentials.clientId, credentials.clientSecret)
          : new paypal.core.SandboxEnvironment(credentials.clientId, credentials.clientSecret);

      this.client = new paypal.core.PayPalHttpClient(environment);
    }
    this.initialized = true;
  }

  async isConfigured(): Promise<boolean> {
    const status = await getProviderStatus('paypal');
    return status.isConfigured && status.isEnabled;
  }

  async createCheckout(params: CheckoutParams): Promise<CheckoutSession> {
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('PayPal is not configured.');
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
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('PayPal is not configured.');
    }

    // TODO: Implement proper PayPal webhook signature verification
    // This requires the webhook_id in credentials and all PayPal-specific headers
    // (paypal-auth-algo, paypal-cert-url, paypal-transmission-id, paypal-transmission-sig, paypal-transmission-time)
    // For now, we rely on the webhook URL being secret and HTTPS
    console.warn('[PayPal] Webhook signature verification not implemented - ensure webhook URL is secret');

    const event = JSON.parse(payload);

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
    await this.ensureInitialized();

    if (!this.client) {
      throw new Error('PayPal is not configured.');
    }

    try {
      const request = new paypal.payments.CapturesRefundRequest(transactionId);

      if (amount) {
        request.requestBody({
          amount: {
            currency_code: 'EUR',
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
