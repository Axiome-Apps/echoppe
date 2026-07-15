import { pgEnum } from 'drizzle-orm/pg-core';

export const productStatusEnum = pgEnum('product_status', ['draft', 'published', 'archived']);
// Type d'une option produit : pilote le widget admin et le rendu storefront. `string` = valeur
// texte (défaut) ; `color` = pastille, la valeur porte une couleur oklch dans `optionValue.metadata`.
export const optionTypeEnum = pgEnum('option_type', ['string', 'color']);
export const contentStatusEnum = pgEnum('content_status', ['draft', 'published']);
export const addressTypeEnum = pgEnum('address_type', ['billing', 'shipping']);
export const cartStatusEnum = pgEnum('cart_status', ['active', 'converted', 'abandoned']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);
export const paymentProviderEnum = pgEnum('payment_provider', [
  'stripe',
  'paypal',
  'bank_transfer',
  'check',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
]);
export const shipmentStatusEnum = pgEnum('shipment_status', [
  'pending',
  'label_created',
  'shipped',
  'in_transit',
  'delivered',
  'returned',
]);
export const stockMoveTypeEnum = pgEnum('stock_move_type', [
  'sale',
  'return',
  'restock',
  'adjustment',
  'reservation',
]);
export const documentTypeEnum = pgEnum('document_type', ['receipt', 'credit_note']);
export const invoiceTypeEnum = pgEnum('invoice_type', ['invoice', 'credit_note']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['pending', 'issued', 'cancelled']);
export const roleScopeEnum = pgEnum('role_scope', ['admin', 'store']);
export const shippingProviderTypeEnum = pgEnum('shipping_provider_type', [
  'colissimo',
  'mondialrelay',
  'sendcloud',
]);

export const communicationProviderEnum = pgEnum('communication_provider', [
  'resend',
  'brevo',
  'smtp',
]);
