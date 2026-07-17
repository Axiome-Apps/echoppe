# Backlog technique — storefront catalogue

Backlog interne (pas la roadmap publique — voir `docs/roadmap.md`). Points de convergence
identifiés en travaillant le front e-commerce, mis en attente d'un design abouti. Ordonné
par dépendance, pas par priorité.

> Contexte : la projection « carte produit » du storefront est désormais **factorisée** dans
> `apps/api/src/utils/product-cards.ts` (`enrichProductCards`), consommée par
> `GET /products/`, `/categories/:id/products` et `/collections/:id/products`. Toute
> évolution du payload de carte (dont les swatches ci-dessous) se fait **là**, pas ×3.

---

## 1. Tri & facettes sur les endpoints scopés (catégorie / collection)

**État.** `GET /products/` expose déjà `sort` (newest / name / price) + filtres (`whereClause`).
Les endpoints **scopés** `/{categories,collections}/{id}/products` n'exposent que `page` / `limit`
et trient en dur par `dateCreated`. C'est une **dépendance framework** : une boutique ne peut
pas contourner ce manque côté client.

**À faire (par paliers).**

- **Tri** — porter `sort = newest | name | price_asc | price_desc` sur les endpoints scopés.
  Le tri par prix nécessite une jointure au variant par défaut (`variant.priceHt` où `isDefault`),
  comme déjà fait dans `products.ts`. Palier de déblocage minimal.
- **Facettes simples** — fourchette de prix (`minPrice` / `maxPrice`) + `inStock`. Sans
  agrégation des valeurs d'option.
- **Facettes par option** — filtrer par valeurs d'option (couleur, taille…) avec agrégation
  des facettes disponibles + compteurs (jointures `variantOptionValue`). Gros chantier ;
  dépend du système d'options typées (point 2) pour connaître les axes filtrables.

**Décision en attente.** Périmètre V1 (tri seul vs tri + prix/stock vs facettes complètes).

---

## Livré (contexte)

- **Options typées & swatches (pastilles)** — *livré 2026-07-16.* `option.type` (`string` | `color`)
  + `optionValue.metadata` jsonb. Couleur = **oklch canonique** `{ l, c, h, alpha }` — forme
  **structurée** retenue (pas la chaîne CSS brute envisagée au départ) ; SSOT `ColorMetadata` dans
  core + garde-fou TypeBox à la frontière API. Ressource globale **`/option-axes`** (catalogue
  d'axes ; renommée depuis `/options` car `options` est un **verbe HTTP réservé par Eden Treaty**)
  + association product-scoped. Admin : onglet **Options** (CRUD axes/valeurs), **ColorPicker**
  multi-mode (picker visuel / hex / RGBA / OKLCH + pipette écran), flux variante **catalog-driven**
  (axes existants seuls, pastilles, picker inline) + onglet **Variantes**. `enrichProductCards`
  expose `swatches[]` (couleur oklch rendue + image de variante). **Reste** : rendu pastilles
  **storefront**.

- **`images[]` sur la carte produit** — galerie ordonnée (image principale en tête) exposée par
  les 3 endpoints de listing, pour le survol (2ᵉ image) et les miniatures. Aucune migration.
- **Projection carte produit factorisée** — `enrichProductCards`, préalable aux points ci-dessus.
