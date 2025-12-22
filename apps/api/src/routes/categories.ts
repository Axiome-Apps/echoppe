import { Elysia, t } from 'elysia';
import { db, category, eq } from '@echoppe/core';
import { slugify } from '@echoppe/shared';
import { permissionGuard } from '../plugins/rbac';

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

// Schemas de réponse
const errorSchema = t.Object({ message: t.String() });
const successSchema = t.Object({ success: t.Boolean() });
const batchSuccessSchema = t.Object({ success: t.Boolean(), count: t.Number() });

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
      response: { 200: categorySchema, 404: errorSchema },
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
    { permission: true, body: categoryCreateBody, response: { 200: categorySchema } }
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
      response: { 200: categorySchema, 404: errorSchema },
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
    { permission: true, body: batchOrderBody, response: { 200: batchSuccessSchema } }
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
      response: { 200: successSchema, 404: errorSchema },
    }
  );
