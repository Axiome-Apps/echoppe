import { BrevoClient } from '@getbrevo/brevo';
import { getProviderConfig, getProviderCredentials, getProviderStatus } from './config';
import { renderTemplate } from './templates';
import type { CommunicationAdapter, EmailMessage, SendResult } from './types';

export class BrevoAdapter implements CommunicationAdapter {
  readonly provider = 'brevo' as const;
  private client: BrevoClient | null = null;
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const credentials = await getProviderCredentials('brevo');
    if (credentials) {
      this.client = new BrevoClient({ apiKey: credentials.apiKey });
    }
    this.initialized = true;
  }

  async isConfigured(): Promise<boolean> {
    const status = await getProviderStatus('brevo');
    return status.isConfigured && status.isEnabled;
  }

  async verify(): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.client) {
      return false;
    }

    try {
      await this.client.account.getAccount();
      return true;
    } catch {
      return false;
    }
  }

  async send(message: EmailMessage): Promise<SendResult> {
    await this.ensureInitialized();

    if (!this.client) {
      return { success: false, error: 'Brevo is not configured.' };
    }

    const config = await getProviderConfig('brevo');
    if (!config) {
      return { success: false, error: 'Email configuration is missing.' };
    }

    try {
      const html = renderTemplate(message.template, message.data);
      const replyToEmail = message.replyTo ?? config.replyTo;

      const response = await this.client.transactionalEmails.sendTransacEmail({
        sender: { name: config.fromName, email: config.fromEmail },
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: html,
        ...(replyToEmail ? { replyTo: { email: replyToEmail } } : {}),
      });

      return { success: true, messageId: response.messageId };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}
