import { boolean, decimal, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { paymentProviderEnum, paymentStatusEnum } from './enums';
import { order } from './orders';

// Configuration des providers de paiement (credentials chiffrés)
export const paymentProviderConfig = pgTable('payment_provider_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: paymentProviderEnum('provider').unique().notNull(),
  isEnabled: boolean('is_enabled').notNull().default(false),
  credentials: text('credentials'), // Chiffré AES-256-GCM (JSON stringifié puis chiffré)
  dateCreated: timestamp('date_created', { withTimezone: true }).notNull().defaultNow(),
  dateUpdated: timestamp('date_updated', { withTimezone: true }).notNull().defaultNow(),
});

export const payment = pgTable('payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  order: uuid('order')
    .unique()
    .notNull()
    .references(() => order.id), // One-to-one
  provider: paymentProviderEnum('provider').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  providerTransactionId: varchar('provider_transaction_id', { length: 255 }),
  dateCreated: timestamp('date_created', { withTimezone: true }).notNull().defaultNow(),
  dateUpdated: timestamp('date_updated', { withTimezone: true }).notNull().defaultNow(),
});

export const paymentEvent = pgTable('payment_event', {
  id: uuid('id').primaryKey().defaultRandom(),
  payment: uuid('payment')
    .notNull()
    .references(() => payment.id),
  type: varchar('type', { length: 50 }).notNull(), // attempt, success, failure, refund, dispute
  data: jsonb('data'), // Raw provider payload
  dateCreated: timestamp('date_created', { withTimezone: true }).notNull().defaultNow(),
});
