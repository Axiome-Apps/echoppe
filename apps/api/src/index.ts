import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';
import { authRoutes } from './routes/auth';
import { categoriesRoutes } from './routes/categories';
import { productsRoutes } from './routes/products';
import { mediaRoutes } from './routes/media';
import { collectionsRoutes } from './routes/collections';
import { taxRatesRoutes } from './routes/tax-rates';
import { assetsRoutes } from './routes/assets';
import { settingsRoutes } from './routes/settings';
import { stockRoutes } from './routes/stock';
import { paymentsRoutes } from './routes/payments';

const port = process.env.API_PORT ?? 8000;

const app = new Elysia()
  .use(
    cors({
      origin: process.env.ADMIN_URL || 'http://localhost:3000',
      credentials: true,
    })
  )
  .get('/', () => ({
    name: 'Échoppe API',
    version: '0.0.1',
  }))
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))
  .use(authRoutes)
  .use(categoriesRoutes)
  .use(productsRoutes)
  .use(mediaRoutes)
  .use(collectionsRoutes)
  .use(taxRatesRoutes)
  .use(assetsRoutes)
  .use(settingsRoutes)
  .use(stockRoutes)
  .use(paymentsRoutes)
  .listen(port);

console.log(`🏪 Échoppe API running at http://localhost:${port}`);

export type App = typeof app;
