import { Elysia, t } from 'elysia';
import { db, product, variant, option, optionValue, productMedia, eq, and, count } from '@echoppe/core';
import { slugify } from '@echoppe/shared';
import { authPlugin } from '../plugins/auth';
import { paginationQuery, getPaginationParams, buildPaginatedResponse } from '../utils/pagination';

const productCreateBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String()),
  category: t.String({ format: 'uuid' }),
  taxRate: t.String({ format: 'uuid' }),
  status: t.Optional(t.Union([t.Literal('draft'), t.Literal('published'), t.Literal('archived')])),
});

const productUpdateBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  description: t.Optional(t.String()),
  category: t.String({ format: 'uuid' }),
  taxRate: t.String({ format: 'uuid' }),
  status: t.Optional(t.Union([t.Literal('draft'), t.Literal('published'), t.Literal('archived')])),
});

const productPatchBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  slug: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  description: t.Optional(t.String()),
  category: t.Optional(t.String({ format: 'uuid' })),
  taxRate: t.Optional(t.String({ format: 'uuid' })),
  status: t.Optional(t.Union([t.Literal('draft'), t.Literal('published'), t.Literal('archived')])),
});

const productParams = t.Object({
  id: t.String({ format: 'uuid' }),
});

const variantParams = t.Object({
  id: t.String({ format: 'uuid' }),
  variantId: t.String({ format: 'uuid' }),
});

const mediaParams = t.Object({
  id: t.String({ format: 'uuid' }),
  mediaId: t.String({ format: 'uuid' }),
});

const optionParams = t.Object({
  id: t.String({ format: 'uuid' }),
  optionId: t.String({ format: 'uuid' }),
});

const variantBody = t.Object({
  sku: t.Optional(t.String({ maxLength: 50 })),
  barcode: t.Optional(t.String({ maxLength: 50 })),
  priceHt: t.Number({ minimum: 0 }),
  compareAtPriceHt: t.Optional(t.Number({ minimum: 0 })),
  costPrice: t.Optional(t.Number({ minimum: 0 })),
  weight: t.Optional(t.Number({ minimum: 0 })),
  length: t.Optional(t.Number({ minimum: 0 })),
  width: t.Optional(t.Number({ minimum: 0 })),
  height: t.Optional(t.Number({ minimum: 0 })),
  isDefault: t.Optional(t.Boolean({ default: false })),
  status: t.Optional(t.Union([t.Literal('draft'), t.Literal('published'), t.Literal('archived')])),
  sortOrder: t.Optional(t.Number({ default: 0 })),
  quantity: t.Optional(t.Number({ default: 0 })),
  lowStockThreshold: t.Optional(t.Number({ default: 5 })),
});

const productMediaBody = t.Object({
  mediaId: t.String({ format: 'uuid' }),
  sortOrder: t.Optional(t.Number({ default: 0 })),
  isFeatured: t.Optional(t.Boolean({ default: false })),
  featuredForVariant: t.Optional(t.String({ format: 'uuid' })),
});

const productMediaUpdateBody = t.Object({
  sortOrder: t.Optional(t.Number()),
  isFeatured: t.Optional(t.Boolean()),
  featuredForVariant: t.Optional(t.Union([t.String({ format: 'uuid' }), t.Null()])),
});

const optionBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 50 }),
  sortOrder: t.Optional(t.Number({ default: 0 })),
});

const optionValueBody = t.Object({
  value: t.String({ minLength: 1, maxLength: 100 }),
  sortOrder: t.Optional(t.Number({ default: 0 })),
});

export const productsRoutes = new Elysia({ prefix: '/products' })
  .use(authPlugin)

  // === PUBLIC ROUTES ===

  // GET /products - List all with pagination (public)
  .get(
    '/',
    async ({ query }) => {
      const { page, limit, offset } = getPaginationParams(query);

      const [products, [{ total }]] = await Promise.all([
        db.select().from(product).orderBy(product.dateCreated).limit(limit).offset(offset),
        db.select({ total: count(product.id) }).from(product),
      ]);

      return buildPaginatedResponse(products, total, page, limit);
    },
    { query: paginationQuery }
  )

  // GET /products/:id - Get one with variants (public)
  .get(
    '/:id',
    async ({ params, status }) => {
      const [found] = await db.select().from(product).where(eq(product.id, params.id));
      if (!found) return status(404, { message: 'Product not found' });

      const variants = await db.select().from(variant).where(eq(variant.product, params.id));
      const options = await db.select().from(option).where(eq(option.product, params.id));

      const optionsWithValues = await Promise.all(
        options.map(async (opt) => {
          const values = await db.select().from(optionValue).where(eq(optionValue.option, opt.id));
          return { ...opt, values };
        })
      );

      return { ...found, variants, options: optionsWithValues };
    },
    { params: productParams }
  )

  // GET /products/:id/variants (public)
  .get(
    '/:id/variants',
    async ({ params }) => {
      const variants = await db.select().from(variant).where(eq(variant.product, params.id)).orderBy(variant.sortOrder);
      return variants;
    },
    { params: productParams }
  )

  // === PROTECTED ROUTES (Admin) ===

  // POST /products - Create
  .post(
    '/',
    async ({ body }) => {
      const [created] = await db
        .insert(product)
        .values({
          name: body.name,
          slug: slugify(body.name),
          description: body.description,
          category: body.category,
          taxRate: body.taxRate,
          status: body.status ?? 'draft',
        })
        .returning();
      return created;
    },
    { auth: true, body: productCreateBody }
  )

  // PUT /products/:id - Update (full, slug immutable)
  .put(
    '/:id',
    async ({ params, body, status }) => {
      const [updated] = await db
        .update(product)
        .set({
          name: body.name,
          description: body.description,
          category: body.category,
          taxRate: body.taxRate,
          status: body.status,
          dateUpdated: new Date(),
        })
        .where(eq(product.id, params.id))
        .returning();
      if (!updated) return status(404, { message: 'Product not found' });
      return updated;
    },
    { auth: true, params: productParams, body: productUpdateBody }
  )

  // PATCH /products/:id - Partial update
  .patch(
    '/:id',
    async ({ params, body, status }) => {
      const updateData: Record<string, unknown> = { dateUpdated: new Date() };

      if (body.name !== undefined) updateData.name = body.name;
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.taxRate !== undefined) updateData.taxRate = body.taxRate;
      if (body.status !== undefined) updateData.status = body.status;

      const [updated] = await db
        .update(product)
        .set(updateData)
        .where(eq(product.id, params.id))
        .returning();

      if (!updated) return status(404, { message: 'Product not found' });
      return updated;
    },
    { auth: true, params: productParams, body: productPatchBody }
  )

  // DELETE /products/:id - Delete
  .delete(
    '/:id',
    async ({ params, status }) => {
      const [deleted] = await db.delete(product).where(eq(product.id, params.id)).returning();
      if (!deleted) return status(404, { message: 'Product not found' });
      return { success: true };
    },
    { auth: true, params: productParams }
  )

  // === VARIANTS ===

  // POST /products/:id/variants
  .post(
    '/:id/variants',
    async ({ params, body, status }) => {
      const [productExists] = await db.select().from(product).where(eq(product.id, params.id));
      if (!productExists) return status(404, { message: 'Product not found' });

      const [created] = await db
        .insert(variant)
        .values({
          product: params.id,
          sku: body.sku,
          barcode: body.barcode,
          priceHt: String(body.priceHt),
          compareAtPriceHt: body.compareAtPriceHt ? String(body.compareAtPriceHt) : null,
          costPrice: body.costPrice ? String(body.costPrice) : null,
          weight: body.weight ? String(body.weight) : null,
          length: body.length ? String(body.length) : null,
          width: body.width ? String(body.width) : null,
          height: body.height ? String(body.height) : null,
          isDefault: body.isDefault ?? false,
          status: body.status ?? 'draft',
          sortOrder: body.sortOrder ?? 0,
          quantity: body.quantity ?? 0,
          lowStockThreshold: body.lowStockThreshold ?? 5,
        })
        .returning();
      return created;
    },
    { auth: true, params: productParams, body: variantBody }
  )

  // PUT /products/:id/variants/:variantId
  .put(
    '/:id/variants/:variantId',
    async ({ params, body, status }) => {
      const [updated] = await db
        .update(variant)
        .set({
          sku: body.sku,
          barcode: body.barcode,
          priceHt: String(body.priceHt),
          compareAtPriceHt: body.compareAtPriceHt ? String(body.compareAtPriceHt) : null,
          costPrice: body.costPrice ? String(body.costPrice) : null,
          weight: body.weight ? String(body.weight) : null,
          length: body.length ? String(body.length) : null,
          width: body.width ? String(body.width) : null,
          height: body.height ? String(body.height) : null,
          isDefault: body.isDefault ?? false,
          status: body.status ?? 'draft',
          sortOrder: body.sortOrder ?? 0,
          quantity: body.quantity ?? 0,
          lowStockThreshold: body.lowStockThreshold ?? 5,
        })
        .where(and(eq(variant.id, params.variantId), eq(variant.product, params.id)))
        .returning();
      if (!updated) return status(404, { message: 'Variant not found' });
      return updated;
    },
    { auth: true, params: variantParams, body: variantBody }
  )

  // DELETE /products/:id/variants/:variantId
  .delete(
    '/:id/variants/:variantId',
    async ({ params, status }) => {
      const [deleted] = await db
        .delete(variant)
        .where(and(eq(variant.id, params.variantId), eq(variant.product, params.id)))
        .returning();
      if (!deleted) return status(404, { message: 'Variant not found' });
      return { success: true };
    },
    { auth: true, params: variantParams }
  )

  // === MEDIA ===

  // GET /products/:id/media
  .get(
    '/:id/media',
    async ({ params }) => {
      const media = await db
        .select()
        .from(productMedia)
        .where(eq(productMedia.product, params.id))
        .orderBy(productMedia.sortOrder);
      return media;
    },
    { auth: true, params: productParams }
  )

  // POST /products/:id/media - Add media to product
  .post(
    '/:id/media',
    async ({ params, body, status }) => {
      const [productExists] = await db.select().from(product).where(eq(product.id, params.id));
      if (!productExists) return status(404, { message: 'Product not found' });

      // If setting as featured, unset other featured
      if (body.isFeatured) {
        await db
          .update(productMedia)
          .set({ isFeatured: false })
          .where(and(eq(productMedia.product, params.id), eq(productMedia.isFeatured, true)));
      }

      const [created] = await db
        .insert(productMedia)
        .values({
          product: params.id,
          media: body.mediaId,
          sortOrder: body.sortOrder ?? 0,
          isFeatured: body.isFeatured ?? false,
          featuredForVariant: body.featuredForVariant ?? null,
        })
        .returning();
      return created;
    },
    { auth: true, params: productParams, body: productMediaBody }
  )

  // PUT /products/:id/media/:mediaId - Update media settings
  .put(
    '/:id/media/:mediaId',
    async ({ params, body, status }) => {
      // If setting as featured, unset other featured
      if (body.isFeatured) {
        await db
          .update(productMedia)
          .set({ isFeatured: false })
          .where(and(eq(productMedia.product, params.id), eq(productMedia.isFeatured, true)));
      }

      // If setting variant featured, unset other for same variant
      if (body.featuredForVariant) {
        await db
          .update(productMedia)
          .set({ featuredForVariant: null })
          .where(eq(productMedia.featuredForVariant, body.featuredForVariant));
      }

      const [updated] = await db
        .update(productMedia)
        .set({
          sortOrder: body.sortOrder,
          isFeatured: body.isFeatured,
          featuredForVariant: body.featuredForVariant,
        })
        .where(and(eq(productMedia.product, params.id), eq(productMedia.media, params.mediaId)))
        .returning();

      if (!updated) return status(404, { message: 'Product media not found' });
      return updated;
    },
    { auth: true, params: mediaParams, body: productMediaUpdateBody }
  )

  // DELETE /products/:id/media/:mediaId
  .delete(
    '/:id/media/:mediaId',
    async ({ params, status }) => {
      const [deleted] = await db
        .delete(productMedia)
        .where(and(eq(productMedia.product, params.id), eq(productMedia.media, params.mediaId)))
        .returning();
      if (!deleted) return status(404, { message: 'Product media not found' });
      return { success: true };
    },
    { auth: true, params: mediaParams }
  )

  // === OPTIONS ===

  // POST /products/:id/options
  .post(
    '/:id/options',
    async ({ params, body, status }) => {
      const [productExists] = await db.select().from(product).where(eq(product.id, params.id));
      if (!productExists) return status(404, { message: 'Product not found' });

      const [created] = await db
        .insert(option)
        .values({
          product: params.id,
          name: body.name,
          sortOrder: body.sortOrder ?? 0,
        })
        .returning();
      return created;
    },
    { auth: true, params: productParams, body: optionBody }
  )

  // POST /products/:id/options/:optionId/values
  .post(
    '/:id/options/:optionId/values',
    async ({ params, body, status }) => {
      const [optionExists] = await db.select().from(option).where(eq(option.id, params.optionId));
      if (!optionExists) return status(404, { message: 'Option not found' });

      const [created] = await db
        .insert(optionValue)
        .values({
          option: params.optionId,
          value: body.value,
          sortOrder: body.sortOrder ?? 0,
        })
        .returning();
      return created;
    },
    { auth: true, params: optionParams, body: optionValueBody }
  );
