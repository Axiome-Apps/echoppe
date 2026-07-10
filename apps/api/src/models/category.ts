import { t } from 'elysia';

// Schéma d'entité catégorie (réponse) — source unique, enregistré comme modèle nommé.

export const categorySchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  description: t.Nullable(t.String()),
  parent: t.Nullable(t.String()),
  image: t.Nullable(t.String()),
  sortOrder: t.Number(),
  isVisible: t.Boolean(),
});

export const categoryModels = {
  Category: categorySchema,
  CategoryList: t.Array(categorySchema),
};
