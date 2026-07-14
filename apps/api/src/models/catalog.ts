import { t } from 'elysia';
import { paginatedResponse } from '../utils/pagination';

// Schémas d'entité (réponses) du domaine catalogue — SOURCE UNIQUE. Importés par les
// routes (par valeur) ET agrégés dans le registre `catalogModels` pour être enregistrés
// comme modèles nommés → peuplent `components.schemas` du contrat OpenAPI.

const statusEnum = t.Union([t.Literal('draft'), t.Literal('published'), t.Literal('archived')], {
  description: 'Statut de publication.',
});

export const defaultVariantSchema = t.Object({
  priceHt: t.String({ description: 'Prix HT, décimal en chaîne (ex. « 12.90 »).' }),
  compareAtPriceHt: t.Nullable(
    t.String({ description: 'Prix barré HT (avant remise), décimal en chaîne.' }),
  ),
  quantity: t.Number({ description: 'Stock disponible.' }),
});

export const productListSchema = t.Object({
  id: t.String({ format: 'uuid', description: 'Identifiant unique du produit.' }),
  category: t.String({ format: 'uuid', description: 'UUID de la catégorie du produit.' }),
  taxRate: t.String({ format: 'uuid', description: 'UUID du taux de TVA appliqué.' }),
  name: t.String({ description: 'Nom du produit.' }),
  slug: t.String({ description: "Identifiant lisible pour l'URL." }),
  description: t.Nullable(t.String({ description: 'Description du produit.' })),
  status: statusEnum,
  dateCreated: t.Date({ description: 'Date de création.' }),
  dateUpdated: t.Date({ description: 'Date de dernière modification.' }),
  featuredImage: t.Nullable(
    t.String({ format: 'uuid', description: 'UUID du média mis en avant.' }),
  ),
  defaultVariant: t.Nullable(defaultVariantSchema),
  images: t.Array(t.String({ format: 'uuid', description: "UUID d'un média de la galerie." }), {
    description: 'Galerie ordonnée (image principale en tête) — survol, miniatures.',
  }),
});

export const productSchema = t.Object({
  id: t.String({ format: 'uuid', description: 'Identifiant unique du produit.' }),
  category: t.String({ format: 'uuid', description: 'UUID de la catégorie du produit.' }),
  taxRate: t.String({ format: 'uuid', description: 'UUID du taux de TVA appliqué.' }),
  name: t.String({ description: 'Nom du produit.' }),
  slug: t.String({ description: "Identifiant lisible pour l'URL." }),
  description: t.Nullable(t.String({ description: 'Description du produit.' })),
  status: statusEnum,
  dateCreated: t.Date({ description: 'Date de création.' }),
  dateUpdated: t.Date({ description: 'Date de dernière modification.' }),
});

export const optionSchema = t.Object({
  id: t.String({ format: 'uuid', description: "Identifiant unique de l'option." }),
  name: t.String({ description: "Nom de l'option (ex. « Taille », « Couleur »)." }),
});

export const optionValueSchema = t.Object({
  id: t.String({ format: 'uuid', description: "Identifiant unique de la valeur d'option." }),
  option: t.String({ format: 'uuid', description: "UUID de l'option parente." }),
  value: t.String({ description: 'Valeur (ex. « M », « Rouge »).' }),
  sortOrder: t.Number({ description: "Ordre d'affichage." }),
});

export const variantSchema = t.Object({
  id: t.String({ format: 'uuid', description: 'Identifiant unique de la variante.' }),
  product: t.String({ format: 'uuid', description: 'UUID du produit parent.' }),
  sku: t.Nullable(t.String({ description: 'Référence interne (SKU).' })),
  barcode: t.Nullable(t.String({ description: 'Code-barres (EAN/UPC).' })),
  priceHt: t.String({ description: 'Prix HT, décimal en chaîne (ex. « 12.90 »).' }),
  compareAtPriceHt: t.Nullable(
    t.String({ description: 'Prix barré HT (avant remise), décimal en chaîne.' }),
  ),
  costPrice: t.Nullable(
    t.String({ description: "Coût d'achat HT (donnée interne, non exposée au storefront)." }),
  ),
  weight: t.Nullable(t.String({ description: 'Poids en kg, décimal en chaîne.' })),
  length: t.Nullable(t.String({ description: 'Longueur en cm, décimal en chaîne.' })),
  width: t.Nullable(t.String({ description: 'Largeur en cm, décimal en chaîne.' })),
  height: t.Nullable(t.String({ description: 'Hauteur en cm, décimal en chaîne.' })),
  isDefault: t.Boolean({ description: 'Variante affichée par défaut sur la fiche produit.' }),
  status: statusEnum,
  sortOrder: t.Number({ description: "Ordre d'affichage." }),
  quantity: t.Number({ description: 'Stock disponible.' }),
  lowStockThreshold: t.Nullable(
    t.Number({ description: "Seuil d'alerte de stock bas (donnée interne)." }),
  ),
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
  t.Object({
    optionValues: t.Array(
      t.String({ format: 'uuid', description: "UUID d'une valeur d'option sélectionnée." }),
      { description: 'Valeurs d’option qui définissent cette variante.' },
    ),
  }),
]);

// Option enrichie de ses valeurs (fiche produit).
export const optionDetailSchema = t.Composite([
  optionSchema,
  t.Object({
    sortOrder: t.Number({ description: "Ordre d'affichage de l'option." }),
    values: t.Array(optionValueSchema, { description: "Valeurs possibles de l'option." }),
  }),
]);

// Produit + variants + options (retour de GET /products/:id, PUBLIC → variant projeté).
export const productWithVariantsSchema = t.Composite([
  productSchema,
  t.Object({
    variants: t.Array(variantDetailSchema, { description: 'Variantes du produit.' }),
    options: t.Array(optionDetailSchema, { description: 'Options du produit.' }),
  }),
]);

// Vue ADMIN du variant : la vue COMPLÈTE (`variantSchema`, avec costPrice/lowStockThreshold) +
// ses valeurs d'option. Réservée aux lectures admin (RBAC product.read) → jamais dans la surface
// storefront. Distincte de `variantDetailSchema` (public, sans champs internes).
export const variantAdminDetailSchema = t.Composite([
  variantSchema,
  t.Object({
    optionValues: t.Array(
      t.String({ format: 'uuid', description: "UUID d'une valeur d'option sélectionnée." }),
      { description: 'Valeurs d’option qui définissent cette variante.' },
    ),
  }),
]);

// Produit + variants COMPLETS + options (retour de GET /products/:id/full, ADMIN). Alimente
// l'éditeur produit/variants de l'admin (édition de costPrice/lowStockThreshold).
export const productAdminWithVariantsSchema = t.Composite([
  productSchema,
  t.Object({
    variants: t.Array(variantAdminDetailSchema, { description: 'Variantes (vue admin complète).' }),
    options: t.Array(optionDetailSchema, { description: 'Options du produit.' }),
  }),
]);

// Média rattaché à un produit (galerie).
export const productMediaSchema = t.Object({
  product: t.String({ format: 'uuid', description: 'UUID du produit.' }),
  media: t.String({ format: 'uuid', description: 'UUID du média.' }),
  sortOrder: t.Number({ description: "Ordre d'affichage dans la galerie." }),
  isFeatured: t.Boolean({ description: 'Média mis en avant (image principale).' }),
  featuredForVariant: t.Nullable(
    t.String({
      format: 'uuid',
      description: 'UUID de la variante pour laquelle ce média est mis en avant.',
    }),
  ),
});

// Fiche produit détaillée storefront (GET /products/by-slug/:slug) :
// ci-dessus + image mise en avant + galerie.
export const productDetailSchema = t.Composite([
  productWithVariantsSchema,
  t.Object({
    featuredImage: t.Nullable(
      t.String({ format: 'uuid', description: 'UUID du média mis en avant.' }),
    ),
    images: t.Array(t.String({ format: 'uuid', description: "UUID d'un média de la galerie." }), {
      description: 'Galerie de médias du produit.',
    }),
  }),
]);

// Modèles nommés exposés dans le contrat (components.schemas).
export const catalogModels = {
  Product: productSchema,
  ProductWithVariants: productWithVariantsSchema,
  ProductAdminWithVariants: productAdminWithVariantsSchema,
  ProductDetail: productDetailSchema,
  ProductList: paginatedResponse(productListSchema),
  ProductMedia: productMediaSchema,
  Variant: variantSchema,
  Option: optionSchema,
  OptionValue: optionValueSchema,
};
