import { country, db, eq } from '@echoppe/core';
import { Elysia } from 'elysia';
import { models } from '../models';
import { withReadErrors } from '../utils/responses';

// Schéma d'entité pays (Country, CountryList) → src/models/company.ts

export const countriesRoutes = new Elysia({ prefix: '/countries', detail: { tags: ['Countries'] } })
  // Registre central des modèles nommés → components.schemas.
  .use(models)

  // GET /countries - List shipping-enabled countries (public, for storefront address forms)
  .get(
    '/',
    async () => {
      return db
        .select()
        .from(country)
        .where(eq(country.isShippingEnabled, true))
        .orderBy(country.name);
    },
    { response: withReadErrors({ 200: 'CountryList' }) },
  );
