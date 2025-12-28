import type { EmailTemplate } from './types';

/**
 * Templates email basiques
 * TODO: À remplacer par un système de templates plus élaboré (MJML, React Email, etc.)
 */
const templates: Record<EmailTemplate, (data: Record<string, unknown>) => string> = {
  'order-confirmation': (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
        .content { padding: 20px 0; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Confirmation de commande</h1>
        </div>
        <div class="content">
          <p>Bonjour${data.customerName ? ` ${data.customerName}` : ''},</p>
          <p>Merci pour votre commande <strong>#${data.orderNumber}</strong> !</p>
          <p>Nous avons bien reçu votre paiement de <strong>${data.total} €</strong>.</p>
          <p>Vous recevrez un email dès que votre commande sera expédiée.</p>
          ${data.orderUrl ? `<p><a href="${data.orderUrl}" class="button">Voir ma commande</a></p>` : ''}
        </div>
        <div class="footer">
          <p>${data.shopName ?? 'Notre boutique'}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  shipment: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
        .content { padding: 20px 0; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; }
        .tracking { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Votre commande est expédiée !</h1>
        </div>
        <div class="content">
          <p>Bonjour${data.customerName ? ` ${data.customerName}` : ''},</p>
          <p>Bonne nouvelle ! Votre commande <strong>#${data.orderNumber}</strong> a été expédiée.</p>
          ${
            data.trackingNumber
              ? `
          <div class="tracking">
            <p><strong>Numéro de suivi :</strong> ${data.trackingNumber}</p>
            ${data.carrier ? `<p><strong>Transporteur :</strong> ${data.carrier}</p>` : ''}
          </div>
          `
              : ''
          }
          ${data.trackingUrl ? `<p><a href="${data.trackingUrl}" class="button">Suivre mon colis</a></p>` : ''}
        </div>
        <div class="footer">
          <p>${data.shopName ?? 'Notre boutique'}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  'reset-password': (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
        .content { padding: 20px 0; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Réinitialisation de mot de passe</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
          <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
          <p><a href="${data.resetUrl}" class="button">Réinitialiser mon mot de passe</a></p>
          <p><small>Ce lien expire dans ${data.expiresIn ?? '1 heure'}.</small></p>
          <p><small>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</small></p>
        </div>
        <div class="footer">
          <p>${data.shopName ?? 'Notre boutique'}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  welcome: (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
        .content { padding: 20px 0; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bienvenue !</h1>
        </div>
        <div class="content">
          <p>Bonjour${data.customerName ? ` ${data.customerName}` : ''},</p>
          <p>Merci de vous être inscrit sur ${data.shopName ?? 'notre boutique'} !</p>
          <p>Votre compte a bien été créé. Vous pouvez maintenant :</p>
          <ul>
            <li>Suivre vos commandes</li>
            <li>Gérer vos adresses</li>
            <li>Sauvegarder vos favoris</li>
          </ul>
          ${data.shopUrl ? `<p><a href="${data.shopUrl}" class="button">Découvrir la boutique</a></p>` : ''}
        </div>
        <div class="footer">
          <p>${data.shopName ?? 'Notre boutique'}</p>
        </div>
      </div>
    </body>
    </html>
  `,

  'contact-form': (data) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #eee; }
        .content { padding: 20px 0; }
        .message { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nouveau message de contact</h1>
        </div>
        <div class="content">
          <p><strong>De :</strong> ${data.name} (${data.email})</p>
          ${data.phone ? `<p><strong>Téléphone :</strong> ${data.phone}</p>` : ''}
          <p><strong>Sujet :</strong> ${data.subject ?? 'Contact'}</p>
          <div class="message">${data.message}</div>
        </div>
      </div>
    </body>
    </html>
  `,
};

/**
 * Rendu d'un template email
 */
export function renderTemplate(template: EmailTemplate, data: Record<string, unknown>): string {
  const render = templates[template];
  if (!render) {
    throw new Error(`Unknown email template: ${template}`);
  }
  return render(data);
}
