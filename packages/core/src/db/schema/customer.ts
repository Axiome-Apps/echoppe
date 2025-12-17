import { boolean, pgTable, primaryKey, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { variant } from './catalog';
import { addressTypeEnum } from './enums';
import { media } from './media';
import { country } from './referential';

export const customer = pgTable('customer', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  avatar: uuid('avatar').references(() => media.id),
  emailVerified: boolean('email_verified').notNull().default(false),
  marketingOptin: boolean('marketing_optin').notNull().default(false),
  dateCreated: timestamp('date_created', { withTimezone: true }).notNull().defaultNow(),
  dateUpdated: timestamp('date_updated', { withTimezone: true }).notNull().defaultNow(),
  lastLogin: timestamp('last_login', { withTimezone: true }),
});

export const address = pgTable('address', {
  id: uuid('id').primaryKey().defaultRandom(),
  customer: uuid('customer')
    .notNull()
    .references(() => customer.id),
  type: addressTypeEnum('type').notNull(),
  label: varchar('label', { length: 50 }), // Home, Office...
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  company: varchar('company', { length: 100 }),
  street: varchar('street', { length: 255 }).notNull(),
  street2: varchar('street_2', { length: 255 }),
  postalCode: varchar('postal_code', { length: 10 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  country: uuid('country')
    .notNull()
    .references(() => country.id),
  phone: varchar('phone', { length: 20 }),
  isDefault: boolean('is_default').notNull().default(false),
});

export const wishlistItem = pgTable(
  'wishlist_item',
  {
    customer: uuid('customer')
      .notNull()
      .references(() => customer.id),
    variant: uuid('variant')
      .notNull()
      .references(() => variant.id),
    dateAdded: timestamp('date_added', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.customer, table.variant] })],
);
