---
"@echoppe/client": minor
---

Storefront 0.5.0 — nouvelles capacités catalogue + rupture de contrat image.

**BREAKING (contrat image)** — les références image du contrat storefront passent d'un UUID nu à une
ref `{ id, width, height }` : `featuredImage`, `images[]`, `variant.featuredImage`, `swatch.image`.
Le framework n'optimise pas les images (pas de resize serveur) ; il expose l'original + ses
dimensions intrinsèques, à charge du storefront de bâtir son `<Image>` (anti-CLS). Migration
boutique : `featuredImage` → `featuredImage.id` pour l'URL ; `width`/`height` désormais disponibles.
Cf. ADR-0021.

- **Tri** `sort`/`order` sur `/categories|collections/{id}/products` — même vocabulaire que la liste
  globale (`price`/`name`/`dateCreated`). Défaut : plus récent d'abord (B4).
- **Wishlist** client — `GET/POST/DELETE /wishlist` (surface authentifiée, sur variantes) (B7).
- **Produits liés** — `GET /products/{id}/related` : curation admin ordonnée + fallback voisinage si
  vide (B8, ADR-0022).
- **Tags** produit exposés sur cartes + détail (B3).
