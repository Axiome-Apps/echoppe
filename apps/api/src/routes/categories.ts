import { Elysia, t } from 'elysia';
import { db, category, eq } from '@echoppe/core';
import { slugify } from '@echoppe/shared';
import { authPlugin } from '../plugins/auth';

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

export const categoriesRoutes = new Elysia({ prefix: '/categories' })
  .use(authPlugin)

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
    { params: categoryParams }
  )

  // === PROTECTED ROUTES (Admin) ===

  // POST /categories - Create (slug auto-generated)
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
    { auth: true, body: categoryCreateBody }
  )

  // PUT /categories/:id - Update (slug immutable)
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
    { auth: true, params: categoryParams, body: categoryUpdateBody }
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
    { auth: true, body: batchOrderBody }
  )

  // DELETE /categories/:id - Delete
  .delete(
    '/:id',
    async ({ params, status }) => {
      const [deleted] = await db.delete(category).where(eq(category.id, params.id)).returning();
      if (!deleted) return status(404, { message: 'Category not found' });
      return { success: true };
    },
    { auth: true, params: categoryParams }
  );
