import { Elysia, t } from 'elysia';
import { db, category, eq } from '@echoppe/core';
import { authPlugin } from '../plugins/auth';

const categoryBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  slug: t.String({ minLength: 1, maxLength: 100 }),
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
    const categories = await db.select().from(category).orderBy(category.sortOrder);
    return categories;
  })

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

  // POST /categories - Create
  .post(
    '/',
    async ({ body }) => {
      const [created] = await db
        .insert(category)
        .values({
          name: body.name,
          slug: body.slug,
          description: body.description,
          parent: body.parent,
          image: body.image,
          sortOrder: body.sortOrder ?? 0,
          isVisible: body.isVisible ?? true,
        })
        .returning();
      return created;
    },
    { auth: true, body: categoryBody }
  )

  // PUT /categories/:id - Update
  .put(
    '/:id',
    async ({ params, body, status }) => {
      const [updated] = await db
        .update(category)
        .set({
          name: body.name,
          slug: body.slug,
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
    { auth: true, params: categoryParams, body: categoryBody }
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
