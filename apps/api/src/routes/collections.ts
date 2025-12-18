import { Elysia, t } from 'elysia';
import { db, collection, eq, count } from '@echoppe/core';
import { slugify } from '@echoppe/shared';
import { authPlugin } from '../plugins/auth';
import { paginationQuery, paginatedResponse, getPaginationParams, buildPaginatedResponse } from '../utils/pagination';

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

export const collectionsRoutes = new Elysia({ prefix: '/collections' })
  .use(authPlugin)

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
      response: {
        200: collectionSchema,
        404: t.Object({ message: t.String() }),
      },
    }
  )

  // === PROTECTED ROUTES (Admin) ===

  // POST /collections - Create (slug auto-generated)
  .post(
    '/',
    async ({ body }) => {
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
      return created;
    },
    { auth: true, body: collectionCreateBody }
  )

  // PUT /collections/:id - Update (slug immutable)
  .put(
    '/:id',
    async ({ params, body, status }) => {
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
      return updated;
    },
    { auth: true, params: collectionParams, body: collectionUpdateBody }
  )

  // DELETE /collections/:id - Delete
  .delete(
    '/:id',
    async ({ params, status }) => {
      const [deleted] = await db.delete(collection).where(eq(collection.id, params.id)).returning();
      if (!deleted) return status(404, { message: 'Collection non trouvee' });
      return { success: true };
    },
    { auth: true, params: collectionParams }
  );
