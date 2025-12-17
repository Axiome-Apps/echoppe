import {
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { variant } from './catalog';
import { customer } from './customer';
import { orderStatusEnum } from './enums';

export const order = pgTable('order', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: varchar('order_number', { length: 20 }).unique().notNull(), // CMD-2025-00001
  customer: uuid('customer')
    .notNull()
    .references(() => customer.id),
  status: orderStatusEnum('status').notNull().default('pending'),
  shippingAddress: jsonb('shipping_address').notNull(), // Snapshot
  billingAddress: jsonb('billing_address').notNull(), // Snapshot
  subtotalHt: decimal('subtotal_ht', { precision: 10, scale: 2 }).notNull(),
  shippingHt: decimal('shipping_ht', { precision: 10, scale: 2 }).notNull().default('0'),
  discountHt: decimal('discount_ht', { precision: 10, scale: 2 }).notNull().default('0'),
  totalHt: decimal('total_ht', { precision: 10, scale: 2 }).notNull(),
  totalTax: decimal('total_tax', { precision: 10, scale: 2 }).notNull(),
  totalTtc: decimal('total_ttc', { precision: 10, scale: 2 }).notNull(),
  customerNote: text('customer_note'),
  internalNote: text('internal_note'),
  dateCreated: timestamp('date_created', { withTimezone: true }).notNull().defaultNow(),
  dateUpdated: timestamp('date_updated', { withTimezone: true }).notNull().defaultNow(),
});

export const orderItem = pgTable('order_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  order: uuid('order')
    .notNull()
    .references(() => order.id),
  variant: uuid('variant').references(() => variant.id), // Nullable if variant deleted
  label: varchar('label', { length: 255 }).notNull(), // Moon Ring — Silver / 52
  quantity: integer('quantity').notNull(),
  unitPriceHt: decimal('unit_price_ht', { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).notNull(),
  totalHt: decimal('total_ht', { precision: 10, scale: 2 }).notNull(),
  totalTtc: decimal('total_ttc', { precision: 10, scale: 2 }).notNull(),
});
