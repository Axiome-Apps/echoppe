import { Elysia } from 'elysia';
import { db, taxRate } from '@echoppe/core';

export const taxRatesRoutes = new Elysia({ prefix: '/tax-rates' })
  // GET /tax-rates - List all (public for forms)
  .get('/', async () => {
    const rates = await db.select().from(taxRate);
    return rates;
  });
