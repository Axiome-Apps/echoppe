import { db, desc, eq, product, sql, stockMove, variant } from '@echoppe/core';
import { Elysia, t } from 'elysia';
import { authPlugin } from '../plugins/auth';

const stockMoveSchema = t.Object({
  id: t.String(),
  variant: t.Nullable(t.String()),
  label: t.String(),
  quantity: t.Number(),
  type: t.String(),
  reference: t.Nullable(t.String()),
  note: t.Nullable(t.String()),
  dateCreated: t.Date(),
});

const stockMoveCreateBody = t.Object({
  variant: t.String({ format: 'uuid' }),
  quantity: t.Number(),
  type: t.Union([t.Literal('restock'), t.Literal('adjustment')]),
  note: t.Optional(t.String()),
});

const alertSchema = t.Object({
  variantId: t.String(),
  productId: t.String(),
  productName: t.String(),
  sku: t.Nullable(t.String()),
  quantity: t.Number(),
  lowStockThreshold: t.Nullable(t.Number()),
});

const paginationQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 20 })),
});

export const stockRoutes = new Elysia({ prefix: '/stock' })
  .use(authPlugin)

  // GET /stock - List stock moves with pagination
  .get(
    '/',
    async ({ query }) => {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const offset = (page - 1) * limit;

      const [moves, countResult] = await Promise.all([
        db
          .select()
          .from(stockMove)
          .orderBy(desc(stockMove.dateCreated))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(stockMove),
      ]);

      const total = Number(countResult[0]?.count ?? 0);

      return {
        data: moves,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },
    { auth: true, query: paginationQuery },
  )

  // GET /stock/alerts - Variants below low stock threshold
  .get(
    '/alerts',
    async () => {
      const alerts = await db
        .select({
          variantId: variant.id,
          productId: product.id,
          productName: product.name,
          sku: variant.sku,
          quantity: variant.quantity,
          lowStockThreshold: variant.lowStockThreshold,
        })
        .from(variant)
        .innerJoin(product, eq(variant.product, product.id))
        .where(
          sql`${variant.quantity} <= COALESCE(${variant.lowStockThreshold}, 5)`,
        )
        .orderBy(variant.quantity);

      return alerts;
    },
    { auth: true, response: t.Array(alertSchema) },
  )

  // GET /stock/variants - List variants for select (adjustment modal)
  .get(
    '/variants',
    async () => {
      const variants = await db
        .select({
          id: variant.id,
          sku: variant.sku,
          productName: product.name,
          quantity: variant.quantity,
        })
        .from(variant)
        .innerJoin(product, eq(variant.product, product.id))
        .orderBy(product.name, variant.sku);

      return variants;
    },
    { auth: true },
  )

  // POST /stock - Create a stock move and update variant quantity
  .post(
    '/',
    async ({ body, status }) => {
      // Get variant with product name for label
      const [v] = await db
        .select({
          id: variant.id,
          sku: variant.sku,
          quantity: variant.quantity,
          productName: product.name,
        })
        .from(variant)
        .innerJoin(product, eq(variant.product, product.id))
        .where(eq(variant.id, body.variant));

      if (!v) {
        return status(404, { message: 'Variant not found' });
      }

      // Build label
      const label = v.sku ? `${v.productName} — ${v.sku}` : v.productName;

      // Create move and update quantity in transaction
      const [move] = await db.transaction(async (tx) => {
        // Create stock move
        const [created] = await tx
          .insert(stockMove)
          .values({
            variant: body.variant,
            label,
            quantity: body.quantity,
            type: body.type,
            note: body.note,
          })
          .returning();

        // Update variant quantity
        await tx
          .update(variant)
          .set({
            quantity: sql`${variant.quantity} + ${body.quantity}`,
          })
          .where(eq(variant.id, body.variant));

        return [created];
      });

      return move;
    },
    { auth: true, body: stockMoveCreateBody },
  );
