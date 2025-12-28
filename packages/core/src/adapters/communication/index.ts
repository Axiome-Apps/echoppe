export type {
  CommunicationAdapter,
  CommunicationConfig,
  CommunicationProvider,
  EmailMessage,
  EmailStatus,
  EmailTemplate,
  SendResult,
} from './types';

export { ResendAdapter } from './resend';
export { BrevoAdapter } from './brevo';
export { SmtpAdapter } from './smtp';

export {
  getAllProvidersStatus,
  getProviderConfig,
  getProviderCredentials,
  getProviderStatus,
  saveProviderCredentials,
  setProviderEnabled,
  type BrevoCredentials,
  type ResendCredentials,
  type SmtpCredentials,
} from './config';

export { renderTemplate } from './templates';

import type { CommunicationAdapter, CommunicationProvider } from './types';
import { ResendAdapter } from './resend';
import { BrevoAdapter } from './brevo';
import { SmtpAdapter } from './smtp';
import { getProviderStatus } from './config';

// Singleton instances (lazy-initialized)
let resendAdapter: ResendAdapter | null = null;
let brevoAdapter: BrevoAdapter | null = null;
let smtpAdapter: SmtpAdapter | null = null;

/**
 * Retourne l'adapter de communication pour le provider spécifié
 */
export function getCommunicationAdapter(provider: CommunicationProvider): CommunicationAdapter {
  switch (provider) {
    case 'resend':
      if (!resendAdapter) {
        resendAdapter = new ResendAdapter();
      }
      return resendAdapter;

    case 'brevo':
      if (!brevoAdapter) {
        brevoAdapter = new BrevoAdapter();
      }
      return brevoAdapter;

    case 'smtp':
      if (!smtpAdapter) {
        smtpAdapter = new SmtpAdapter();
      }
      return smtpAdapter;

    default:
      throw new Error(`Unknown communication provider: ${provider}`);
  }
}

/**
 * Retourne le premier provider configuré et activé
 */
export async function getActiveCommunicationAdapter(): Promise<CommunicationAdapter | null> {
  const providers: CommunicationProvider[] = ['resend', 'brevo', 'smtp'];

  for (const provider of providers) {
    const status = await getProviderStatus(provider);
    if (status.isConfigured && status.isEnabled) {
      return getCommunicationAdapter(provider);
    }
  }

  return null;
}

/**
 * Retourne la liste des providers configurés et activés
 */
export async function getAvailableCommunicationProviders(): Promise<CommunicationProvider[]> {
  const providers: CommunicationProvider[] = ['resend', 'brevo', 'smtp'];
  const available: CommunicationProvider[] = [];

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
export function resetCommunicationAdapters(): void {
  resendAdapter = null;
  brevoAdapter = null;
  smtpAdapter = null;
}
