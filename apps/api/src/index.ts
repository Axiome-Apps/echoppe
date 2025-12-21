import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
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
import { shippingRoutes } from './routes/shipping';
import { ordersRoutes } from './routes/orders';

const port = process.env.API_PORT ?? 8000;

const app = new Elysia()
  .use(
    cors({
      origin: process.env.ADMIN_URL || 'http://localhost:3000',
      credentials: true,
    })
  )
  .use(
    swagger({
      path: '/docs',
      documentation: {
        info: {
          title: 'Échoppe API',
          version: '1.0.0',
          description: 'API e-commerce pour artisans français',
        },
        tags: [
          { name: 'auth', description: 'Authentification' },
          { name: 'products', description: 'Gestion des produits' },
          { name: 'categories', description: 'Gestion des catégories' },
          { name: 'collections', description: 'Gestion des collections' },
          { name: 'media', description: 'Médiathèque' },
          { name: 'orders', description: 'Commandes' },
          { name: 'stock', description: 'Gestion du stock' },
          { name: 'payments', description: 'Paiements' },
          { name: 'shipping', description: 'Livraison' },
          { name: 'settings', description: 'Paramètres' },
        ],
      },
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
  .use(shippingRoutes)
  .use(ordersRoutes)
  .listen(port);

console.log(`🏪 Échoppe API running at http://localhost:${port}`);

export type App = typeof app;
