// Enums partagés (miroir du schéma DB)
export const ProductStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const AddressType = {
  BILLING: 'billing',
  SHIPPING: 'shipping',
} as const;
export type AddressType = (typeof AddressType)[keyof typeof AddressType];

export const CartStatus = {
  ACTIVE: 'active',
  CONVERTED: 'converted',
  ABANDONED: 'abandoned',
} as const;
export type CartStatus = (typeof CartStatus)[keyof typeof CartStatus];

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentProvider = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  CHECK: 'check',
} as const;
export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];

export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ShipmentStatus = {
  PENDING: 'pending',
  LABEL_CREATED: 'label_created',
  SHIPPED: 'shipped',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  RETURNED: 'returned',
} as const;
export type ShipmentStatus = (typeof ShipmentStatus)[keyof typeof ShipmentStatus];

export const StockMoveType = {
  SALE: 'sale',
  RETURN: 'return',
  RESTOCK: 'restock',
  ADJUSTMENT: 'adjustment',
  RESERVATION: 'reservation',
} as const;
export type StockMoveType = (typeof StockMoveType)[keyof typeof StockMoveType];

export const DocumentType = {
  RECEIPT: 'receipt',
  CREDIT_NOTE: 'credit_note',
} as const;
export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const InvoiceType = {
  INVOICE: 'invoice',
  CREDIT_NOTE: 'credit_note',
} as const;
export type InvoiceType = (typeof InvoiceType)[keyof typeof InvoiceType];

export const InvoiceStatus = {
  PENDING: 'pending',
  ISSUED: 'issued',
  CANCELLED: 'cancelled',
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const RoleScope = {
  ADMIN: 'admin',
  STORE: 'store',
} as const;
export type RoleScope = (typeof RoleScope)[keyof typeof RoleScope];

// Types utilitaires
export type UUID = string;

export interface Timestamps {
  dateCreated: Date;
  dateUpdated?: Date;
}

// Types API communs
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
