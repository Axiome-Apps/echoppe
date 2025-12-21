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

export { SendcloudAdapter } from './sendcloud';
export { ColissimoAdapter } from './colissimo';
export { MondialRelayAdapter } from './mondialrelay';

export {
  getShippingProviderCredentials,
  getShippingProviderStatus,
  saveShippingProviderCredentials,
  setShippingProviderEnabled,
  type ColissimoCredentials,
  type MondialRelayCredentials,
  type SendcloudCredentials,
} from './config';

import type { ShippingAdapter, ShippingProvider } from './types';
import { SendcloudAdapter } from './sendcloud';
import { ColissimoAdapter } from './colissimo';
import { MondialRelayAdapter } from './mondialrelay';
import { getShippingProviderStatus } from './config';

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
        sendcloudAdapter = new SendcloudAdapter();
      }
      return sendcloudAdapter;

    case 'colissimo':
      if (!colissimoAdapter) {
        colissimoAdapter = new ColissimoAdapter();
      }
      return colissimoAdapter;

    case 'mondialrelay':
      if (!mondialrelayAdapter) {
        mondialrelayAdapter = new MondialRelayAdapter();
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
