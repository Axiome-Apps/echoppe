import { db } from '../db';
import { communicationLog } from '../db/schema/communication';
import { company } from '../db/schema/admin';
import {
  getActiveCommunicationAdapter,
  type EmailTemplate,
  type SendResult,
} from '../adapters/communication';

export interface SendEmailParams {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, unknown>;
  replyTo?: string;
}

export interface EmailResult extends SendResult {
  skipped?: boolean;
}

/**
 * Récupère les infos de la boutique pour les emails
 */
async function getShopInfo(): Promise<{ name: string; url?: string }> {
  const [companyData] = await db.select().from(company).limit(1);
  return {
    name: companyData?.shopName ?? 'Notre boutique',
    url: undefined, // TODO: ajouter l'URL du store dans company
  };
}

/**
 * Envoie un email via le provider configuré
 * - Si aucun provider configuré, retourne success: true avec skipped: true
 * - Log automatiquement le résultat en DB
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const adapter = await getActiveCommunicationAdapter();

  // Aucun provider configuré - skip silently
  if (!adapter) {
    return { success: true, skipped: true };
  }

  // Enrichir les data avec les infos boutique
  const shopInfo = await getShopInfo();
  const enrichedData = {
    shopName: shopInfo.name,
    shopUrl: shopInfo.url,
    ...params.data,
  };

  // Envoyer l'email
  const result = await adapter.send({
    to: params.to,
    subject: params.subject,
    template: params.template,
    data: enrichedData,
    replyTo: params.replyTo,
  });

  // Log en DB
  await db.insert(communicationLog).values({
    provider: adapter.provider,
    channel: 'email',
    template: params.template,
    recipient: params.to,
    subject: params.subject,
    status: result.success ? 'sent' : 'failed',
    providerMessageId: result.messageId,
    error: result.error,
    metadata: enrichedData,
  });

  return result;
}

// ============================================
// HELPERS TYPÉS PAR ACTION
// ============================================

export interface OrderEmailData {
  customerEmail: string;
  customerName?: string;
  orderNumber: string;
  total: string;
  orderUrl?: string;
}

/**
 * Email de confirmation de commande
 */
export async function sendOrderConfirmation(data: OrderEmailData): Promise<EmailResult> {
  return sendEmail({
    to: data.customerEmail,
    subject: `Confirmation de votre commande #${data.orderNumber}`,
    template: 'order-confirmation',
    data: {
      customerName: data.customerName,
      orderNumber: data.orderNumber,
      total: data.total,
      orderUrl: data.orderUrl,
    },
  });
}

export interface ShipmentEmailData {
  customerEmail: string;
  customerName?: string;
  orderNumber: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
}

/**
 * Email de notification d'expédition
 */
export async function sendShipmentNotification(data: ShipmentEmailData): Promise<EmailResult> {
  return sendEmail({
    to: data.customerEmail,
    subject: `Votre commande #${data.orderNumber} a été expédiée`,
    template: 'shipment',
    data: {
      customerName: data.customerName,
      orderNumber: data.orderNumber,
      trackingNumber: data.trackingNumber,
      trackingUrl: data.trackingUrl,
      carrier: data.carrier,
    },
  });
}

export interface ResetPasswordEmailData {
  email: string;
  resetUrl: string;
  expiresIn?: string;
}

/**
 * Email de réinitialisation de mot de passe
 */
export async function sendResetPasswordEmail(data: ResetPasswordEmailData): Promise<EmailResult> {
  return sendEmail({
    to: data.email,
    subject: 'Réinitialisation de votre mot de passe',
    template: 'reset-password',
    data: {
      resetUrl: data.resetUrl,
      expiresIn: data.expiresIn ?? '1 heure',
    },
  });
}

export interface WelcomeEmailData {
  customerEmail: string;
  customerName?: string;
}

/**
 * Email de bienvenue après inscription
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  return sendEmail({
    to: data.customerEmail,
    subject: 'Bienvenue !',
    template: 'welcome',
    data: {
      customerName: data.customerName,
    },
  });
}

export interface ContactFormEmailData {
  adminEmail: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  subject?: string;
  message: string;
}

/**
 * Email de formulaire de contact (envoyé à l'admin)
 */
export async function sendContactFormEmail(data: ContactFormEmailData): Promise<EmailResult> {
  return sendEmail({
    to: data.adminEmail,
    subject: `Contact: ${data.subject ?? 'Nouveau message'}`,
    template: 'contact-form',
    data: {
      name: data.senderName,
      email: data.senderEmail,
      phone: data.senderPhone,
      subject: data.subject,
      message: data.message,
    },
    replyTo: data.senderEmail,
  });
}
