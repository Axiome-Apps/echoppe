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
import { companyRoutes } from './routes/company';
import { stockRoutes } from './routes/stock';
import { paymentsRoutes } from './routes/payments';
import { shippingRoutes } from './routes/shipping';
import { ordersRoutes } from './routes/orders';
import { customerAuthRoutes } from './routes/customer-auth';
import { rolesRoutes } from './routes/roles';
import { cartRoutes } from './routes/cart';
import { customerAddressesRoutes } from './routes/customer-addresses';
import { checkoutRoutes } from './routes/checkout';
import { communicationsRoutes } from './routes/communications';
import { customersRoutes } from './routes/customers';
import { usersRoutes } from './routes/users';
import { cleanupExpiredOrders } from './jobs/cleanup-expired-orders';

const port = process.env.API_PORT ?? 7532;

const app = new Elysia()
  .use(
    cors({
      origin: [
        process.env.ADMIN_URL || 'http://localhost:3211',
        process.env.STORE_URL || 'http://localhost:3141',
      ],
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
          { name: 'Auth', description: 'Authentification admin' },
          { name: 'Customer Auth', description: 'Authentification client' },
          { name: 'Products', description: 'Gestion des produits' },
          { name: 'Categories', description: 'Gestion des catégories' },
          { name: 'Collections', description: 'Gestion des collections' },
          { name: 'Media', description: 'Médiathèque' },
          { name: 'Orders', description: 'Commandes' },
          { name: 'Stock', description: 'Gestion du stock' },
          { name: 'Payments', description: 'Paiements' },
          { name: 'Shipping', description: 'Livraison' },
          { name: 'Company', description: 'Informations entreprise' },
          { name: 'Tax Rates', description: 'Taux de TVA' },
          { name: 'Assets', description: 'Fichiers statiques' },
          { name: 'Roles', description: 'Gestion des rôles et permissions' },
          { name: 'Cart', description: 'Panier client' },
          { name: 'Customer Addresses', description: 'Adresses client' },
          { name: 'Checkout', description: 'Tunnel de paiement' },
          { name: 'Communications', description: 'Configuration emails' },
          { name: 'Customers', description: 'Gestion des clients' },
          { name: 'Users', description: 'Gestion des utilisateurs admin' },
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
  .use(customerAuthRoutes)
  .use(categoriesRoutes)
  .use(productsRoutes)
  .use(mediaRoutes)
  .use(collectionsRoutes)
  .use(taxRatesRoutes)
  .use(assetsRoutes)
  .use(companyRoutes)
  .use(stockRoutes)
  .use(paymentsRoutes)
  .use(shippingRoutes)
  .use(ordersRoutes)
  .use(rolesRoutes)
  .use(cartRoutes)
  .use(customerAddressesRoutes)
  .use(checkoutRoutes)
  .use(communicationsRoutes)
  .use(customersRoutes)
  .use(usersRoutes)
  .listen(port);

console.log(`🏪 Échoppe API running at http://localhost:${port}`);

// Run cleanup job every 15 minutes
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;
setInterval(() => {
  cleanupExpiredOrders().catch((err) => {
    console.error('[Cleanup] Error:', err);
  });
}, CLEANUP_INTERVAL_MS);

// Run once at startup
cleanupExpiredOrders().catch((err) => {
  console.error('[Cleanup] Initial run error:', err);
});

export type App = typeof app;
