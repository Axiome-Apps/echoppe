import type { SQL } from '@echoppe/core';
import {
  and,
  asc,
  count,
  db,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lte,
  option,
  optionValue,
  or,
  product,
  productMedia,
  productOption,
  sql,
  variant,
  variantOptionValue,
} from '@echoppe/core';
import { slugify } from '@echoppe/shared';
import { Elysia, t } from 'elysia';
import { getClientIp, logAudit } from '../lib/audit';
import { models } from '../models';
import {
  colorMetadataSchema,
  optionSchema,
  optionTypeSchema,
  optionValueSchema,
  productMediaSchema,
  variantPublicSchema,
} from '../models/catalog';
import { permissionGuard } from '../plugins/rbac';
import { buildEqFilters, buildListResponse, getPaginationParams } from '../utils/pagination';
import { enrichProductCards } from '../utils/product-cards';
import {
  conflictResponse,
  successSchema,
  withAuthErrors,
  withCrudErrors,
  withNotFound,
  withReadErrors,
} from '../utils/responses';

// Schémas d'entité catalogue (product/variant/option…) → src/models/catalog.ts

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
  type: t.Optional(optionTypeSchema),
  sortOrder: t.Optional(t.Number({ default: 0 })),
});

const optionValueBody = t.Object({
  value: t.String({ minLength: 1, maxLength: 100 }),
  // Couleur (type=color) ; ignorée/forcée à null pour une option de type string à la frontière.
  metadata: t.Optional(colorMetadataSchema),
  sortOrder: t.Optional(t.Number({ default: 0 })),
});

// Mise à jour partielle : seuls les champs fournis changent.
const optionUpdateBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  type: t.Optional(optionTypeSchema),
  sortOrder: t.Optional(t.Number()),
});

const optionValueUpdateBody = t.Object({
  value: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  // `null` efface la couleur ; absent = inchangé ; forcée à null si l'option n'est pas color.
  metadata: t.Optional(t.Nullable(colorMetadataSchema)),
  sortOrder: t.Optional(t.Number()),
});

const optionValueParams = t.Object({
  id: t.String({ format: 'uuid' }),
  optionId: t.String({ format: 'uuid' }),
  valueId: t.String({ format: 'uuid' }),
});

// Query schema pour recherche/filtres/tri
const productSearchQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
  search: t.Optional(t.String()),
  category: t.Optional(t.String({ format: 'uuid' })),
  minPrice: t.Optional(t.Numeric({ minimum: 0 })),
  maxPrice: t.Optional(t.Numeric({ minimum: 0 })),
  inStock: t.Optional(t.BooleanString()),
  sort: t.Optional(t.Union([t.Literal('price'), t.Literal('name'), t.Literal('dateCreated')])),
  order: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
});

// Query admin = query publique + filtre `status` (l'admin voit/filtre tous les statuts).
const productAdminSearchQuery = t.Composite([
  productSearchQuery,
  t.Object({ status: t.Optional(t.String()) }),
]);

interface ProductCardsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
  order?: string;
}

// Liste de cartes produit enrichies, partagée public/admin. Mêmes recherche/filtres
// prix-stock/tri/pagination ; seule la VISIBILITÉ par statut diffère et est injectée
// par l'appelant via `statusConditions` (public = published forcé ; admin = filtre libre).
async function queryProductCards(query: ProductCardsQuery, statusConditions: SQL[]) {
  const { page, limit, offset } = getPaginationParams(query);
  const { search, category, minPrice, maxPrice, inStock, sort, order } = query;

  const conditions: SQL[] = [...statusConditions];

  if (search) {
    const searchPattern = `%${search}%`;
    const searchCondition = or(
      ilike(product.name, searchPattern),
      ilike(product.description, searchPattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (category) {
    conditions.push(eq(product.category, category));
  }

  // Filtres prix/stock : passent par le variant par défaut.
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

    const filteredProductIds = matchingVariants.map((v) => v.productId);
    if (filteredProductIds.length === 0) {
      return buildListResponse([], 0, page, limit);
    }
    conditions.push(inArray(product.id, filteredProductIds));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortOrder = order === 'desc' ? desc : asc;
  let orderByClause: SQL;
  switch (sort) {
    case 'name':
      orderByClause = sortOrder(product.name);
      break;
    case 'dateCreated':
      orderByClause = sortOrder(product.dateCreated);
      break;
    // 'price' : tri réel post-enrichissement (sur le variant par défaut).
    default:
      orderByClause = desc(product.dateCreated);
  }

  const [products, [{ total }]] = await Promise.all([
    db.select().from(product).where(whereClause).orderBy(orderByClause).limit(limit).offset(offset),
    db
      .select({ total: count(product.id) })
      .from(product)
      .where(whereClause),
  ]);

  let enrichedProducts = await enrichProductCards(products);

  if (sort === 'price') {
    enrichedProducts = enrichedProducts.sort((a, b) => {
      const priceA = a.defaultVariant ? parseFloat(a.defaultVariant.priceHt) : 0;
      const priceB = b.defaultVariant ? parseFloat(b.defaultVariant.priceHt) : 0;
      return order === 'desc' ? priceB - priceA : priceA - priceB;
    });
  }

  return buildListResponse(enrichedProducts, total, page, limit);
}

export const productsRoutes = new Elysia({ prefix: '/products', detail: { tags: ['Products'] } })

  // Registre central des modèles nommés (src/models) → peuplent components.schemas
  // du contrat OpenAPI (types nommés côté @echoppe/client, sans workaround).
  .use(models)

  // === PUBLIC ROUTES ===

  // GET /products - Liste publique : produits PUBLIÉS uniquement (SDK/storefront).
  .get('/', async ({ query }) => queryProductCards(query, [eq(product.status, 'published')]), {
    query: productSearchQuery,
    response: withReadErrors({ 200: 'ProductList' }),
  })

  // GET /products/by-slug/:slug - Get one by slug with variants (public, for storefront)
  .get(
    '/by-slug/:slug',
    async ({ params, status }) => {
      // Public : seul un produit PUBLIÉ est visible (sinon 404, pas de fuite de brouillon).
      const [found] = await db
        .select()
        .from(product)
        .where(and(eq(product.slug, params.slug), eq(product.status, 'published')));
      if (!found) return status(404, { message: 'Product not found' });

      const variants = await db
        .select()
        .from(variant)
        .where(eq(variant.product, found.id))
        .orderBy(variant.sortOrder);

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
      const variantIds = variants.map((v) => v.id);
      const usedOptionValues =
        variantIds.length > 0
          ? await db
              .select({ optionValueId: variantOptionValue.optionValue })
              .from(variantOptionValue)
              .where(inArray(variantOptionValue.variant, variantIds))
          : [];
      const usedOptionValueIds = new Set(usedOptionValues.map((ov) => ov.optionValueId));

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
          const allValues = await db
            .select()
            .from(optionValue)
            .where(eq(optionValue.option, po.option.id))
            .orderBy(optionValue.sortOrder);
          // Filter to only values used by this product's variants
          const values = allValues.filter((v) => usedOptionValueIds.has(v.id));
          return { ...po.option, sortOrder: po.sortOrder, values };
        }),
      );

      // Filter out options with no values (shouldn't happen, but safety check)
      const filteredOptions = optionsWithValues.filter((o) => o.values.length > 0);

      const variantsWithOptions = await Promise.all(
        variants.map(async (v) => {
          const optionValues = await db
            .select()
            .from(variantOptionValue)
            .where(eq(variantOptionValue.variant, v.id));
          return { ...v, optionValues: optionValues.map((ov) => ov.optionValue) };
        }),
      );

      return {
        ...found,
        featuredImage: featuredMedia?.mediaId ?? null,
        images: allMedia.map((m) => m.mediaId),
        variants: variantsWithOptions,
        options: filteredOptions,
      };
    },
    {
      params: t.Object({ slug: t.String() }),
      response: withNotFound({ 200: 'ProductDetail' }),
    },
  )

  // GET /products/:id - Get one with variants (public)
  .get(
    '/:id',
    async ({ params, status }) => {
      // Public : seul un produit PUBLIÉ est visible (sinon 404, pas de fuite de brouillon).
      const [found] = await db
        .select()
        .from(product)
        .where(and(eq(product.id, params.id), eq(product.status, 'published')));
      if (!found) return status(404, { message: 'Product not found' });

      const variants = await db
        .select()
        .from(variant)
        .where(eq(variant.product, params.id))
        .orderBy(variant.sortOrder);

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
          const values = await db
            .select()
            .from(optionValue)
            .where(eq(optionValue.option, po.option.id))
            .orderBy(optionValue.sortOrder);
          return { ...po.option, sortOrder: po.sortOrder, values };
        }),
      );

      // Load variant option values for each variant
      const variantsWithOptions = await Promise.all(
        variants.map(async (v) => {
          const optionValues = await db
            .select()
            .from(variantOptionValue)
            .where(eq(variantOptionValue.variant, v.id));
          return { ...v, optionValues: optionValues.map((ov) => ov.optionValue) };
        }),
      );

      return { ...found, variants: variantsWithOptions, options: optionsWithValues };
    },
    { params: productParams, response: withNotFound({ 200: 'ProductWithVariants' }) },
  )

  // GET /products/:id/variants (public)
  .get(
    '/:id/variants',
    async ({ params }) => {
      // Public : pas de variantes pour un produit non publié.
      const [found] = await db
        .select({ id: product.id })
        .from(product)
        .where(and(eq(product.id, params.id), eq(product.status, 'published')));
      if (!found) return [];

      const variants = await db
        .select()
        .from(variant)
        .where(eq(variant.product, params.id))
        .orderBy(variant.sortOrder);
      return variants;
    },
    { params: productParams, response: t.Array(variantPublicSchema) },
  )

  // === PROTECTED ROUTES (Admin) ===

  // POST /products - Create
  .use(permissionGuard('product', 'create'))
  .post(
    '/',
    async ({ body, currentUser, request }) => {
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

      logAudit({
        userId: currentUser?.id,
        action: 'product.create',
        entityType: 'product',
        entityId: created.id,
        data: { name: created.name },
        ipAddress: getClientIp(request.headers),
      });

      return created;
    },
    { permission: true, body: productCreateBody, response: withAuthErrors({ 200: 'Product' }) },
  )

  // PUT /products/:id - Update (full, slug immutable)
  .use(permissionGuard('product', 'update'))
  .put(
    '/:id',
    async ({ params, body, status, currentUser, request }) => {
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

      logAudit({
        userId: currentUser?.id,
        action: 'product.update',
        entityType: 'product',
        entityId: params.id,
        data: { name: updated.name },
        ipAddress: getClientIp(request.headers),
      });

      return updated;
    },
    {
      permission: true,
      params: productParams,
      body: productUpdateBody,
      response: withCrudErrors({ 200: 'Product' }),
    },
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
      response: withCrudErrors({ 200: 'Product' }),
    },
  )

  // DELETE /products/:id - Delete
  .use(permissionGuard('product', 'delete'))
  .delete(
    '/:id',
    async ({ params, status, currentUser, request }) => {
      const [deleted] = await db.delete(product).where(eq(product.id, params.id)).returning();
      if (!deleted) return status(404, { message: 'Product not found' });

      logAudit({
        userId: currentUser?.id,
        action: 'product.delete',
        entityType: 'product',
        entityId: params.id,
        data: { name: deleted.name },
        ipAddress: getClientIp(request.headers),
      });

      return { success: true };
    },
    {
      permission: true,
      params: productParams,
      response: withCrudErrors({ 200: successSchema }),
    },
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
      response: withCrudErrors({ 200: 'Variant' }),
    },
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
      response: withCrudErrors({ 200: 'Variant' }),
    },
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
      response: withCrudErrors({ 200: successSchema }),
    },
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
          })),
        );
      }

      return { success: true };
    },
    {
      permission: true,
      params: variantParams,
      body: t.Object({ optionValueIds: t.Array(t.String({ format: 'uuid' })) }),
      response: withCrudErrors({ 200: successSchema }),
    },
  )

  // === LECTURE ADMIN ===
  // adminOnly : le rôle Public a `product:read` (storefront) → sans ça, ces lectures
  // (brouillons, champs internes du variant) seraient accessibles à un anonyme.
  .use(permissionGuard('product', 'read', { adminOnly: true }))

  // GET /products/admin - Liste admin : TOUS les statuts + filtre `status` optionnel.
  // Même projection que la liste publique (aucun champ interne côté carte) ; la
  // différence est la visibilité des lignes (brouillons/archivés inclus).
  .get(
    '/admin',
    async ({ query }) =>
      queryProductCards(query, buildEqFilters(query, { status: product.status })),
    {
      permission: true,
      query: productAdminSearchQuery,
      response: withReadErrors({ 200: 'ProductList' }),
    },
  )

  // GET /products/:id/full - Produit + variants COMPLETS (costPrice/lowStockThreshold) + options.
  // Réservé à l'admin : la lecture publique `/products/:id` masque les champs internes du variant.
  .get(
    '/:id/full',
    async ({ params, status }) => {
      const [found] = await db.select().from(product).where(eq(product.id, params.id));
      if (!found) return status(404, { message: 'Product not found' });

      const variants = await db
        .select()
        .from(variant)
        .where(eq(variant.product, params.id))
        .orderBy(variant.sortOrder);

      const productOptions = await db
        .select({ option: option, sortOrder: productOption.sortOrder })
        .from(productOption)
        .innerJoin(option, eq(productOption.option, option.id))
        .where(eq(productOption.product, params.id))
        .orderBy(productOption.sortOrder);

      const optionsWithValues = await Promise.all(
        productOptions.map(async (po) => {
          const values = await db
            .select()
            .from(optionValue)
            .where(eq(optionValue.option, po.option.id))
            .orderBy(optionValue.sortOrder);
          return { ...po.option, sortOrder: po.sortOrder, values };
        }),
      );

      const variantsWithOptions = await Promise.all(
        variants.map(async (v) => {
          const optionValues = await db
            .select()
            .from(variantOptionValue)
            .where(eq(variantOptionValue.variant, v.id));
          return { ...v, optionValues: optionValues.map((ov) => ov.optionValue) };
        }),
      );

      return { ...found, variants: variantsWithOptions, options: optionsWithValues };
    },
    {
      permission: true,
      params: productParams,
      response: withNotFound({ 200: 'ProductAdminWithVariants' }),
    },
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
    { permission: true, params: productParams, response: t.Array(productMediaSchema) },
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
      response: withCrudErrors({ 200: 'ProductMedia' }),
    },
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
      response: withCrudErrors({ 200: 'ProductMedia' }),
    },
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
      response: withCrudErrors({ 200: successSchema }),
    },
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
    { permission: true, response: { 200: t.Array(optionSchema) } },
  )

  // GET /products/:id/options/:optionId/values - Valeurs (globales) d'une option
  .get(
    '/:id/options/:optionId/values',
    async ({ params }) => {
      return db
        .select()
        .from(optionValue)
        .where(eq(optionValue.option, params.optionId))
        .orderBy(optionValue.sortOrder);
    },
    { permission: true, params: optionParams, response: { 200: t.Array(optionValueSchema) } },
  )

  // POST /products/:id/options - Associe une option au produit (crée l'option si elle n'existe pas)
  .use(permissionGuard('option', 'create'))
  .post(
    '/:id/options',
    async ({ params, body, status }) => {
      const [productExists] = await db.select().from(product).where(eq(product.id, params.id));
      if (!productExists) return status(404, { message: 'Product not found' });

      // Cherche ou crée l'option globale (case-insensitive)
      let opt = await db
        .select()
        .from(option)
        .where(ilike(option.name, body.name))
        .then((r) => r[0]);

      if (!opt) {
        [opt] = await db
          .insert(option)
          .values({ name: body.name, type: body.type ?? 'string' })
          .returning();
      }
      // Option existante : on respecte son `type` (pas de mutation silencieuse via ce POST).

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
      response: withCrudErrors({ 200: 'Option', 409: conflictResponse }),
    },
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

      // Frontière discriminée par le type PARENT : la couleur n'existe que pour type=color,
      // forcée à null sinon (une valeur texte ne porte pas de metadata).
      const metadata = optionExists.type === 'color' ? (body.metadata ?? null) : null;

      const [created] = await db
        .insert(optionValue)
        .values({
          option: params.optionId,
          value: body.value,
          metadata,
          sortOrder: body.sortOrder ?? 0,
        })
        .returning();
      return created;
    },
    {
      permission: true,
      params: optionParams,
      body: optionValueBody,
      response: withCrudErrors({ 200: 'OptionValue' }),
    },
  )

  // PUT /products/:id/options/:optionId - Édite une option (name/type/sortOrder)
  .use(permissionGuard('option', 'update'))
  .put(
    '/:id/options/:optionId',
    async ({ params, body, status }) => {
      const [existing] = await db.select().from(option).where(eq(option.id, params.optionId));
      if (!existing) return status(404, { message: 'Option not found' });

      const nextType = body.type ?? existing.type;
      const [updated] = await db
        .update(option)
        .set({
          name: body.name ?? existing.name,
          type: nextType,
          sortOrder: body.sortOrder ?? existing.sortOrder,
        })
        .where(eq(option.id, params.optionId))
        .returning();

      // Passage color → string : une valeur texte ne porte pas de couleur → on nettoie les metadata.
      if (existing.type === 'color' && nextType === 'string') {
        await db
          .update(optionValue)
          .set({ metadata: null })
          .where(eq(optionValue.option, params.optionId));
      }

      return updated;
    },
    {
      permission: true,
      params: optionParams,
      body: optionUpdateBody,
      response: withCrudErrors({ 200: 'Option' }),
    },
  )

  // PUT /products/:id/options/:optionId/values/:valueId - Édite une valeur (value/metadata/sortOrder)
  .put(
    '/:id/options/:optionId/values/:valueId',
    async ({ params, body, status }) => {
      const [opt] = await db.select().from(option).where(eq(option.id, params.optionId));
      if (!opt) return status(404, { message: 'Option not found' });

      const [existing] = await db
        .select()
        .from(optionValue)
        .where(and(eq(optionValue.id, params.valueId), eq(optionValue.option, params.optionId)));
      if (!existing) return status(404, { message: 'Option value not found' });

      // Frontière discriminée par le type PARENT : couleur seulement pour type=color (null sinon).
      // metadata absent pour une couleur = inchangé ; `null` = effacer.
      let metadata: (typeof existing)['metadata'] = null;
      if (opt.type === 'color') {
        metadata = body.metadata !== undefined ? body.metadata : existing.metadata;
      }

      const [updated] = await db
        .update(optionValue)
        .set({
          value: body.value ?? existing.value,
          metadata,
          sortOrder: body.sortOrder ?? existing.sortOrder,
        })
        .where(eq(optionValue.id, params.valueId))
        .returning();

      return updated;
    },
    {
      permission: true,
      params: optionValueParams,
      body: optionValueUpdateBody,
      response: withCrudErrors({ 200: 'OptionValue' }),
    },
  )

  // DELETE /products/:id/options/:optionId/values/:valueId - Supprime une valeur (409 si utilisée)
  .use(permissionGuard('option', 'delete'))
  .delete(
    '/:id/options/:optionId/values/:valueId',
    async ({ params, status }) => {
      const [existing] = await db
        .select()
        .from(optionValue)
        .where(and(eq(optionValue.id, params.valueId), eq(optionValue.option, params.optionId)));
      if (!existing) return status(404, { message: 'Option value not found' });

      // Refuse si des variantes portent encore cette valeur (ne réécrit jamais une variante).
      const [used] = await db
        .select({ v: variantOptionValue.variant })
        .from(variantOptionValue)
        .where(eq(variantOptionValue.optionValue, params.valueId))
        .limit(1);
      if (used) {
        return status(409, { message: 'Valeur utilisée par des variantes — détachez-la d’abord' });
      }

      await db.delete(optionValue).where(eq(optionValue.id, params.valueId));
      return { success: true };
    },
    {
      permission: true,
      params: optionValueParams,
      response: withCrudErrors({ 200: successSchema, 409: conflictResponse }),
    },
  )

  // DELETE /products/:id/options/:optionId - Dissocie l'option DU PRODUIT (l'axe global reste).
  // 409 si des variantes du produit portent encore une de ses valeurs.
  .delete(
    '/:id/options/:optionId',
    async ({ params, status }) => {
      const [assoc] = await db
        .select()
        .from(productOption)
        .where(
          and(eq(productOption.product, params.id), eq(productOption.option, params.optionId)),
        );
      if (!assoc) return status(404, { message: 'Option non associée au produit' });

      const [used] = await db
        .select({ v: variantOptionValue.variant })
        .from(variantOptionValue)
        .innerJoin(variant, eq(variant.id, variantOptionValue.variant))
        .innerJoin(optionValue, eq(optionValue.id, variantOptionValue.optionValue))
        .where(and(eq(variant.product, params.id), eq(optionValue.option, params.optionId)))
        .limit(1);
      if (used) {
        return status(409, {
          message: 'Des variantes du produit utilisent cette option — détachez-les d’abord',
        });
      }

      await db
        .delete(productOption)
        .where(
          and(eq(productOption.product, params.id), eq(productOption.option, params.optionId)),
        );
      return { success: true };
    },
    {
      permission: true,
      params: optionParams,
      response: withCrudErrors({ 200: successSchema, 409: conflictResponse }),
    },
  );
