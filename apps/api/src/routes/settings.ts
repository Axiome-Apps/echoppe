import { company, country, db, eq } from '@echoppe/core';
import { Elysia, t } from 'elysia';
import { authPlugin } from '../plugins/auth';

const settingsBody = t.Object({
  shopName: t.String({ minLength: 1, maxLength: 255 }),
  logo: t.Optional(t.Nullable(t.String({ format: 'uuid' }))),
  publicEmail: t.String({ format: 'email', maxLength: 255 }),
  publicPhone: t.Optional(t.Nullable(t.String({ maxLength: 20 }))),
  legalName: t.String({ minLength: 1, maxLength: 255 }),
  legalForm: t.Optional(t.Nullable(t.String({ maxLength: 50 }))),
  siren: t.Optional(t.Nullable(t.String({ maxLength: 9 }))),
  siret: t.Optional(t.Nullable(t.String({ maxLength: 14 }))),
  tvaIntra: t.Optional(t.Nullable(t.String({ maxLength: 20 }))),
  rcsCity: t.Optional(t.Nullable(t.String({ maxLength: 100 }))),
  shareCapital: t.Optional(t.Nullable(t.String())), // Decimal as string
  street: t.String({ minLength: 1, maxLength: 255 }),
  street2: t.Optional(t.Nullable(t.String({ maxLength: 255 }))),
  postalCode: t.String({ minLength: 1, maxLength: 10 }),
  city: t.String({ minLength: 1, maxLength: 100 }),
  country: t.String({ format: 'uuid' }),
  documentPrefix: t.Optional(t.String({ minLength: 1, maxLength: 10 })),
  invoicePrefix: t.Optional(t.String({ minLength: 1, maxLength: 10 })),
  taxExempt: t.Optional(t.Boolean()),
});

const countrySchema = t.Object({
  id: t.String(),
  name: t.String(),
  code: t.String(),
  isShippingEnabled: t.Boolean(),
});

export const settingsRoutes = new Elysia({ prefix: '/settings', detail: { tags: ['Settings'] } })
  .use(authPlugin)

  // GET /settings - Get company settings (singleton)
  .get(
    '/',
    async () => {
      const [settings] = await db.select().from(company).limit(1);
      return settings ?? null;
    },
    { auth: true },
  )

  // GET /settings/countries - List countries for select
  .get(
    '/countries',
    async () => {
      return db.select().from(country).orderBy(country.name);
    },
    { auth: true, response: t.Array(countrySchema) },
  )

  // PUT /settings - Create or update (upsert)
  .put(
    '/',
    async ({ body }) => {
      const [existing] = await db.select({ id: company.id }).from(company).limit(1);

      const values = {
        shopName: body.shopName,
        logo: body.logo ?? null,
        publicEmail: body.publicEmail,
        publicPhone: body.publicPhone ?? null,
        legalName: body.legalName,
        legalForm: body.legalForm ?? null,
        siren: body.siren ?? null,
        siret: body.siret ?? null,
        tvaIntra: body.tvaIntra ?? null,
        rcsCity: body.rcsCity ?? null,
        shareCapital: body.shareCapital ?? null,
        street: body.street,
        street2: body.street2 ?? null,
        postalCode: body.postalCode,
        city: body.city,
        country: body.country,
        documentPrefix: body.documentPrefix ?? 'REC',
        invoicePrefix: body.invoicePrefix ?? 'FA',
        taxExempt: body.taxExempt ?? false,
      };

      if (existing) {
        const [updated] = await db
          .update(company)
          .set(values)
          .where(eq(company.id, existing.id))
          .returning();
        return updated;
      }

      const [created] = await db.insert(company).values(values).returning();
      return created;
    },
    { auth: true, body: settingsBody },
  );
