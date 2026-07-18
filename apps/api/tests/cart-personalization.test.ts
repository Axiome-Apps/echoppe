import { beforeAll, describe, expect, it } from 'bun:test';
import { fileURLToPath } from 'node:url';
import {
  category,
  db,
  eq,
  personalizationField,
  product,
  runMigrations,
  taxRate,
  variant,
} from '@echoppe/core';
import { app } from '../src/app';
import { calculateOrderTotals } from '../src/services/checkout';

// Verrou B2 (personnalisation produit, ADR-0010) : le détail expose les champs déclarés ; l'ajout
// panier valide + calcule le supplément côté back (jamais le front) ; la commande le snapshote.
// ⚠️ Base JETABLE via `bun run test:smoke` uniquement.
if (process.env.ECHOPPE_SMOKE !== '1') {
  throw new Error('Test à lancer via `bun run test:smoke` (base jetable).');
}

const migrationsFolder = fileURLToPath(new URL('../../../packages/core/drizzle', import.meta.url));

let categoryId: string;
let taxRateId: string;

async function upsertRef<T extends { id: string }>(rows: T[], find: () => Promise<T[]>) {
  return rows[0] ?? (await find())[0];
}

// Produit personnalisable : 1 variante publiée à 35 € + 1 champ « Prénom » requis +5 €.
async function personalizableProduct(slug: string) {
  const [p] = await db
    .insert(product)
    .values({
      category: categoryId,
      taxRate: taxRateId,
      name: slug,
      slug,
      status: 'published',
      personalizationEnabled: true,
    })
    .returning();
  const [v] = await db
    .insert(variant)
    .values({
      product: p.id,
      sku: `${slug}-V`,
      priceHt: '35.00',
      status: 'published',
      isDefault: true,
      quantity: 10,
    })
    .returning();
  const [field] = await db
    .insert(personalizationField)
    .values({
      product: p.id,
      label: 'Prénom',
      type: 'text',
      required: true,
      maxLength: 20,
      priceHt: '5.00',
    })
    .returning();
  return { product: p, variant: v, field };
}

beforeAll(async () => {
  await runMigrations(migrationsFolder);
  categoryId = (
    await upsertRef(
      await db
        .insert(category)
        .values({ name: 'Perso', slug: 'perso-cat' })
        .onConflictDoNothing()
        .returning(),
      () => db.select().from(category).where(eq(category.slug, 'perso-cat')),
    )
  ).id;
  taxRateId = (
    await upsertRef(
      await db
        .insert(taxRate)
        .values({ name: 'TVA perso', rate: '20.00' })
        .onConflictDoNothing()
        .returning(),
      () => db.select().from(taxRate).where(eq(taxRate.name, 'TVA perso')),
    )
  ).id;
});

const postCart = (body: unknown) =>
  app.handle(
    new Request('http://localhost/cart/items', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );

describe('B2 — personnalisation produit', () => {
  it('le détail by-slug expose personalizationEnabled + les champs', async () => {
    const { field } = await personalizableProduct('perso-detail');
    const res = await app.handle(new Request('http://localhost/products/by-slug/perso-detail'));
    const detail = (await res.json()) as {
      personalizationEnabled: boolean;
      personalizationFields: { id: string; label: string; priceHt: string; required: boolean }[];
    };
    expect(detail.personalizationEnabled).toBe(true);
    expect(detail.personalizationFields).toHaveLength(1);
    expect(detail.personalizationFields[0]).toMatchObject({
      id: field.id,
      label: 'Prénom',
      priceHt: '5.00',
      required: true,
    });
  });

  it('ajout panier : écho des valeurs + supplément +5 € dans le total', async () => {
    const { variant: v, field } = await personalizableProduct('perso-cart');
    const res = await postCart({
      variantId: v.id,
      quantity: 1,
      personalization: { [field.id]: 'Lucie' },
    });
    expect(res.status).toBe(200);
    const cart = (await res.json()) as {
      totalHt: string;
      items: { addonPriceHt: string; personalization: { label: string; value: string }[] }[];
    };
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].addonPriceHt).toBe('5.00');
    expect(cart.items[0].personalization).toEqual([
      { fieldId: field.id, label: 'Prénom', value: 'Lucie' },
    ]);
    expect(cart.totalHt).toBe('40.00'); // (35 + 5) × 1
  });

  it('validation : champ requis manquant → 400', async () => {
    const { variant: v } = await personalizableProduct('perso-required');
    const res = await postCart({ variantId: v.id, quantity: 1, personalization: {} });
    expect(res.status).toBe(400);
  });

  it('validation : champ inconnu → 400', async () => {
    const { variant: v } = await personalizableProduct('perso-unknown');
    const res = await postCart({
      variantId: v.id,
      quantity: 1,
      personalization: { 'not-a-field': 'x' },
    });
    expect(res.status).toBe(400);
  });

  it('commande : le supplément entre dans les totaux (snapshot)', async () => {
    const { product: p, variant: v, field } = await personalizableProduct('perso-order');
    const totals = await calculateOrderTotals([
      {
        id: 'line-1',
        quantity: 2,
        personalization: { [field.id]: 'Lucie' },
        variant: { id: v.id, priceHt: '35.00', sku: v.sku, quantity: 10 },
        product: { id: p.id, name: p.name, taxRateId },
      },
    ]);
    expect(totals.items[0].addonPriceHt).toBe(5);
    expect(totals.items[0].totalHt).toBe(80); // (35 + 5) × 2
  });
});
