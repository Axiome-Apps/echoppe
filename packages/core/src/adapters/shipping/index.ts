export { ColissimoAdapter } from './colissimo';
export {
  type ColissimoCredentials,
  getShippingProviderCredentials,
  getShippingProviderStatus,
  type MondialRelayCredentials,
  type SendcloudCredentials,
  saveShippingProviderCredentials,
  setShippingProviderEnabled,
} from './config';
export { MondialRelayAdapter } from './mondialrelay';
export { SendcloudAdapter } from './sendcloud';
export type {
  Address,
  CreateLabelParams,
  GetRatesParams,
  ShipmentLabel,
  ShippingAdapter,
  ShippingProvider,
  ShippingRate,
  TrackingEvent,
} from './types';

import { ColissimoAdapter } from './colissimo';
import { getShippingProviderCredentials, getShippingProviderStatus } from './config';
import { MondialRelayAdapter } from './mondialrelay';
import { SendcloudAdapter } from './sendcloud';
import type { ShippingAdapter, ShippingProvider } from './types';

// Singleton instances (lazy-initialized)
let sendcloudAdapter: SendcloudAdapter | null = null;
let colissimoAdapter: ColissimoAdapter | null = null;
let mondialrelayAdapter: MondialRelayAdapter | null = null;

/**
 * Retourne l'adapter de livraison pour le provider spécifié
 */
export function getShippingAdapter(provider: ShippingProvider): ShippingAdapter {
  switch (provider) {
    case 'sendcloud':
      if (!sendcloudAdapter) {
        sendcloudAdapter = new SendcloudAdapter({
          get: () => getShippingProviderCredentials('sendcloud'),
        });
      }
      return sendcloudAdapter;

    case 'colissimo':
      if (!colissimoAdapter) {
        colissimoAdapter = new ColissimoAdapter({
          get: () => getShippingProviderCredentials('colissimo'),
        });
      }
      return colissimoAdapter;

    case 'mondialrelay':
      if (!mondialrelayAdapter) {
        mondialrelayAdapter = new MondialRelayAdapter({
          get: () => getShippingProviderCredentials('mondialrelay'),
        });
      }
      return mondialrelayAdapter;

    default:
      throw new Error(`Unknown shipping provider: ${provider}`);
  }
}

/**
 * Retourne la liste des providers configurés et activés
 */
export async function getAvailableShippingProviders(): Promise<ShippingProvider[]> {
  const providers: ShippingProvider[] = ['sendcloud', 'colissimo', 'mondialrelay'];
  const available: ShippingProvider[] = [];

  for (const provider of providers) {
    const status = await getShippingProviderStatus(provider);
    if (status.isConfigured && status.isEnabled) {
      available.push(provider);
    }
  }

  return available;
}

/**
 * Réinitialise les adapters (utile après mise à jour des credentials)
 */
export function resetShippingAdapters(): void {
  sendcloudAdapter = null;
  colissimoAdapter = null;
  mondialrelayAdapter = null;
}
