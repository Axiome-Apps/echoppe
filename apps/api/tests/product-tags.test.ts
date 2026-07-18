import { beforeAll, describe, expect, it } from 'bun:test';
import { fileURLToPath } from 'node:url';
import {
  category,
  db,
  eq,
  product,
  role,
  runMigrations,
  session,
  taxRate,
  user,
  variant,
} from '@echoppe/core';
import { app } from '../src/app';

// Verrou B3 (tags produit) : le PUT admin remplace l'ensemble des tags (sémantique set, dédup par
// slug) ; le storefront les expose sur le détail (by-slug) et les cartes (liste), triés par nom.
// ⚠️ Base JETABLE via `bun run test:smoke` uniquement.
if (process.env.ECHOPPE_SMOKE !== '1') {
  throw new Error('Test à lancer via `bun run test:smoke` (base jetable).');
}

const migrationsFolder = fileURLToPath(new URL('../../../packages/core/drizzle', import.meta.url));

let categoryId: string;
let taxRateId: string;
let adminCookie: string; // session admin owner injectée (bypass RBAC), cf. variant-default-image.test

async function upsertRef<T extends { id: string }>(rows: T[], find: () => Promise<T[]>) {
  return rows[0] ?? (await find())[0];
}

// Produit publié minimal (1 variante publiée) — support des assertions liste/détail.
async function publishedProduct(slug: string) {
  const [p] = await db
    .insert(product)
    .values({ category: categoryId, taxRate: taxRateId, name: slug, slug, status: 'published' })
    .returning();
  await db.insert(variant).values({
    product: p.id,
    sku: `${slug}-V`,
    priceHt: '20.00',
    status: 'published',
    isDefault: true,
    quantity: 5,
  });
  return p;
}

// PUT admin (corps productUpdateBody : name/category/taxRate requis) avec un jeu de tags.
const putTags = (p: { id: string; name: string }, tags: string[]) =>
  app.handle(
    new Request(`http://localhost/products/${p.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ name: p.name, category: categoryId, taxRate: taxRateId, tags }),
    }),
  );

beforeAll(async () => {
  await runMigrations(migrationsFolder);
  categoryId = (
    await upsertRef(
      await db
        .insert(category)
        .values({ name: 'Tags', slug: 'tags-cat' })
        .onConflictDoNothing()
        .returning(),
      () => db.select().from(category).where(eq(category.slug, 'tags-cat')),
    )
  ).id;
  taxRateId = (
    await upsertRef(
      await db
        .insert(taxRate)
        .values({ name: 'TVA tags', rate: '20.00' })
        .onConflictDoNothing()
        .returning(),
      () => db.select().from(taxRate).where(eq(taxRate.name, 'TVA tags')),
    )
  ).id;

  const [adminRole] = await db
    .insert(role)
    .values({ name: 'Tags Admin', scope: 'admin' })
    .returning();
  const [adminUser] = await db
    .insert(user)
    .values({
      email: 'tags-admin@echoppe.test',
      passwordHash: 'x',
      firstName: 'Tags',
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

describe('B3 — tags produit', () => {
  it('le détail by-slug expose les tags, triés par nom', async () => {
    const p = await publishedProduct('tags-detail');
    expect((await putTags(p, ['Nouveauté', 'Été'])).status).toBe(200);

    const detail = (await (
      await app.handle(new Request('http://localhost/products/by-slug/tags-detail'))
    ).json()) as { tags: string[] };
    expect(detail.tags).toEqual(['Été', 'Nouveauté']);
  });

  it('la carte liste expose les tags', async () => {
    const p = await publishedProduct('tags-card');
    await putTags(p, ['Solde']);

    const list = (await (
      await app.handle(new Request('http://localhost/products/?limit=100'))
    ).json()) as { data: { slug: string; tags: string[] }[] };
    const card = list.data.find((c) => c.slug === 'tags-card');
    expect(card?.tags).toEqual(['Solde']);
  });

  it('le PUT remplace l’ensemble (sémantique set)', async () => {
    const p = await publishedProduct('tags-replace');
    await putTags(p, ['Ancien', 'Obsolète']);
    await putTags(p, ['Récent']);

    const detail = (await (
      await app.handle(new Request('http://localhost/products/by-slug/tags-replace'))
    ).json()) as { tags: string[] };
    expect(detail.tags).toEqual(['Récent']);
  });

  it('dédup par slug (casse ignorée)', async () => {
    const p = await publishedProduct('tags-dedup');
    await putTags(p, ['Été', 'été', 'ÉTÉ']);

    const detail = (await (
      await app.handle(new Request('http://localhost/products/by-slug/tags-dedup'))
    ).json()) as { tags: string[] };
    expect(detail.tags).toHaveLength(1);
  });
});
