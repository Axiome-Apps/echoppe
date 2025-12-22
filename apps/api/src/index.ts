import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
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
    openapi({
      path: '/docs',
      scalar: {
        theme: 'bluePlanet',
        darkMode: true,
        customCss: `.dark-mode { --scalar-color-accent: #ffffff !important; }`,
      },
      documentation: {
        info: {
          title: 'Échoppe API',
          version: '1.0.0',
          description: 'API e-commerce pour artisans français',
        },
        tags: [
          { name: 'General', description: 'Informations générales' },
          { name: 'Auth', description: 'Authentification' },
          { name: 'Products', description: 'Gestion des produits' },
          { name: 'Categories', description: 'Gestion des catégories' },
          { name: 'Collections', description: 'Gestion des collections' },
          { name: 'Media', description: 'Médiathèque' },
          { name: 'Orders', description: 'Commandes' },
          { name: 'Stock', description: 'Gestion du stock' },
          { name: 'Payments', description: 'Paiements' },
          { name: 'Shipping', description: 'Livraison' },
          { name: 'Settings', description: 'Paramètres' },
          { name: 'Tax Rates', description: 'Taux de TVA' },
          { name: 'Assets', description: 'Fichiers statiques' },
        ],
      },
    })
  )
  .get('/', () => ({
    name: 'Échoppe API',
    version: '1.0.0',
  }), { detail: { tags: ['General'], summary: 'Informations API' } })
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }), { detail: { tags: ['General'], summary: 'Health check' } })
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
