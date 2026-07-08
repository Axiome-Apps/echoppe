import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Applique les migrations SQL versionnées (dossier `drizzle/`).
 *
 * Idempotent : seules les migrations non encore enregistrées (table
 * `__drizzle_migrations`) sont appliquées. Utilise une connexion dédiée
 * (`max: 1`), fermée en fin d'exécution — indépendante du pool applicatif.
 */
export async function runMigrations(migrationsFolder: string): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = postgres(connectionString, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder });
  } finally {
    await client.end();
  }
}
