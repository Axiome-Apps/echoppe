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

export {
  getProviderCredentials,
  getProviderStatus,
  saveProviderCredentials,
  setProviderEnabled,
  type PayPalCredentials,
  type StripeCredentials,
} from './config';

import type { PaymentAdapter, PaymentProvider } from './types';
import { StripeAdapter } from './stripe';
import { PayPalAdapter } from './paypal';
import { getProviderStatus } from './config';

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
 * Retourne la liste des providers configurés et activés
 */
export async function getAvailablePaymentProviders(): Promise<PaymentProvider[]> {
  const providers: PaymentProvider[] = ['stripe', 'paypal'];
  const available: PaymentProvider[] = [];

  for (const provider of providers) {
    const status = await getProviderStatus(provider);
    if (status.isConfigured && status.isEnabled) {
      available.push(provider);
    }
  }

  return available;
}

/**
 * Réinitialise les adapters (utile après mise à jour des credentials)
 */
export function resetPaymentAdapters(): void {
  stripeAdapter = null;
  paypalAdapter = null;
}
