import { Elysia, t } from 'elysia';
import { db, category, product, variant, productMedia, eq, and, inArray, count } from '@echoppe/core';
import { slugify } from '@echoppe/shared';
import { permissionGuard } from '../plugins/rbac';
import { paginationQuery, paginatedResponse, getPaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { successSchema, withAuthErrors, withCrudErrors, withNotFound } from '../utils/responses';

// Schema de réponse pour les catégories
const categorySchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  description: t.Nullable(t.String()),
  parent: t.Nullable(t.String()),
  image: t.Nullable(t.String()),
  sortOrder: t.Number(),
  isVisible: t.Boolean(),
});

const batchOrderBody = t.Array(
  t.Object({
    id: t.String({ format: 'uuid' }),
    parent: t.Nullable(t.String({ format: 'uuid' })),
    sortOrder: t.Number(),
  })
);

const categoryCreateBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  description: t.Optional(t.String()),
  parent: t.Optional(t.String({ format: 'uuid' })),
  image: t.Optional(t.String({ format: 'uuid' })),
  sortOrder: t.Optional(t.Number({ default: 0 })),
  isVisible: t.Optional(t.Boolean({ default: true })),
});

const categoryUpdateBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  description: t.Optional(t.String()),
  parent: t.Optional(t.String({ format: 'uuid' })),
  image: t.Optional(t.String({ format: 'uuid' })),
  sortOrder: t.Optional(t.Number({ default: 0 })),
  isVisible: t.Optional(t.Boolean({ default: true })),
});

const categoryParams = t.Object({
  id: t.String({ format: 'uuid' }),
});

// Schemas de réponse spécifiques
const batchSuccessSchema = t.Object({ success: t.Boolean(), count: t.Number() });

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

export const categoriesRoutes = new Elysia({ prefix: '/categories', detail: { tags: ['Categories'] } })

  // === PUBLIC ROUTES ===

  // GET /categories - List all (public)
  .get('/', async () => {
    return db.select().from(category).orderBy(category.sortOrder);
  }, { response: t.Array(categorySchema) })

  // GET /categories/:id - Get one (public)
  .get(
    '/:id',
    async ({ params, status }) => {
      const [found] = await db.select().from(category).where(eq(category.id, params.id));
      if (!found) return status(404, { message: 'Category not found' });
      return found;
    },
    {
      params: categoryParams,
      response: withNotFound({ 200: categorySchema }),
    }
  )

  // GET /categories/by-slug/:slug - Get one by slug (public)
  .get(
    '/by-slug/:slug',
    async ({ params, status }) => {
      const [found] = await db.select().from(category).where(eq(category.slug, params.slug));
      if (!found) return status(404, { message: 'Category not found' });
      return found;
    },
    {
      params: t.Object({ slug: t.String() }),
      response: withNotFound({ 200: categorySchema }),
    }
  )

  // GET /categories/:id/products - Get products in category with pagination (public)
  .get(
    '/:id/products',
    async ({ params, query, status }) => {
      const [categoryExists] = await db.select().from(category).where(eq(category.id, params.id));
      if (!categoryExists) return status(404, { message: 'Category not found' });

      const { page, limit, offset } = getPaginationParams(query);

      const [products, [{ total }]] = await Promise.all([
        db.select().from(product).where(eq(product.category, params.id)).orderBy(product.dateCreated).limit(limit).offset(offset),
        db.select({ total: count(product.id) }).from(product).where(eq(product.category, params.id)),
      ]);

      // Fetch featured images and default variants
      const productIds = products.map((p) => p.id);

      const [featuredImages, defaultVariants] = await Promise.all([
        productIds.length > 0
          ? db
              .select({ productId: productMedia.product, mediaId: productMedia.media })
              .from(productMedia)
              .where(and(inArray(productMedia.product, productIds), eq(productMedia.isFeatured, true)))
          : [],
        productIds.length > 0
          ? db
              .select({
                productId: variant.product,
                priceHt: variant.priceHt,
                compareAtPriceHt: variant.compareAtPriceHt,
                quantity: variant.quantity,
              })
              .from(variant)
              .where(and(inArray(variant.product, productIds), eq(variant.isDefault, true)))
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
      params: categoryParams,
      query: paginationQuery,
      response: withNotFound({ 200: paginatedResponse(productListSchema) }),
    }
  )

  // === PROTECTED ROUTES (Admin) ===

  // POST /categories - Create (slug auto-generated)
  .use(permissionGuard('category', 'create'))
  .post(
    '/',
    async ({ body }) => {
      const [created] = await db
        .insert(category)
        .values({
          name: body.name,
          slug: slugify(body.name),
          description: body.description,
          parent: body.parent,
          image: body.image,
          sortOrder: body.sortOrder ?? 0,
          isVisible: body.isVisible ?? true,
        })
        .returning();
      return created;
    },
    { permission: true, body: categoryCreateBody, response: withAuthErrors({ 200: categorySchema }) }
  )

  // PUT /categories/:id - Update (slug immutable)
  .use(permissionGuard('category', 'update'))
  .put(
    '/:id',
    async ({ params, body, status }) => {
      const [updated] = await db
        .update(category)
        .set({
          name: body.name,
          description: body.description,
          parent: body.parent,
          image: body.image,
          sortOrder: body.sortOrder,
          isVisible: body.isVisible,
        })
        .where(eq(category.id, params.id))
        .returning();
      if (!updated) return status(404, { message: 'Category not found' });
      return updated;
    },
    {
      permission: true,
      params: categoryParams,
      body: categoryUpdateBody,
      response: withCrudErrors({ 200: categorySchema }),
    }
  )

  // PATCH /categories/batch/order - Batch update parent and sortOrder (drag & drop)
  .patch(
    '/batch/order',
    async ({ body }) => {
      await db.transaction(async (tx) => {
        for (const update of body) {
          await tx
            .update(category)
            .set({
              parent: update.parent,
              sortOrder: update.sortOrder,
            })
            .where(eq(category.id, update.id));
        }
      });
      return { success: true, count: body.length };
    },
    { permission: true, body: batchOrderBody, response: withAuthErrors({ 200: batchSuccessSchema }) }
  )

  // DELETE /categories/:id - Delete
  .use(permissionGuard('category', 'delete'))
  .delete(
    '/:id',
    async ({ params, status }) => {
      const [deleted] = await db.delete(category).where(eq(category.id, params.id)).returning();
      if (!deleted) return status(404, { message: 'Category not found' });
      return { success: true };
    },
    {
      permission: true,
      params: categoryParams,
      response: withCrudErrors({ 200: successSchema }),
    }
  );
