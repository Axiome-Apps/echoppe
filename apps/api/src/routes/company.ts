import { company, country, db, eq } from '@echoppe/core';
import { Elysia, t } from 'elysia';
import { getClientIp, logAudit } from '../lib/audit';
import { models } from '../models';
import { companySchema } from '../models/company';
import { permissionGuard } from '../plugins/rbac';
import { withAuthErrors, withReadErrors } from '../utils/responses';

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

// Schémas d'entité (Company, Country, CountryList) → src/models/company.ts

export const companyRoutes = new Elysia({ prefix: '/company', detail: { tags: ['Company'] } })
  // Registre central des modèles nommés → components.schemas.
  .use(models)

  // GET /company - Public: get company info (mentions légales)
  .get(
    '/',
    async () => {
      const [info] = await db.select().from(company).limit(1);
      return info ?? null;
    },
    { response: withReadErrors({ 200: t.Union([companySchema, t.Null()]) }) },
  )

  // === ADMIN ROUTES ===
  .use(permissionGuard('company', 'read'))

  // GET /company/countries - List countries for select (admin)
  .get(
    '/countries',
    async () => {
      return db.select().from(country).orderBy(country.name);
    },
    { permission: true, response: withAuthErrors({ 200: 'CountryList' }) },
  )

  // === COMPANY UPDATE ===
  .use(permissionGuard('company', 'update'))

  // PUT /company - Create or update (upsert)
  .put(
    '/',
    async ({ body, currentUser, request }) => {
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

        logAudit({
          userId: currentUser?.id,
          action: 'company.update',
          entityType: 'company',
          entityId: updated.id,
          data: { shopName: updated.shopName },
          ipAddress: getClientIp(request.headers),
        });

        return updated;
      }

      const [created] = await db.insert(company).values(values).returning();

      logAudit({
        userId: currentUser?.id,
        action: 'company.update',
        entityType: 'company',
        entityId: created.id,
        data: { shopName: created.shopName },
        ipAddress: getClientIp(request.headers),
      });

      return created;
    },
    { permission: true, body: companyBody, response: withAuthErrors({ 200: 'Company' }) },
  );
