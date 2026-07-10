import { type TSchema, t } from 'elysia';

// Modèles du module content (page builder). SOURCE UNIQUE des schémas de blocs : une union
// discriminée sur `type`. Chaque bloc porte ses champs dans `data`. Ajouter un type de bloc =
// une variante ici (+ form admin + composant storefront), SANS migration.

const uuidStr = (description: string) => t.String({ format: 'uuid', description });

// ── Champs (`data`) par type de bloc ────────────────────────────────────────
const heroData = t.Object({
  image: t.Nullable(uuidStr('UUID du média de fond, ou null.')),
  title: t.String({ description: 'Titre principal.' }),
  subtitle: t.Nullable(t.String({ description: 'Sous-titre, ou null.' })),
  ctaLabel: t.Nullable(t.String({ description: 'Libellé du bouton d’action, ou null.' })),
  ctaHref: t.Nullable(t.String({ description: 'Lien du bouton d’action, ou null.' })),
});

const richTextData = t.Object({
  html: t.String({ description: 'Contenu HTML riche (édité au WYSIWYG admin).' }),
});

const productGridData = t.Object({
  collectionId: uuidStr('UUID de la collection à afficher (résolue côté storefront).'),
  title: t.Nullable(t.String({ description: 'Titre de la grille, ou null.' })),
  limit: t.Optional(t.Number({ description: 'Nombre max de produits affichés.' })),
});

const imageData = t.Object({
  mediaId: uuidStr('UUID du média.'),
  alt: t.Nullable(t.String({ description: 'Texte alternatif, ou null.' })),
});

const ctaData = t.Object({
  label: t.String({ description: 'Libellé du bouton.' }),
  href: t.String({ description: 'Lien du bouton.' }),
});

// Table type → schéma de `data`. SSOT réutilisée pour valider l'écriture ET construire les
// unions de lecture/écriture.
export const BLOCK_DATA = {
  hero: heroData,
  richText: richTextData,
  productGrid: productGridData,
  image: imageData,
  cta: ctaData,
} as const;

export type BlockType = keyof typeof BLOCK_DATA;
export const BLOCK_TYPES = Object.keys(BLOCK_DATA) as BlockType[];

// Section résolue (LECTURE storefront) : forme générique `{ id, type, data }`. `data` est
// volontairement non typé ici — la donnée en base est du jsonb, et le typage précis par type
// de bloc est fourni au front du dev par le type-gen des définitions (P2). Le storefront
// discrimine sur `type`. Le `name` (métadonnée admin) n'est pas exposé.
const sectionSchema = t.Object({
  id: uuidStr('UUID de la section.'),
  type: t.String({ description: 'Type de bloc (hero, richText, productGrid, image, cta…).' }),
  data: t.Unknown({ description: 'Champs du bloc — forme selon `type`.' }),
});

// Corps d'ÉCRITURE d'une section (admin) : union discriminée sur `type` → `data` validé selon
// le type de bloc (données propres garanties en base). Construit en tableau LITTÉRAL (pas
// `.map()`, qui casse l'inférence Static de TypeBox).
const sectionInputVariant = (type: BlockType, data: TSchema) =>
  t.Object({ name: t.Optional(t.String()), type: t.Literal(type), data });

export const sectionInputSchema = t.Union([
  sectionInputVariant('hero', BLOCK_DATA.hero),
  sectionInputVariant('richText', BLOCK_DATA.richText),
  sectionInputVariant('productGrid', BLOCK_DATA.productGrid),
  sectionInputVariant('image', BLOCK_DATA.image),
  sectionInputVariant('cta', BLOCK_DATA.cta),
]);

const pageStatus = t.Union([t.Literal('draft'), t.Literal('published')], {
  description: 'Statut de publication.',
});

// Page complète (storefront) : métadonnées + sections ordonnées et résolues.
export const pageSchema = t.Object({
  id: uuidStr('UUID de la page.'),
  slug: t.String({ description: 'Identifiant lisible pour l’URL.' }),
  title: t.String({ description: 'Titre de la page.' }),
  seoTitle: t.Nullable(t.String({ description: 'Titre SEO, ou null.' })),
  seoDescription: t.Nullable(t.String({ description: 'Meta description SEO, ou null.' })),
  status: pageStatus,
  sections: t.Array(sectionSchema, { description: 'Sections de la page, ordonnées.' }),
});

// Aperçu de page (liste storefront : navigation, plan de site).
const pageSummarySchema = t.Object({
  id: uuidStr('UUID de la page.'),
  slug: t.String({ description: 'Identifiant lisible pour l’URL.' }),
  title: t.String({ description: 'Titre de la page.' }),
});

// Modèles nommés exposés dans le contrat (components.schemas).
export const contentModels = {
  Section: sectionSchema,
  Page: pageSchema,
  PageList: t.Array(pageSummarySchema),
};
