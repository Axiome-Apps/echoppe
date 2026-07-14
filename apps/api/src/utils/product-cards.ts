import { and, db, eq, inArray, productMedia, variant } from '@echoppe/core';

// Projection « carte produit » storefront — SOURCE UNIQUE partagée par les endpoints de
// listing (GET /products/, /categories/:id/products, /collections/:id/products). Enrichit
// chaque produit en 2 requêtes batchées (médias + variante par défaut). Toute évolution du
// payload de carte (ex. swatches à venir) se fait ici, pas ×3 dans chaque route.
//
// - featuredImage : média mis en avant (image principale), ou null.
// - defaultVariant : prix HT / prix barré / stock de la variante par défaut, ou null.
// - images : galerie ordonnée (image featured en tête, puis sortOrder) → survol, miniatures.

const emptyCard = {
  featuredImage: null as string | null,
  defaultVariant: null,
  images: [] as string[],
};

export async function enrichProductCards<T extends { id: string }>(products: T[]) {
  const productIds = products.map((p) => p.id);
  if (productIds.length === 0) {
    return products.map((p) => ({ ...p, ...emptyCard }));
  }

  const [media, defaultVariants] = await Promise.all([
    db
      .select({
        product: productMedia.product,
        media: productMedia.media,
        sortOrder: productMedia.sortOrder,
        isFeatured: productMedia.isFeatured,
      })
      .from(productMedia)
      .where(inArray(productMedia.product, productIds)),
    db
      .select({
        product: variant.product,
        priceHt: variant.priceHt,
        compareAtPriceHt: variant.compareAtPriceHt,
        quantity: variant.quantity,
      })
      .from(variant)
      .where(and(inArray(variant.product, productIds), eq(variant.isDefault, true))),
  ]);

  // Galerie ordonnée par produit : image featured en premier, puis sortOrder croissant.
  const gallery = new Map<string, string[]>();
  const sorted = [...media].sort((a, b) => {
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
  for (const m of sorted) {
    const list = gallery.get(m.product) ?? [];
    list.push(m.media);
    gallery.set(m.product, list);
  }

  const featuredByProduct = new Map(
    media.filter((m) => m.isFeatured).map((m) => [m.product, m.media]),
  );
  const defaultVariantByProduct = new Map(
    defaultVariants.map((dv) => [
      dv.product,
      { priceHt: dv.priceHt, compareAtPriceHt: dv.compareAtPriceHt, quantity: dv.quantity },
    ]),
  );

  return products.map((p) => ({
    ...p,
    featuredImage: featuredByProduct.get(p.id) ?? null,
    defaultVariant: defaultVariantByProduct.get(p.id) ?? null,
    images: gallery.get(p.id) ?? [],
  }));
}
