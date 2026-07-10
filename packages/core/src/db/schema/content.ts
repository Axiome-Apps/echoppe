import { integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { contentStatusEnum } from './enums';

// Module « content » — page builder headless (modèle façon Strapi : dynamic zone). Une PAGE
// possède une liste ordonnée de SECTIONS (blocs embarqués). Une section est un bloc typé dont
// les champs vivent en `data` (jsonb), validés à la frontière API par une union discriminée
// (cf. models/content.ts). Le HTML riche (bloc richText) est une chaîne dans `data.html`.
//
// Blocs EMBARQUÉS : une section appartient à UNE page (pas de partage inter-pages). Un « bloc
// partagé » = un type-marqueur (ex. CtaShared) rendu par un composant du front du dev.

// Page éditoriale (home, à propos, CGV…). Son contenu = ses sections ordonnées.
export const page = pgTable('page', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 150 }).unique().notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  seoTitle: varchar('seo_title', { length: 200 }),
  seoDescription: text('seo_description'),
  status: contentStatusEnum('status').notNull().default('draft'),
  dateCreated: timestamp('date_created', { withTimezone: true }).notNull().defaultNow(),
  dateUpdated: timestamp('date_updated', { withTimezone: true }).notNull().defaultNow(),
});

// Section = un bloc typé embarqué, possédé par une page, positionné via `sort`.
export const section = pgTable('section', {
  id: uuid('id').primaryKey().defaultRandom(),
  page: uuid('page')
    .notNull()
    .references(() => page.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }), // libellé admin optionnel (repérage dans le builder)
  type: varchar('type', { length: 50 }).notNull(), // hero, richText, productGrid, image, cta…
  data: jsonb('data').notNull(), // champs du bloc, SANS le type (porté par la colonne `type`)
  sort: integer('sort').notNull().default(0),
  dateCreated: timestamp('date_created', { withTimezone: true }).notNull().defaultNow(),
  dateUpdated: timestamp('date_updated', { withTimezone: true }).notNull().defaultNow(),
});
