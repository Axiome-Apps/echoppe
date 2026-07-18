export { BrevoAdapter } from './brevo';
export {
  type BrevoCredentials,
  getAllProvidersStatus,
  getProviderConfig,
  getProviderCredentials,
  getProviderStatus,
  type ResendCredentials,
  type SmtpCredentials,
  saveProviderCredentials,
  setProviderEnabled,
} from './config';
export { ResendAdapter } from './resend';
export { SmtpAdapter } from './smtp';
export { renderTemplate } from './templates';
export type {
  CommunicationAdapter,
  CommunicationConfig,
  CommunicationCredentialStore,
  CommunicationProvider,
  EmailMessage,
  EmailStatus,
  EmailTemplate,
  SendResult,
} from './types';

import { BrevoAdapter } from './brevo';
import { getProviderConfig, getProviderCredentials, getProviderStatus } from './config';
import { ResendAdapter } from './resend';
import { SmtpAdapter } from './smtp';
import type { CommunicationAdapter, CommunicationProvider } from './types';

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
        resendAdapter = new ResendAdapter({
          getCredentials: () => getProviderCredentials('resend'),
          getConfig: () => getProviderConfig('resend'),
        });
      }
      return resendAdapter;

    case 'brevo':
      if (!brevoAdapter) {
        brevoAdapter = new BrevoAdapter({
          getCredentials: () => getProviderCredentials('brevo'),
          getConfig: () => getProviderConfig('brevo'),
        });
      }
      return brevoAdapter;

    case 'smtp':
      if (!smtpAdapter) {
        smtpAdapter = new SmtpAdapter({
          getCredentials: () => getProviderCredentials('smtp'),
          getConfig: () => getProviderConfig('smtp'),
        });
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
