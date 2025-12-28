import { Resend } from 'resend';
import type { CommunicationAdapter, EmailMessage, SendResult } from './types';
import { getProviderConfig, getProviderCredentials, getProviderStatus } from './config';
import { renderTemplate } from './templates';

export class ResendAdapter implements CommunicationAdapter {
  readonly provider = 'resend' as const;
  private client: Resend | null = null;
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const credentials = await getProviderCredentials('resend');
    if (credentials) {
      this.client = new Resend(credentials.apiKey);
    }
    this.initialized = true;
  }

  async isConfigured(): Promise<boolean> {
    const status = await getProviderStatus('resend');
    return status.isConfigured && status.isEnabled;
  }

  async verify(): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.client) {
      return false;
    }

    try {
      // Resend n'a pas de méthode verify, on tente de lister les domaines
      await this.client.domains.list();
      return true;
    } catch {
      return false;
    }
  }

  async send(message: EmailMessage): Promise<SendResult> {
    await this.ensureInitialized();

    if (!this.client) {
      return { success: false, error: 'Resend is not configured.' };
    }

    const config = await getProviderConfig('resend');
    if (!config) {
      return { success: false, error: 'Email configuration is missing.' };
    }

    try {
      const html = renderTemplate(message.template, message.data);

      const { data, error } = await this.client.emails.send({
        from: `${config.fromName} <${config.fromEmail}>`,
        to: message.to,
        subject: message.subject,
        html,
        replyTo: message.replyTo ?? config.replyTo,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}
