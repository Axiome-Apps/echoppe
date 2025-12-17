import { integer, pgTable, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { variant } from './catalog';
import { customer } from './customer';
import { cartStatusEnum } from './enums';

export const cart = pgTable('cart', {
  id: uuid('id').primaryKey().defaultRandom(),
  customer: uuid('customer').references(() => customer.id), // Nullable if anonymous
  sessionId: varchar('session_id', { length: 100 }), // For anonymous cart
  status: cartStatusEnum('status').notNull().default('active'),
  dateCreated: timestamp('date_created', { withTimezone: true }).notNull().defaultNow(),
  dateUpdated: timestamp('date_updated', { withTimezone: true }).notNull().defaultNow(),
});

export const cartItem = pgTable(
  'cart_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cart: uuid('cart')
      .notNull()
      .references(() => cart.id),
    variant: uuid('variant')
      .notNull()
      .references(() => variant.id),
    quantity: integer('quantity').notNull(),
    dateAdded: timestamp('date_added', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.cart, table.variant)],
);
