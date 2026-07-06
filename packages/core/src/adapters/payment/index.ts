export {
  getProviderCredentials,
  getProviderStatus,
  type PayPalCredentials,
  type StripeCredentials,
  saveProviderCredentials,
  setProviderEnabled,
} from './config';
export { PayPalAdapter } from './paypal';
export { StripeAdapter } from './stripe';
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

import { getProviderStatus } from './config';
import { PayPalAdapter } from './paypal';
import { StripeAdapter } from './stripe';
import type { PaymentAdapter, PaymentProvider } from './types';

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
