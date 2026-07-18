import { beforeAll, describe, expect, it } from 'bun:test';
import { fileURLToPath } from 'node:url';
import { collection, db, role, runMigrations, session, user } from '@echoppe/core';
import { app } from '../src/app';

// Verrou audit2 #3 (visibilityFilter, ADR-0006) : une ressource invisible est 404 pour un anonyme,
// mais visible pour un principal privilégié (session admin). Le helper porte la règle de sécurité.
// ⚠️ Base JETABLE via `bun run test:smoke` uniquement.
if (process.env.ECHOPPE_SMOKE !== '1') {
  throw new Error('Test à lancer via `bun run test:smoke` (base jetable).');
}

const migrationsFolder = fileURLToPath(new URL('../../../packages/core/drizzle', import.meta.url));

let adminCookie: string;

beforeAll(async () => {
  await runMigrations(migrationsFolder);
  const [adminRole] = await db
    .insert(role)
    .values({ name: 'Visib Admin', scope: 'admin' })
    .returning();
  const [adminUser] = await db
    .insert(user)
    .values({
      email: 'visib-admin@echoppe.test',
      passwordHash: 'x',
      firstName: 'Visib',
      lastName: 'Admin',
      role: adminRole.id,
      isOwner: true,
    })
    .returning();
  const token = crypto.randomUUID().replace(/-/g, '');
  await db
    .insert(session)
    .values({ token, user: adminUser.id, expiresAt: new Date(Date.now() + 3600_000) });
  adminCookie = `echoppe_admin_session=${token}`;
});

describe('audit2 #3 — filtre de visibilité (ADR-0006)', () => {
  it('collection invisible : 404 pour un anonyme, 200 pour un admin', async () => {
    const [hidden] = await db
      .insert(collection)
      .values({ name: 'Secrète', slug: 'secrete-collection', isVisible: false })
      .returning();

    const anon = await app.handle(new Request(`http://localhost/collections/${hidden.id}`));
    expect(anon.status).toBe(404);

    const admin = await app.handle(
      new Request(`http://localhost/collections/${hidden.id}`, {
        headers: { cookie: adminCookie },
      }),
    );
    expect(admin.status).toBe(200);
  });

  it('collection invisible : absente de la liste publique', async () => {
    await db
      .insert(collection)
      .values({ name: 'Cachée liste', slug: 'cachee-liste', isVisible: false })
      .returning();

    const list = (await (
      await app.handle(new Request('http://localhost/collections?limit=100'))
    ).json()) as { data: { slug: string }[] };
    expect(list.data.some((c) => c.slug === 'cachee-liste')).toBe(false);
  });
});
