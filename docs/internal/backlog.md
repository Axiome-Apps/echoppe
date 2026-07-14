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

## 2. Options typées & swatches (pastilles)

**Besoin.** Rendu des pastilles sur les cartes produit : couleur (rond coloré) et/ou image
par variante. Aujourd'hui impossible proprement :

- `option` n'a **pas de `type`** → impossible d'identifier l'axe « couleur » autrement que par
  le nom (`"Couleur"`, fragile, i18n).
- `optionValue` stocke une **simple chaîne** (`"Red"`) → pas de valeur couleur exploitable.
- L'image par variante existe déjà en base (`productMedia.featuredForVariant`) → swatch image
  faisable sans migration, mais l'axe reste non identifié.

**Direction de design retenue — système d'options extensible discriminé par type.**

- `option.type` : enum (`'string'` par défaut, `'color'`, extensible → styles avancés futurs).
- Le `type` pilote **deux bouts** d'un coup :
  - **Admin** : le widget de saisie (`color` → colorPicker renvoyant une couleur, `string` →
    input texte, types futurs → leur widget).
  - **Storefront** : le rendu (`color` → pastille, `string` → pill texte…).
- Valeur enrichie sur `optionValue` via un **`metadata` jsonb dont la forme est discriminée
  par `option.type`**, validée par Zod à la frontière (aligné SSOT : union discriminée, parse
  à la frontière). Pour `color` : stocker une **chaîne couleur CSS brute** — hex *ou* rgba *ou*
  oklch, le navigateur rend n'importe quelle couleur CSS valide, donc un seul champ couvre les
  trois sans se lier à un format. `string` : pas de metadata.
- Un type avancé futur = une variante d'enum + son schéma metadata + son widget admin + son
  rendu, sans toucher aux autres.

**Impacts.** Migration (`option.type`, `optionValue.metadata`) + UI admin (colorPicker) +
enrichissement de `enrichProductCards` (exposer variants + valeurs d'option + image par variante
sur la carte) + rendu storefront.

**Décision en attente.** À rediscuter — valider l'enum de types de départ et la forme des
`metadata` par type avant d'écrire la migration.

---

## Livré (contexte)

- **`images[]` sur la carte produit** — galerie ordonnée (image principale en tête) exposée par
  les 3 endpoints de listing, pour le survol (2ᵉ image) et les miniatures. Aucune migration.
- **Projection carte produit factorisée** — `enrichProductCards`, préalable aux points ci-dessus.
