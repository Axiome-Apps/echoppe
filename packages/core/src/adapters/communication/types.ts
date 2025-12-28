export type CommunicationProvider = 'resend' | 'brevo' | 'smtp';
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
