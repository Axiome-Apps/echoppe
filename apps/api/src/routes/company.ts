import { company, country, db, eq } from '@echoppe/core';
import { Elysia, t } from 'elysia';
import { permissionGuard } from '../plugins/rbac';

const companyBody = t.Object({
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
  publisherName: t.Optional(t.Nullable(t.String({ maxLength: 255 }))),
  hostingProvider: t.Optional(t.Nullable(t.String({ maxLength: 255 }))),
  hostingAddress: t.Optional(t.Nullable(t.String({ maxLength: 500 }))),
  hostingPhone: t.Optional(t.Nullable(t.String({ maxLength: 20 }))),
});

const countrySchema = t.Object({
  id: t.String(),
  name: t.String(),
  code: t.String(),
  isShippingEnabled: t.Boolean(),
});

const companySchema = t.Object({
  id: t.String(),
  shopName: t.String(),
  logo: t.Nullable(t.String()),
  publicEmail: t.String(),
  publicPhone: t.Nullable(t.String()),
  legalName: t.String(),
  legalForm: t.Nullable(t.String()),
  siren: t.Nullable(t.String()),
  siret: t.Nullable(t.String()),
  tvaIntra: t.Nullable(t.String()),
  rcsCity: t.Nullable(t.String()),
  shareCapital: t.Nullable(t.String()),
  street: t.String(),
  street2: t.Nullable(t.String()),
  postalCode: t.String(),
  city: t.String(),
  country: t.String(),
  documentPrefix: t.String(),
  invoicePrefix: t.String(),
  taxExempt: t.Boolean(),
  publisherName: t.Nullable(t.String()),
  hostingProvider: t.Nullable(t.String()),
  hostingAddress: t.Nullable(t.String()),
  hostingPhone: t.Nullable(t.String()),
});

export const companyRoutes = new Elysia({ prefix: '/company', detail: { tags: ['Company'] } })

  // GET /company - Public: get company info
  .get(
    '/',
    async () => {
      const [info] = await db.select().from(company).limit(1);
      return info ?? null;
    },
    { response: { 200: t.Union([companySchema, t.Null()]) } },
  )

  // === ADMIN ROUTES ===
  .use(permissionGuard('company', 'read'))

  // GET /company/countries - List countries for select (admin)
  .get(
    '/countries',
    async () => {
      return db.select().from(country).orderBy(country.name);
    },
    { permission: true, response: t.Array(countrySchema) },
  )

  // === COMPANY UPDATE ===
  .use(permissionGuard('company', 'update'))

  // PUT /company - Create or update (upsert)
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
        publisherName: body.publisherName ?? null,
        hostingProvider: body.hostingProvider ?? null,
        hostingAddress: body.hostingAddress ?? null,
        hostingPhone: body.hostingPhone ?? null,
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
    { permission: true, body: companyBody, response: { 200: companySchema } },
  );
