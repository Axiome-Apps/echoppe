import { Elysia, t } from 'elysia';
import { db, media, folder, eq, isNull, asc, desc, like, or } from '@echoppe/core';
import { authPlugin } from '../plugins/auth';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { mkdir, unlink } from 'fs/promises';

const UPLOAD_DIR = join(import.meta.dir, '../../uploads');

// Ensure upload directory exists
await mkdir(UPLOAD_DIR, { recursive: true });

const uuidParam = t.Object({
  id: t.String({ format: 'uuid' }),
});

const folderBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  parent: t.Optional(t.Union([t.String({ format: 'uuid' }), t.Null()])),
});

const mediaUpdate = t.Object({
  title: t.Optional(t.String({ maxLength: 255 })),
  description: t.Optional(t.String()),
  alt: t.Optional(t.String({ maxLength: 255 })),
  folder: t.Optional(t.Union([t.String({ format: 'uuid' }), t.Null()])),
});

const mediaQuery = t.Object({
  folder: t.Optional(t.String({ format: 'uuid' })),
  search: t.Optional(t.String()),
  sort: t.Optional(t.String()),
  order: t.Optional(t.String()),
  all: t.Optional(t.String()),
});

const uploadBody = t.Object({
  file: t.Union([t.File(), t.Array(t.File())]),
  folder: t.Optional(t.String({ format: 'uuid' })),
});

const batchMoveBody = t.Object({
  ids: t.Array(t.String({ format: 'uuid' })),
  folder: t.Union([t.String({ format: 'uuid' }), t.Null()]),
});

const batchDeleteBody = t.Object({
  ids: t.Array(t.String({ format: 'uuid' })),
});

export const mediaRoutes = new Elysia({ prefix: '/media' })
  .use(authPlugin)

  // === ALL ROUTES ARE PROTECTED (Admin only) ===

  // === FOLDERS ===

  // GET /media/folders - List all folders (flat list for tree building)
  .get('/folders', async () => {
    const folders = await db.select().from(folder).orderBy(asc(folder.name));
    return folders;
  }, { auth: true })

  // POST /media/folders - Create folder
  .post(
    '/folders',
    async ({ body }) => {
      const [created] = await db
        .insert(folder)
        .values({
          name: body.name,
          parent: body.parent || null,
        })
        .returning();
      return created;
    },
    { auth: true, body: folderBody }
  )

  // PUT /media/folders/:id - Update folder
  .put(
    '/folders/:id',
    async ({ params, body, status }) => {
      const [updated] = await db
        .update(folder)
        .set({ name: body.name, parent: body.parent || null })
        .where(eq(folder.id, params.id))
        .returning();

      if (!updated) return status(404, { message: 'Dossier non trouvé' });
      return updated;
    },
    { auth: true, params: uuidParam, body: folderBody }
  )

  // DELETE /media/folders/:id - Delete folder
  .delete(
    '/folders/:id',
    async ({ params, status }) => {
      // Move child folders to parent
      const [currentFolder] = await db.select().from(folder).where(eq(folder.id, params.id));
      if (currentFolder) {
        await db.update(folder).set({ parent: currentFolder.parent }).where(eq(folder.parent, params.id));
        await db.update(media).set({ folder: currentFolder.parent }).where(eq(media.folder, params.id));
      }

      const [deleted] = await db.delete(folder).where(eq(folder.id, params.id)).returning();

      if (!deleted) return status(404, { message: 'Dossier non trouvé' });
      return { success: true };
    },
    { auth: true, params: uuidParam }
  )

  // === MEDIA ===

  // GET /media - List media with search, filter, sort
  .get(
    '/',
    async ({ query }) => {
      const { folder: folderId, search, sort, order, all } = query;

      let q = db.select().from(media);

      // Filter by folder (or show all if 'all' is true)
      if (all !== 'true') {
        if (folderId) {
          q = q.where(eq(media.folder, folderId)) as typeof q;
        } else {
          q = q.where(isNull(media.folder)) as typeof q;
        }
      }

      // Search
      if (search) {
        const searchPattern = `%${search}%`;
        q = q.where(
          or(
            like(media.title, searchPattern),
            like(media.filenameOriginal, searchPattern)
          )
        ) as typeof q;
      }

      // Sort
      const sortField = sort === 'name' ? media.filenameOriginal
                     : sort === 'size' ? media.size
                     : media.dateCreated;
      const sortOrder = order === 'asc' ? asc(sortField) : desc(sortField);
      q = q.orderBy(sortOrder) as typeof q;

      return await q;
    },
    { auth: true, query: mediaQuery }
  )

  // GET /media/:id - Get single media
  .get(
    '/:id',
    async ({ params, status }) => {
      const [item] = await db.select().from(media).where(eq(media.id, params.id));

      if (!item) return status(404, { message: 'Média non trouvé' });
      return item;
    },
    { auth: true, params: uuidParam }
  )

  // POST /media/upload - Upload file(s)
  .post(
    '/upload',
    async ({ body }) => {
      const files = Array.isArray(body.file) ? body.file : [body.file];
      const folderId = body.folder || null;
      const results = [];

      for (const file of files) {
        const ext = file.name.split('.').pop() || '';
        const filenameDisk = `${randomUUID()}.${ext}`;
        const filePath = join(UPLOAD_DIR, filenameDisk);

        // Write file to disk
        await Bun.write(filePath, file);

        // Get image dimensions if applicable
        let width: number | null = null;
        let height: number | null = null;

        // Insert into database
        const [created] = await db
          .insert(media)
          .values({
            folder: folderId,
            filenameDisk,
            filenameOriginal: file.name,
            title: file.name.replace(/\.[^/.]+$/, ''),
            mimeType: file.type,
            size: file.size,
            width,
            height,
          })
          .returning();

        results.push(created);
      }

      return results.length === 1 ? results[0] : results;
    },
    { auth: true, body: uploadBody }
  )

  // PUT /media/:id - Update media metadata
  .put(
    '/:id',
    async ({ params, body, status }) => {
      const updateData: Record<string, unknown> = {};
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.alt !== undefined) updateData.alt = body.alt;
      if (body.folder !== undefined) updateData.folder = body.folder;

      const [updated] = await db
        .update(media)
        .set(updateData)
        .where(eq(media.id, params.id))
        .returning();

      if (!updated) return status(404, { message: 'Média non trouvé' });
      return updated;
    },
    { auth: true, params: uuidParam, body: mediaUpdate }
  )

  // PUT /media/batch/move - Move multiple media to folder
  .put(
    '/batch/move',
    async ({ body }) => {
      const { ids, folder: folderId } = body;
      const moved = [];

      for (const id of ids) {
        const [updated] = await db
          .update(media)
          .set({ folder: folderId })
          .where(eq(media.id, id))
          .returning();
        if (updated) moved.push(id);
      }

      return { moved, count: moved.length };
    },
    { auth: true, body: batchMoveBody }
  )

  // DELETE /media/:id - Delete media
  .delete(
    '/:id',
    async ({ params, status }) => {
      const [item] = await db.select().from(media).where(eq(media.id, params.id));

      if (!item) return status(404, { message: 'Média non trouvé' });

      // Delete file from disk
      try {
        await unlink(join(UPLOAD_DIR, item.filenameDisk));
      } catch {
        // File might not exist, continue anyway
      }

      await db.delete(media).where(eq(media.id, params.id));

      return { success: true };
    },
    { auth: true, params: uuidParam }
  )

  // DELETE /media/batch - Delete multiple media
  .delete(
    '/batch',
    async ({ body }) => {
      const deleted = [];

      for (const id of body.ids) {
        const [item] = await db.select().from(media).where(eq(media.id, id));

        if (item) {
          try {
            await unlink(join(UPLOAD_DIR, item.filenameDisk));
          } catch {
            // Ignore
          }
          await db.delete(media).where(eq(media.id, id));
          deleted.push(id);
        }
      }

      return { deleted, count: deleted.length };
    },
    { auth: true, body: batchDeleteBody }
  );
