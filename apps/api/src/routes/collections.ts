import { Elysia, t } from 'elysia';
import { db, collection, product, productCollection, variant, productMedia, eq, and, inArray, count } from '@echoppe/core';
import { slugify } from '@echoppe/shared';
import { permissionGuard } from '../plugins/rbac';
import { paginationQuery, paginatedResponse, getPaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { successSchema, withAuthErrors, withCrudErrors, withNotFound } from '../utils/responses';
import { logAudit, getClientIp } from '../lib/audit';

// Schema de réponse pour les collections
const collectionSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  description: t.Nullable(t.String()),
  image: t.Nullable(t.String()),
  isVisible: t.Boolean(),
  dateCreated: t.Date(),
});

const collectionCreateBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  description: t.Optional(t.String()),
  image: t.Optional(t.String({ format: 'uuid' })),
  isVisible: t.Optional(t.Boolean({ default: true })),
});

const collectionUpdateBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  description: t.Optional(t.String()),
  image: t.Optional(t.String({ format: 'uuid' })),
  isVisible: t.Optional(t.Boolean({ default: true })),
});

const collectionParams = t.Object({
  id: t.String({ format: 'uuid' }),
});


// Schema pour les produits (liste)
const defaultVariantSchema = t.Object({
  priceHt: t.String(),
  compareAtPriceHt: t.Nullable(t.String()),
  quantity: t.Number(),
});

const productListSchema = t.Object({
  id: t.String(),
  category: t.String(),
  taxRate: t.String(),
  name: t.String(),
  slug: t.String(),
  description: t.Nullable(t.String()),
  status: t.Union([t.Literal('draft'), t.Literal('published'), t.Literal('archived')]),
  dateCreated: t.Date(),
  dateUpdated: t.Date(),
  featuredImage: t.Nullable(t.String()),
  defaultVariant: t.Nullable(defaultVariantSchema),
});

export const collectionsRoutes = new Elysia({ prefix: '/collections', detail: { tags: ['Collections'] } })

  // === PUBLIC ROUTES ===

  // GET /collections - List all with pagination (public)
  .get(
    '/',
    async ({ query }) => {
      const { page, limit, offset } = getPaginationParams(query);

      const [collections, [{ total }]] = await Promise.all([
        db.select().from(collection).orderBy(collection.dateCreated).limit(limit).offset(offset),
        db.select({ total: count(collection.id) }).from(collection),
      ]);

      return buildPaginatedResponse(collections, total, page, limit);
    },
    { query: paginationQuery, response: paginatedResponse(collectionSchema) }
  )

  // GET /collections/:id - Get one (public)
  .get(
    '/:id',
    async ({ params, status }) => {
      const [found] = await db.select().from(collection).where(eq(collection.id, params.id));
      if (!found) return status(404, { message: 'Collection non trouvee' });
      return found;
    },
    {
      params: collectionParams,
      response: withNotFound({ 200: collectionSchema }),
    }
  )

  // GET /collections/by-slug/:slug - Get one by slug (public)
  .get(
    '/by-slug/:slug',
    async ({ params, status }) => {
      const [found] = await db.select().from(collection).where(eq(collection.slug, params.slug));
      if (!found) return status(404, { message: 'Collection not found' });
      return found;
    },
    {
      params: t.Object({ slug: t.String() }),
      response: withNotFound({ 200: collectionSchema }),
    }
  )

  // GET /collections/:id/products - Get products in collection with pagination (public)
  .get(
    '/:id/products',
    async ({ params, query, status }) => {
      const [collectionExists] = await db.select().from(collection).where(eq(collection.id, params.id));
      if (!collectionExists) return status(404, { message: 'Collection not found' });

      const { page, limit, offset } = getPaginationParams(query);

      // Get product IDs in this collection
      const productIds = await db
        .select({ productId: productCollection.product })
        .from(productCollection)
        .where(eq(productCollection.collection, params.id));

      const ids = productIds.map((p) => p.productId);

      if (ids.length === 0) {
        return buildPaginatedResponse([], 0, page, limit);
      }

      const [products, [{ total }]] = await Promise.all([
        db.select().from(product).where(inArray(product.id, ids)).orderBy(product.dateCreated).limit(limit).offset(offset),
        db.select({ total: count(product.id) }).from(product).where(inArray(product.id, ids)),
      ]);

      // Fetch featured images and default variants
      const pIds = products.map((p) => p.id);

      const [featuredImages, defaultVariants] = await Promise.all([
        pIds.length > 0
          ? db
              .select({ productId: productMedia.product, mediaId: productMedia.media })
              .from(productMedia)
              .where(and(inArray(productMedia.product, pIds), eq(productMedia.isFeatured, true)))
          : [],
        pIds.length > 0
          ? db
              .select({
                productId: variant.product,
                priceHt: variant.priceHt,
                compareAtPriceHt: variant.compareAtPriceHt,
                quantity: variant.quantity,
              })
              .from(variant)
              .where(and(inArray(variant.product, pIds), eq(variant.isDefault, true)))
          : [],
      ]);

      const featuredImageMap = new Map(featuredImages.map((fi) => [fi.productId, fi.mediaId]));
      const defaultVariantMap = new Map(
        defaultVariants.map((dv) => [
          dv.productId,
          { priceHt: dv.priceHt, compareAtPriceHt: dv.compareAtPriceHt, quantity: dv.quantity },
        ])
      );

      const enrichedProducts = products.map((p) => ({
        ...p,
        featuredImage: featuredImageMap.get(p.id) ?? null,
        defaultVariant: defaultVariantMap.get(p.id) ?? null,
      }));

      return buildPaginatedResponse(enrichedProducts, total, page, limit);
    },
    {
      params: collectionParams,
      query: paginationQuery,
      response: withNotFound({ 200: paginatedResponse(productListSchema) }),
    }
  )

  // === PROTECTED ROUTES (Admin) ===

  // POST /collections - Create (slug auto-generated)
  .use(permissionGuard('collection', 'create'))
  .post(
    '/',
    async ({ body, currentUser, request }) => {
      const [created] = await db
        .insert(collection)
        .values({
          name: body.name,
          slug: slugify(body.name),
          description: body.description,
          image: body.image,
          isVisible: body.isVisible ?? true,
        })
        .returning();

      logAudit({
        userId: currentUser?.id,
        action: 'collection.create',
        entityType: 'collection',
        entityId: created.id,
        data: { name: created.name },
        ipAddress: getClientIp(request.headers),
      });

      return created;
    },
    { permission: true, body: collectionCreateBody, response: withAuthErrors({ 200: collectionSchema }) }
  )

  // PUT /collections/:id - Update (slug immutable)
  .use(permissionGuard('collection', 'update'))
  .put(
    '/:id',
    async ({ params, body, status, currentUser, request }) => {
      const [updated] = await db
        .update(collection)
        .set({
          name: body.name,
          description: body.description,
          image: body.image,
          isVisible: body.isVisible,
        })
        .where(eq(collection.id, params.id))
        .returning();
      if (!updated) return status(404, { message: 'Collection non trouvee' });

      logAudit({
        userId: currentUser?.id,
        action: 'collection.update',
        entityType: 'collection',
        entityId: params.id,
        data: { name: updated.name },
        ipAddress: getClientIp(request.headers),
      });

      return updated;
    },
    {
      permission: true,
      params: collectionParams,
      body: collectionUpdateBody,
      response: withCrudErrors({ 200: collectionSchema }),
    }
  )

  // DELETE /collections/:id - Delete
  .use(permissionGuard('collection', 'delete'))
  .delete(
    '/:id',
    async ({ params, status, currentUser, request }) => {
      const [deleted] = await db.delete(collection).where(eq(collection.id, params.id)).returning();
      if (!deleted) return status(404, { message: 'Collection non trouvee' });

      logAudit({
        userId: currentUser?.id,
        action: 'collection.delete',
        entityType: 'collection',
        entityId: params.id,
        data: { name: deleted.name },
        ipAddress: getClientIp(request.headers),
      });

      return { success: true };
    },
    {
      permission: true,
      params: collectionParams,
      response: withCrudErrors({ 200: successSchema }),
    }
  );
