import { t } from 'elysia';

// Schémas d'entité du domaine panier — SOURCE UNIQUE. Importés par les routes (par valeur)
// ET agrégés dans `cartModels` pour être enregistrés comme modèles nommés → peuplent
// `components.schemas` du contrat OpenAPI.

const variantInCartSchema = t.Object({
  id: t.String(),
  sku: t.Nullable(t.String()),
  priceHt: t.String(),
  product: t.Object({
    id: t.String(),
    name: t.String(),
    slug: t.String(),
    featuredImage: t.Nullable(t.String()),
  }),
});

const cartItemSchema = t.Object({
  id: t.String(),
  variant: variantInCartSchema,
  quantity: t.Number(),
  dateAdded: t.Date(),
});

const cartStatusEnum = t.Union([
  t.Literal('active'),
  t.Literal('converted'),
  t.Literal('abandoned'),
  t.Literal('empty'),
]);

export const cartResponseSchema = t.Object({
  id: t.Union([t.String(), t.Null()]),
  status: cartStatusEnum,
  items: t.Array(cartItemSchema),
  itemCount: t.Number(),
  totalHt: t.String(),
  dateCreated: t.Union([t.Date(), t.Null()]),
  dateUpdated: t.Union([t.Date(), t.Null()]),
});

export const mergeResponseSchema = t.Object({
  success: t.Boolean(),
  merged: t.Optional(t.Number()),
  converted: t.Optional(t.Boolean()),
});

// Modèles nommés exposés dans le contrat (components.schemas).
export const cartModels = {
  Cart: cartResponseSchema,
  CartMerge: mergeResponseSchema,
};
