export type {
  CheckoutParams,
  CheckoutSession,
  LineItem,
  PaymentAdapter,
  PaymentProvider,
  PaymentResult,
  PaymentStatus,
  RefundResult,
} from './types';

export { StripeAdapter } from './stripe';
export { PayPalAdapter } from './paypal';

import type { PaymentAdapter, PaymentProvider } from './types';
import { StripeAdapter } from './stripe';
import { PayPalAdapter } from './paypal';

// Singleton instances (lazy-initialized)
let stripeAdapter: StripeAdapter | null = null;
let paypalAdapter: PayPalAdapter | null = null;

/**
 * Retourne l'adapter de paiement pour le provider spécifié
 */
export function getPaymentAdapter(provider: PaymentProvider): PaymentAdapter {
  switch (provider) {
    case 'stripe':
      if (!stripeAdapter) {
        stripeAdapter = new StripeAdapter();
      }
      return stripeAdapter;

    case 'paypal':
      if (!paypalAdapter) {
        paypalAdapter = new PayPalAdapter();
      }
      return paypalAdapter;

    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
}

/**
 * Retourne la liste des providers configurés et disponibles
 */
export function getAvailablePaymentProviders(): PaymentProvider[] {
  const providers: PaymentProvider[] = [];

  const stripe = getPaymentAdapter('stripe');
  if (stripe.isConfigured()) {
    providers.push('stripe');
  }

  const paypal = getPaymentAdapter('paypal');
  if (paypal.isConfigured()) {
    providers.push('paypal');
  }

  return providers;
}
