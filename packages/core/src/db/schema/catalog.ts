import {
  type AnyPgColumn,
  boolean,
  decimal,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { productStatusEnum } from './enums';
import { media } from './media';
import { taxRate } from './referential';

export const category = pgTable('category', {
  id: uuid('id').primaryKey().defaultRandom(),
  parent: uuid('parent').references((): AnyPgColumn => category.id),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  description: text('description'),
  image: uuid('image').references(() => media.id),
  sortOrder: integer('sort_order').notNull().default(0),
  isVisible: boolean('is_visible').notNull().default(true),
});

export const collection = pgTable('collection', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  description: text('description'),
  image: uuid('image').references(() => media.id),
  isVisible: boolean('is_visible').notNull().default(true),
  dateCreated: timestamp('date_created', { withTimezone: true }).notNull().defaultNow(),
});

export const product = pgTable('product', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: uuid('category')
    .notNull()
    .references(() => category.id),
  taxRate: uuid('tax_rate')
    .notNull()
    .references(() => taxRate.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  description: text('description'),
  status: productStatusEnum('status').notNull().default('draft'),
  dateCreated: timestamp('date_created', { withTimezone: true }).notNull().defaultNow(),
  dateUpdated: timestamp('date_updated', { withTimezone: true }).notNull().defaultNow(),
});

export const productCollection = pgTable(
  'product_collection',
  {
    product: uuid('product')
      .notNull()
      .references(() => product.id),
    collection: uuid('collection')
      .notNull()
      .references(() => collection.id),
  },
  (table) => [primaryKey({ columns: [table.product, table.collection] })],
);

export const productMedia = pgTable(
  'product_media',
  {
    product: uuid('product')
      .notNull()
      .references(() => product.id),
    media: uuid('media')
      .notNull()
      .references(() => media.id),
    sortOrder: integer('sort_order').notNull().default(0),
    isFeatured: boolean('is_featured').notNull().default(false),
    featuredForVariant: uuid('featured_for_variant').references((): AnyPgColumn => variant.id),
  },
  (table) => [
    primaryKey({ columns: [table.product, table.media] }),
    // Une seule image featured par produit
    uniqueIndex('product_media_featured_unique')
      .on(table.product)
      .where(sql`${table.isFeatured} = true`),
    // Une seule image par variante
    uniqueIndex('product_media_variant_unique')
      .on(table.featuredForVariant)
      .where(sql`${table.featuredForVariant} IS NOT NULL`),
  ],
);

export const option = pgTable('option', {
  id: uuid('id').primaryKey().defaultRandom(),
  product: uuid('product')
    .notNull()
    .references(() => product.id),
  name: varchar('name', { length: 50 }).notNull(), // Color, Size...
  sortOrder: integer('sort_order').notNull().default(0),
});

export const optionValue = pgTable('option_value', {
  id: uuid('id').primaryKey().defaultRandom(),
  option: uuid('option')
    .notNull()
    .references(() => option.id),
  value: varchar('value', { length: 100 }).notNull(), // Red, M, XL...
  sortOrder: integer('sort_order').notNull().default(0),
});

export const variant = pgTable('variant', {
  id: uuid('id').primaryKey().defaultRandom(),
  product: uuid('product')
    .notNull()
    .references(() => product.id),
  sku: varchar('sku', { length: 50 }).unique(),
  barcode: varchar('barcode', { length: 50 }),
  priceHt: decimal('price_ht', { precision: 10, scale: 2 }).notNull(),
  compareAtPriceHt: decimal('compare_at_price_ht', { precision: 10, scale: 2 }), // Strike-through price
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }), // Cost price
  weight: decimal('weight', { precision: 10, scale: 3 }), // kg
  length: decimal('length', { precision: 10, scale: 2 }), // cm
  width: decimal('width', { precision: 10, scale: 2 }), // cm
  height: decimal('height', { precision: 10, scale: 2 }), // cm
  isDefault: boolean('is_default').notNull().default(false),
  status: productStatusEnum('status').notNull().default('draft'),
  sortOrder: integer('sort_order').notNull().default(0),
  quantity: integer('quantity').notNull().default(0),
  reserved: integer('reserved').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').default(5),
});

export const variantOptionValue = pgTable(
  'variant_option_value',
  {
    variant: uuid('variant')
      .notNull()
      .references(() => variant.id),
    optionValue: uuid('option_value')
      .notNull()
      .references(() => optionValue.id),
  },
  (table) => [primaryKey({ columns: [table.variant, table.optionValue] })],
);
