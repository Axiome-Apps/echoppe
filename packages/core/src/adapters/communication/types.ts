// SSOT des providers de communication — ajouter un provider = l'inscrire ici (+ adapter +
// credentials). Registre, listings et schémas de route en dérivent, jamais de liste codée en dur.
export const COMMUNICATION_PROVIDERS = ['resend', 'brevo', 'smtp'] as const;
export type CommunicationProvider = (typeof COMMUNICATION_PROVIDERS)[number];

export function isCommunicationProvider(value: string): value is CommunicationProvider {
  return (COMMUNICATION_PROVIDERS as readonly string[]).includes(value);
}
export type EmailStatus = 'sent' | 'failed' | 'bounced';
export type EmailTemplate =
  | 'order-confirmation'
  | 'shipment'
  | 'reset-password'
  | 'welcome'
  | 'contact-form';

export interface EmailMessage {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  replyTo?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface CommunicationConfig {
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

// Source injectée (DIP) : un adapter de communication a besoin de ses credentials (clé API / SMTP)
// ET de la config d'envoi (expéditeur, reply-to). Le registre l'adosse à la base (déchiffrement) ;
// un test la stub → adapter testable sans base de données.
export interface CommunicationCredentialStore<T> {
  getCredentials(): Promise<T | null>;
  getConfig(): Promise<CommunicationConfig | null>;
}

export interface CommunicationAdapter {
  readonly provider: CommunicationProvider;

  /**
   * Envoie un email
   */
  send(message: EmailMessage): Promise<SendResult>;

  /**
   * Vérifie que la connexion fonctionne (test)
   */
  verify(): Promise<boolean>;

  /**
   * Vérifie si l'adapter est configuré (credentials présents et activé)
   */
  isConfigured(): Promise<boolean>;
}
