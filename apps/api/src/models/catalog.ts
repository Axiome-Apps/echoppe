import { t } from 'elysia';
import { paginatedResponse } from '../utils/pagination';

// Schémas d'entité (réponses) du domaine catalogue — SOURCE UNIQUE. Importés par les
// routes (par valeur) ET agrégés dans le registre `catalogModels` pour être enregistrés
// comme modèles nommés → peuplent `components.schemas` du contrat OpenAPI.

export const defaultVariantSchema = t.Object({
  priceHt: t.String(),
  compareAtPriceHt: t.Nullable(t.String()),
  quantity: t.Number(),
});

export const productListSchema = t.Object({
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

export const productSchema = t.Object({
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

export const optionSchema = t.Object({
  id: t.String(),
  name: t.String(),
});

export const optionValueSchema = t.Object({
  id: t.String(),
  option: t.String(),
  value: t.String(),
  sortOrder: t.Number(),
});

export const variantSchema = t.Object({
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
  lowStockThreshold: t.Nullable(t.Number()),
});

// Projection STOREFRONT du variant : la vue complète `variantSchema` ci-dessus est la vue
// admin ; elle expose des champs de gestion interne qui ne doivent pas fuiter dans le
// contrat public :
// - `costPrice` = coût d'achat → marge (secret commercial),
// - `lowStockThreshold` = seuil d'alerte stock (info opérationnelle interne).
// Elysia nettoie la réponse selon le schéma → omettre ces champs suffit à les masquer.
export const variantPublicSchema = t.Omit(variantSchema, ['costPrice', 'lowStockThreshold']);

// Variant enrichi de ses valeurs d'option (fiche produit) — projection storefront.
export const variantDetailSchema = t.Composite([
  variantPublicSchema,
  t.Object({ optionValues: t.Array(t.String()) }),
]);

// Option enrichie de ses valeurs (fiche produit).
export const optionDetailSchema = t.Composite([
  optionSchema,
  t.Object({ sortOrder: t.Number(), values: t.Array(optionValueSchema) }),
]);

// Produit + variants + options (retour de GET /products/:id).
export const productWithVariantsSchema = t.Composite([
  productSchema,
  t.Object({
    variants: t.Array(variantDetailSchema),
    options: t.Array(optionDetailSchema),
  }),
]);

// Média rattaché à un produit (galerie).
export const productMediaSchema = t.Object({
  product: t.String(),
  media: t.String(),
  sortOrder: t.Number(),
  isFeatured: t.Boolean(),
  featuredForVariant: t.Nullable(t.String()),
});

// Fiche produit détaillée storefront (GET /products/by-slug/:slug) :
// ci-dessus + image mise en avant + galerie.
export const productDetailSchema = t.Composite([
  productWithVariantsSchema,
  t.Object({
    featuredImage: t.Nullable(t.String()),
    images: t.Array(t.String()),
  }),
]);

// Modèles nommés exposés dans le contrat (components.schemas).
export const catalogModels = {
  Product: productSchema,
  ProductWithVariants: productWithVariantsSchema,
  ProductDetail: productDetailSchema,
  ProductList: paginatedResponse(productListSchema),
  ProductMedia: productMediaSchema,
  Variant: variantSchema,
  Option: optionSchema,
  OptionValue: optionValueSchema,
};
