import * as Brevo from '@getbrevo/brevo';
import type { CommunicationAdapter, EmailMessage, SendResult } from './types';
import { getProviderConfig, getProviderCredentials, getProviderStatus } from './config';
import { renderTemplate } from './templates';

export class BrevoAdapter implements CommunicationAdapter {
  readonly provider = 'brevo' as const;
  private client: Brevo.TransactionalEmailsApi | null = null;
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const credentials = await getProviderCredentials('brevo');
    if (credentials) {
      this.client = new Brevo.TransactionalEmailsApi();
      this.client.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, credentials.apiKey);
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
      const accountApi = new Brevo.AccountApi();
      const credentials = await getProviderCredentials('brevo');
      if (credentials) {
        accountApi.setApiKey(Brevo.AccountApiApiKeys.apiKey, credentials.apiKey);
        await accountApi.getAccount();
        return true;
      }
      return false;
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

      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.sender = { name: config.fromName, email: config.fromEmail };
      sendSmtpEmail.to = [{ email: message.to }];
      sendSmtpEmail.subject = message.subject;
      sendSmtpEmail.htmlContent = html;

      const replyToEmail = message.replyTo ?? config.replyTo;
      if (replyToEmail) {
        sendSmtpEmail.replyTo = { email: replyToEmail };
      }

      const response = await this.client.sendTransacEmail(sendSmtpEmail);

      return { success: true, messageId: response.body.messageId };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}
