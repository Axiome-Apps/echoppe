import { boolean, char, decimal, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

export const country = pgTable('country', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  code: char('code', { length: 2 }).unique().notNull(), // ISO 3166-1 alpha-2
  isShippingEnabled: boolean('is_shipping_enabled').notNull().default(true),
});

export const taxRate = pgTable('tax_rate', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).unique().notNull(), // TVA 20%, Franchise en base...
  rate: decimal('rate', { precision: 5, scale: 2 }).notNull(), // 20.00 for 20%
  isDefault: boolean('is_default').notNull().default(false),
  mention: varchar('mention', { length: 255 }), // TVA non applicable, art. 293 B du CGI
});
