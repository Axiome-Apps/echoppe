import { Elysia, t } from 'elysia';
import { db, taxRate } from '@echoppe/core';

const taxRateSchema = t.Object({
  id: t.String(),
  name: t.String(),
  rate: t.String(),
  isDefault: t.Boolean(),
});

export const taxRatesRoutes = new Elysia({ prefix: '/tax-rates', detail: { tags: ['Tax Rates'] } })
  // GET /tax-rates - List all (public for forms)
  .get('/', async () => {
    const rates = await db.select().from(taxRate);
    return rates;
  }, { response: t.Array(taxRateSchema) });
