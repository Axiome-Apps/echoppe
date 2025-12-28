import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { CommunicationAdapter, EmailMessage, SendResult } from './types';
import { getProviderConfig, getProviderCredentials, getProviderStatus } from './config';
import { renderTemplate } from './templates';

export class SmtpAdapter implements CommunicationAdapter {
  readonly provider = 'smtp' as const;
  private transporter: Transporter | null = null;
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const credentials = await getProviderCredentials('smtp');
    if (credentials) {
      this.transporter = nodemailer.createTransport({
        host: credentials.host,
        port: credentials.port,
        secure: credentials.secure,
        auth: {
          user: credentials.user,
          pass: credentials.pass,
        },
      });
    }
    this.initialized = true;
  }

  async isConfigured(): Promise<boolean> {
    const status = await getProviderStatus('smtp');
    return status.isConfigured && status.isEnabled;
  }

  async verify(): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  async send(message: EmailMessage): Promise<SendResult> {
    await this.ensureInitialized();

    if (!this.transporter) {
      return { success: false, error: 'SMTP is not configured.' };
    }

    const config = await getProviderConfig('smtp');
    if (!config) {
      return { success: false, error: 'Email configuration is missing.' };
    }

    try {
      const html = renderTemplate(message.template, message.data);

      const info = await this.transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: message.to,
        subject: message.subject,
        html,
        replyTo: message.replyTo ?? config.replyTo,
      });

      return { success: true, messageId: info.messageId };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}
