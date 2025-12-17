import { boolean, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { documentTypeEnum, invoiceStatusEnum, invoiceTypeEnum } from './enums';
import { media } from './media';
import { order } from './orders';

export const orderDocument = pgTable('order_document', {
  id: uuid('id').primaryKey().defaultRandom(),
  order: uuid('order')
    .notNull()
    .references(() => order.id),
  type: documentTypeEnum('type').notNull(),
  number: varchar('number', { length: 20 }).notNull(), // REC-2025-00001
  pdf: uuid('pdf').references(() => media.id),
  dateCreated: timestamp('date_created', { withTimezone: true }).notNull().defaultNow(),
});

export const invoiceProvider = pgTable('invoice_provider', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(), // Indy, Pennylane...
  type: varchar('type', { length: 50 }).notNull(), // indy, pennylane...
  isEnabled: boolean('is_enabled').notNull().default(false),
});

export const invoice = pgTable('invoice', {
  id: uuid('id').primaryKey().defaultRandom(),
  order: uuid('order')
    .notNull()
    .references(() => order.id),
  provider: uuid('provider')
    .notNull()
    .references(() => invoiceProvider.id),
  type: invoiceTypeEnum('type').notNull(),
  number: varchar('number', { length: 20 }).notNull(), // FA-2025-00001
  status: invoiceStatusEnum('status').notNull().default('pending'),
  providerInvoiceId: varchar('provider_invoice_id', { length: 255 }),
  pdfUrl: varchar('pdf_url', { length: 500 }),
  dateIssued: timestamp('date_issued', { withTimezone: true }),
  dateCreated: timestamp('date_created', { withTimezone: true }).notNull().defaultNow(),
});
