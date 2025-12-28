import { Elysia, t } from 'elysia';
import { db, product, variant, option, optionValue, variantOptionValue, productOption, productMedia, eq, and, or, count, ilike, inArray, gte, lte, gt, asc, desc, sql } from '@echoppe/core';
import type { SQL } from '@echoppe/core';
import { slugify } from '@echoppe/shared';
import { permissionGuard } from '../plugins/rbac';
import { paginatedResponse, getPaginationParams, buildPaginatedResponse } from '../utils/pagination';

// Schema du produit pour les réponses (liste)
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

// Schema du produit pour les réponses (création/modification)
const productSchema = t.Object({
  id: t.String(),
  category: t.String(),
  taxRate: t.String(),
  name: t.String(),
  slug: t.String(),
  description: t.Nullable(t.String()),
  status: t.Union([t.Literal('draft'), t.Literal('published'), t.Literal('archived')]),
  dateCreated: t.Date(),
  dateUpdated: t.Date(),
});

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

// Schemas génériques
const errorSchema = t.Object({ message: t.String() });
const successSchema = t.Object({ success: t.Boolean() });

// Query schema pour recherche/filtres/tri
const productSearchQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
  search: t.Optional(t.String()),
  category: t.Optional(t.String({ format: 'uuid' })),
  minPrice: t.Optional(t.Numeric({ minimum: 0 })),
  maxPrice: t.Optional(t.Numeric({ minimum: 0 })),
  inStock: t.Optional(t.BooleanString()),
  sort: t.Optional(t.Union([t.Literal('price'), t.Literal('name'), t.Literal('date')])),
  order: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
});

// Schema option
const optionSchema = t.Object({
  id: t.String(),
  name: t.String(),
});

const optionValueSchema = t.Object({
  id: t.String(),
  option: t.String(),
  value: t.String(),
  sortOrder: t.Number(),
});

// Schema pour product media (réponse)
const productMediaSchema = t.Object({
  product: t.String(),
  media: t.String(),
  sortOrder: t.Number(),
  isFeatured: t.Boolean(),
  featuredForVariant: t.Nullable(t.String()),
});

// Schema pour variant (réponse)
const variantSchema = t.Object({
  id: t.String(),
  product: t.String(),
  sku: t.Nullable(t.String()),
  barcode: t.Nullable(t.String()),
  priceHt: t.String(),
  compareAtPriceHt: t.Nullable(t.String()),
  costPrice: t.Nullable(t.String()),
  weight: t.Nullable(t.String()),
  length: t.Nullable(t.String()),
  width: t.Nullable(t.String()),
  height: t.Nullable(t.String()),
  isDefault: t.Boolean(),
  status: t.Union([t.Literal('draft'), t.Literal('published'), t.Literal('archived')]),
  sortOrder: t.Number(),
  quantity: t.Number(),
  reserved: t.Number(),
  lowStockThreshold: t.Nullable(t.Number()),
});

export const productsRoutes = new Elysia({ prefix: '/products', detail: { tags: ['Products'] } })

  // === PUBLIC ROUTES ===

  // GET /products - List all with pagination, search, filters, sort (public)
  .get(
    '/',
    async ({ query }) => {
      const { page, limit, offset } = getPaginationParams(query);
      const { search, category, minPrice, maxPrice, inStock, sort, order } = query;

      // Build WHERE conditions
      const conditions: SQL[] = [];

      // Search by name or description
      if (search) {
        const searchPattern = `%${search}%`;
        conditions.push(or(ilike(product.name, searchPattern), ilike(product.description, searchPattern))!);
      }

      // Filter by category
      if (category) {
        conditions.push(eq(product.category, category));
      }

      // For price and stock filters, we need to join with variant
      // First, get filtered product IDs based on variant conditions
      let filteredProductIds: string[] | null = null;

      if (minPrice !== undefined || maxPrice !== undefined || inStock) {
        const variantConditions: SQL[] = [eq(variant.isDefault, true)];

        if (minPrice !== undefined) {
          variantConditions.push(gte(sql`CAST(${variant.priceHt} AS DECIMAL)`, minPrice));
        }
        if (maxPrice !== undefined) {
          variantConditions.push(lte(sql`CAST(${variant.priceHt} AS DECIMAL)`, maxPrice));
        }
        if (inStock) {
          variantConditions.push(gt(variant.quantity, 0));
        }

        const matchingVariants = await db
          .select({ productId: variant.product })
          .from(variant)
          .where(and(...variantConditions));

        filteredProductIds = matchingVariants.map((v) => v.productId);

        if (filteredProductIds.length === 0) {
          return buildPaginatedResponse([], 0, page, limit);
        }

        conditions.push(inArray(product.id, filteredProductIds));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Build ORDER BY
      let orderByClause;
      const sortOrder = order === 'desc' ? desc : asc;

      switch (sort) {
        case 'name':
          orderByClause = sortOrder(product.name);
          break;
        case 'date':
          orderByClause = sortOrder(product.dateCreated);
          break;
        case 'price':
          // Price sorting needs special handling (done after enrichment)
          orderByClause = sortOrder(product.dateCreated);
          break;
        default:
          orderByClause = desc(product.dateCreated);
      }

      // Query products
      const [products, [{ total }]] = await Promise.all([
        db.select().from(product).where(whereClause).orderBy(orderByClause).limit(limit).offset(offset),
        db.select({ total: count(product.id) }).from(product).where(whereClause),
      ]);

      // Fetch featured images and default variants for all products
      const productIds = products.map((p) => p.id);

      const [featuredImages, defaultVariants] = await Promise.all([
        productIds.length > 0
          ? db
              .select({ productId: productMedia.product, mediaId: productMedia.media })
              .from(productMedia)
              .where(and(
                inArray(productMedia.product, productIds),
                eq(productMedia.isFeatured, true)
              ))
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
              .where(and(
                inArray(variant.product, productIds),
                eq(variant.isDefault, true)
              ))
          : [],
      ]);

      // Create lookup maps
      const featuredImageMap = new Map(featuredImages.map((fi) => [fi.productId, fi.mediaId]));
      const defaultVariantMap = new Map(defaultVariants.map((dv) => [dv.productId, {
        priceHt: dv.priceHt,
        compareAtPriceHt: dv.compareAtPriceHt,
        quantity: dv.quantity,
      }]));

      // Enrich products
      let enrichedProducts = products.map((p) => ({
        ...p,
        featuredImage: featuredImageMap.get(p.id) ?? null,
        defaultVariant: defaultVariantMap.get(p.id) ?? null,
      }));

      // Sort by price if requested (post-enrichment)
      if (sort === 'price') {
        enrichedProducts = enrichedProducts.sort((a, b) => {
          const priceA = a.defaultVariant ? parseFloat(a.defaultVariant.priceHt) : 0;
          const priceB = b.defaultVariant ? parseFloat(b.defaultVariant.priceHt) : 0;
          return order === 'desc' ? priceB - priceA : priceA - priceB;
        });
      }

      return buildPaginatedResponse(enrichedProducts, total, page, limit);
    },
    { query: productSearchQuery, response: paginatedResponse(productListSchema) }
  )

  // GET /products/by-slug/:slug - Get one by slug with variants (public, for storefront)
  .get(
    '/by-slug/:slug',
    async ({ params, status }) => {
      const [found] = await db.select().from(product).where(eq(product.slug, params.slug));
      if (!found) return status(404, { message: 'Product not found' });

      const variants = await db.select().from(variant).where(eq(variant.product, found.id)).orderBy(variant.sortOrder);

      // Get featured image
      const [featuredMedia] = await db
        .select({ mediaId: productMedia.media })
        .from(productMedia)
        .where(and(eq(productMedia.product, found.id), eq(productMedia.isFeatured, true)));

      // Get all product images
      const allMedia = await db
        .select({ mediaId: productMedia.media, sortOrder: productMedia.sortOrder })
        .from(productMedia)
        .where(eq(productMedia.product, found.id))
        .orderBy(productMedia.sortOrder);

      // Get all option values used by this product's variants
      const variantIds = variants.map(v => v.id);
      const usedOptionValues = variantIds.length > 0
        ? await db
            .select({ optionValueId: variantOptionValue.optionValue })
            .from(variantOptionValue)
            .where(inArray(variantOptionValue.variant, variantIds))
        : [];
      const usedOptionValueIds = new Set(usedOptionValues.map(ov => ov.optionValueId));

      // Get options for this product (only those with used values)
      const productOptions = await db
        .select({
          option: option,
          sortOrder: productOption.sortOrder,
        })
        .from(productOption)
        .innerJoin(option, eq(productOption.option, option.id))
        .where(eq(productOption.product, found.id))
        .orderBy(productOption.sortOrder);

      const optionsWithValues = await Promise.all(
        productOptions.map(async (po) => {
          const allValues = await db.select().from(optionValue).where(eq(optionValue.option, po.option.id)).orderBy(optionValue.sortOrder);
          // Filter to only values used by this product's variants
          const values = allValues.filter(v => usedOptionValueIds.has(v.id));
          return { ...po.option, sortOrder: po.sortOrder, values };
        })
      );

      // Filter out options with no values (shouldn't happen, but safety check)
      const filteredOptions = optionsWithValues.filter(o => o.values.length > 0);

      const variantsWithOptions = await Promise.all(
        variants.map(async (v) => {
          const optionValues = await db.select().from(variantOptionValue).where(eq(variantOptionValue.variant, v.id));
          return { ...v, optionValues: optionValues.map(ov => ov.optionValue) };
        })
      );

      return {
        ...found,
        featuredImage: featuredMedia?.mediaId ?? null,
        images: allMedia.map(m => m.mediaId),
        variants: variantsWithOptions,
        options: filteredOptions,
      };
    },
    { params: t.Object({ slug: t.String() }), response: { 404: errorSchema } }
  )

  // GET /products/:id - Get one with variants (public)
  .get(
    '/:id',
    async ({ params, status }) => {
      const [found] = await db.select().from(product).where(eq(product.id, params.id));
      if (!found) return status(404, { message: 'Product not found' });

      const variants = await db.select().from(variant).where(eq(variant.product, params.id)).orderBy(variant.sortOrder);

      // Get options for this product via junction table
      const productOptions = await db
        .select({
          option: option,
          sortOrder: productOption.sortOrder,
        })
        .from(productOption)
        .innerJoin(option, eq(productOption.option, option.id))
        .where(eq(productOption.product, params.id))
        .orderBy(productOption.sortOrder);

      // Load option values for each option
      const optionsWithValues = await Promise.all(
        productOptions.map(async (po) => {
          const values = await db.select().from(optionValue).where(eq(optionValue.option, po.option.id)).orderBy(optionValue.sortOrder);
          return { ...po.option, sortOrder: po.sortOrder, values };
        })
      );

      // Load variant option values for each variant
      const variantsWithOptions = await Promise.all(
        variants.map(async (v) => {
          const optionValues = await db.select().from(variantOptionValue).where(eq(variantOptionValue.variant, v.id));
          return { ...v, optionValues: optionValues.map(ov => ov.optionValue) };
        })
      );

      return { ...found, variants: variantsWithOptions, options: optionsWithValues };
    },
    { params: productParams, response: { 404: errorSchema } }
  )

  // GET /products/:id/variants (public)
  .get(
    '/:id/variants',
    async ({ params }) => {
      const variants = await db.select().from(variant).where(eq(variant.product, params.id)).orderBy(variant.sortOrder);
      return variants;
    },
    { params: productParams, response: t.Array(variantSchema) }
  )

  // === PROTECTED ROUTES (Admin) ===

  // POST /products - Create
  .use(permissionGuard('product', 'create'))
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
    { permission: true, body: productCreateBody, response: { 200: productSchema } }
  )

  // PUT /products/:id - Update (full, slug immutable)
  .use(permissionGuard('product', 'update'))
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
    {
      permission: true,
      params: productParams,
      body: productUpdateBody,
      response: { 200: productSchema, 404: errorSchema },
    }
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
    {
      permission: true,
      params: productParams,
      body: productPatchBody,
      response: { 200: productSchema, 404: errorSchema },
    }
  )

  // DELETE /products/:id - Delete
  .use(permissionGuard('product', 'delete'))
  .delete(
    '/:id',
    async ({ params, status }) => {
      const [deleted] = await db.delete(product).where(eq(product.id, params.id)).returning();
      if (!deleted) return status(404, { message: 'Product not found' });
      return { success: true };
    },
    {
      permission: true,
      params: productParams,
      response: { 200: successSchema, 404: errorSchema },
    }
  )

  // === VARIANTS ===

  // POST /products/:id/variants
  .use(permissionGuard('variant', 'create'))
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
    {
      permission: true,
      params: productParams,
      body: variantBody,
      response: { 200: variantSchema, 404: errorSchema },
    }
  )

  // PUT /products/:id/variants/:variantId
  .use(permissionGuard('variant', 'update'))
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
    {
      permission: true,
      params: variantParams,
      body: variantBody,
      response: { 200: variantSchema, 404: errorSchema },
    }
  )

  // DELETE /products/:id/variants/:variantId
  .use(permissionGuard('variant', 'delete'))
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
    {
      permission: true,
      params: variantParams,
      response: { 200: successSchema, 404: errorSchema },
    }
  )

  // PUT /products/:id/variants/:variantId/options - Set variant option values (replaces all)
  .use(permissionGuard('variant', 'update'))
  .put(
    '/:id/variants/:variantId/options',
    async ({ params, body, status }) => {
      const [variantExists] = await db
        .select()
        .from(variant)
        .where(and(eq(variant.id, params.variantId), eq(variant.product, params.id)));
      if (!variantExists) return status(404, { message: 'Variant not found' });

      // Delete existing option values for this variant
      await db.delete(variantOptionValue).where(eq(variantOptionValue.variant, params.variantId));

      // Insert new option values
      if (body.optionValueIds.length > 0) {
        await db.insert(variantOptionValue).values(
          body.optionValueIds.map((optionValueId: string) => ({
            variant: params.variantId,
            optionValue: optionValueId,
          }))
        );
      }

      return { success: true };
    },
    {
      permission: true,
      params: variantParams,
      body: t.Object({ optionValueIds: t.Array(t.String({ format: 'uuid' })) }),
      response: { 200: successSchema, 404: errorSchema },
    }
  )

  // === MEDIA ===

  // GET /products/:id/media
  .use(permissionGuard('product', 'read'))
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
    { permission: true, params: productParams, response: t.Array(productMediaSchema) }
  )

  // POST /products/:id/media - Add media to product
  .use(permissionGuard('product', 'update'))
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
    {
      permission: true,
      params: productParams,
      body: productMediaBody,
      response: { 200: productMediaSchema, 404: errorSchema },
    }
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
    {
      permission: true,
      params: mediaParams,
      body: productMediaUpdateBody,
      response: { 200: productMediaSchema, 404: errorSchema },
    }
  )

  // DELETE /products/:id/media/:mediaId
  .use(permissionGuard('product', 'delete'))
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
    {
      permission: true,
      params: mediaParams,
      response: { 200: successSchema, 404: errorSchema },
    }
  )

  // === OPTIONS (globales) ===

  // GET /options - Liste toutes les options globales
  .use(permissionGuard('option', 'read'))
  .get(
    '/options',
    async () => {
      const options = await db.select().from(option).orderBy(option.name);
      return options;
    },
    { permission: true, response: { 200: t.Array(optionSchema) } }
  )

  // POST /products/:id/options - Associe une option au produit (crée l'option si elle n'existe pas)
  .use(permissionGuard('option', 'create'))
  .post(
    '/:id/options',
    async ({ params, body, status }) => {
      const [productExists] = await db.select().from(product).where(eq(product.id, params.id));
      if (!productExists) return status(404, { message: 'Product not found' });

      // Cherche ou crée l'option globale (case-insensitive)
      let opt = await db.select().from(option).where(ilike(option.name, body.name)).then(r => r[0]);

      if (!opt) {
        [opt] = await db
          .insert(option)
          .values({ name: body.name })
          .returning();
      }

      // Vérifie si l'association existe déjà
      const [existing] = await db
        .select()
        .from(productOption)
        .where(and(eq(productOption.product, params.id), eq(productOption.option, opt.id)));

      if (existing) {
        return status(409, { message: 'Option already associated with this product' });
      }

      // Crée l'association produit-option
      await db.insert(productOption).values({
        product: params.id,
        option: opt.id,
        sortOrder: body.sortOrder ?? 0,
      });

      return opt;
    },
    {
      permission: true,
      params: productParams,
      body: optionBody,
      response: { 200: optionSchema, 404: errorSchema, 409: errorSchema },
    }
  )

  // POST /products/:id/options/:optionId/values
  .post(
    '/:id/options/:optionId/values',
    async ({ params, body, status }) => {
      const [optionExists] = await db.select().from(option).where(eq(option.id, params.optionId));
      if (!optionExists) return status(404, { message: 'Option not found' });

      // Vérifie si la valeur existe déjà (case-insensitive)
      const [existing] = await db
        .select()
        .from(optionValue)
        .where(and(eq(optionValue.option, params.optionId), ilike(optionValue.value, body.value)));

      if (existing) {
        return existing; // Retourne la valeur existante au lieu d'erreur
      }

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
    {
      permission: true,
      params: optionParams,
      body: optionValueBody,
      response: { 200: optionValueSchema, 404: errorSchema },
    }
  );
