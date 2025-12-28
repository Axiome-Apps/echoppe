export type { Database } from './db/index';
export { db } from './db/index';
export * from './db/schema/index';

// Re-export drizzle-orm utilities
export { eq, ne, gt, gte, lt, lte, and, or, like, ilike, inArray, notInArray, isNull, isNotNull, asc, desc, sql, count } from 'drizzle-orm';
export type { SQL } from 'drizzle-orm';

// Payment adapters
export * from './adapters/payment';

// Shipping adapters
export * from './adapters/shipping';

// Communication adapters
export {
  // Types
  type CommunicationAdapter,
  type CommunicationConfig,
  type CommunicationProvider,
  type EmailMessage,
  type EmailStatus,
  type EmailTemplate,
  type SendResult,
  type ResendCredentials,
  type BrevoCredentials,
  type SmtpCredentials,
  // Adapters
  ResendAdapter,
  BrevoAdapter,
  SmtpAdapter,
  // Factory
  getCommunicationAdapter,
  getActiveCommunicationAdapter,
  getAvailableCommunicationProviders,
  resetCommunicationAdapters,
  // Config (renamed to avoid conflicts)
  getProviderCredentials as getCommunicationProviderCredentials,
  getProviderConfig as getCommunicationProviderConfig,
  getProviderStatus as getCommunicationProviderStatus,
  saveProviderCredentials as saveCommunicationProviderCredentials,
  setProviderEnabled as setCommunicationProviderEnabled,
  getAllProvidersStatus as getAllCommunicationProvidersStatus,
  // Templates
  renderTemplate,
} from './adapters/communication';

// Utils
export { encrypt, decrypt, isEncryptionConfigured, generateEncryptionKey } from './utils/crypto';

// Invoice service
export * from './services/invoice';

// Email service
export {
  sendEmail,
  sendOrderConfirmation,
  sendShipmentNotification,
  sendResetPasswordEmail,
  sendWelcomeEmail,
  sendContactFormEmail,
  type SendEmailParams,
  type EmailResult,
  type OrderEmailData,
  type ShipmentEmailData,
  type ResetPasswordEmailData,
  type WelcomeEmailData,
  type ContactFormEmailData,
} from './services/email';

// RBAC constants
export * from './constants/resources';
