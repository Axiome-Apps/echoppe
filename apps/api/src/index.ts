import { fileURLToPath } from 'node:url';
import { runMigrations } from '@echoppe/core';
import { app } from './app';
import { cleanupExpiredOrders } from './jobs/cleanup-expired-orders';
import { initAdmin } from './lib/init-admin';

export type { App } from './app';

const port = process.env.API_PORT ?? 7532;

// Migrations SQL versionnées appliquées au boot (activé dans l'image via
// RUN_MIGRATIONS ; off en dev, où l'on utilise `db:push`). Idempotent.
if (process.env.RUN_MIGRATIONS) {
  const migrationsFolder =
    process.env.MIGRATIONS_DIR ??
    fileURLToPath(new URL('../../../packages/core/drizzle', import.meta.url));
  await runMigrations(migrationsFolder);
  console.log('[Migrate] Schéma à jour');
}

app.listen({ port: Number(port), hostname: '0.0.0.0' });

console.log(`🏪 Échoppe API running at http://localhost:${port}`);

// Create admin user if ADMIN_EMAIL and ADMIN_PASSWORD are set
initAdmin().catch((err) => {
  console.error('[Init] Admin creation error:', err);
});

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
