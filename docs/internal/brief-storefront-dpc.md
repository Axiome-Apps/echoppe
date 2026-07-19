# Tracker — besoins storefront DPC (batch)

Suivi d'exécution du brief framework (besoins remontés par la boutique réelle DPC). Les **décisions**
vivent dans les [ADR](./adr/README.md) ; ce fichier ne suit que **l'état** par item. P1 = signature/
bloquant → P4 = confort.

Légende : ✅ fait · 🟡 en cours · ⬜ à faire · 🔒 verrouillé par test

## Partie A — Correctifs (implémentés, cf. [ADR-0009](./adr/ADR-0009-variante-defaut-image.md), commit `f736468`)

| Item | État | Vérif |
|------|------|-------|
| A1. Rattacher image variante n'écrase plus `isDefault`/`sortOrder` | ✅ 🔒 | `variant-payload.test.ts` (admin, helper pur) |
| A2. Admin expose le contrôle « variante par défaut » + exclusivité API | ✅ 🔒 | `variant-default-image.test.ts` (A2 exclusivité, session injectée) |
| A3. `defaultVariant` retombe sur la 1re variante publiée si aucune `isDefault` | ✅ 🔒 | `variant-default-image.test.ts` (A3 ×4) |

## Partie B — Nouvelles capacités

### P1 — signature DPC
| Item | État | ADR | Notes |
|------|------|-----|-------|
| B1. `variant.featuredImage` sur le détail | ✅ 🔒 | [0009](./adr/ADR-0009-variante-defaut-image.md) | `by-slug` + `/:id`, SDK régénéré |
| B2. Personnalisation produit (prénom +5 €) | ✅ 🔒 | [0010](./adr/ADR-0010-personnalisation-produit.md) | Backend + UI admin (toggle produit + onglet Personnalisation + CRUD champs). Verrouillé : `cart-personalization.test.ts` (détail, écho panier, validation, snapshot commande, CRUD admin → storefront) |
| B3. Tags produit storefront (couplé B2) | ✅ 🔒 | [0019](./adr/ADR-0019-tags-produit.md) | table `tag` + `product_tag` ; `tags: string[]` (noms, tri FR) liste+détail ; set-semantics PUT/PATCH ; UI admin (input à puces). Verrou : `product-tags.test.ts` |

### P2 — complétude catalogue
| Item | État | Notes |
|------|------|-------|
| B4. `sort`/`order` sur `/categories\|collections/{id}/products` | ✅ 🔒 | les 2 routes délèguent à `queryProductCards` (+ param `extraConditions` pour l'appartenance) au lieu du tri `dateCreated` figé ; `sort=price\|name\|dateCreated` + `order`. ⚠️ tri par défaut : `dateCreated` **DESC** (récent d'abord, aligné sur `/products/`) au lieu de l'ancien ASC. SDK régénéré. Verrou : `category-collection-sort.test.ts` |
| B5. ~~Resize média `/assets/{id}?width=`~~ → **dimensions exposées** | ✅ 🔒 | Décision : pas de resize serveur (le framework n'optimise pas les images). L'API sert l'original + expose `imageRef {id,width,height}` (carte, galerie, variante, swatch) ; le `<Image>` est la responsabilité de la boutique réelle (BFF/CDN via loader). Cf. [0021](./adr/ADR-0021-strategie-images.md). SDK régénéré (rupture uuid→objet, pré-1.0). Verrou : `image-dimensions.test.ts` |

### P3 — compte & engagement
| Item | État | Notes |
|------|------|-------|
| B6. Audit surface compte/checkout (doc) | ✅ | [audit-compte-checkout.md](./audit-compte-checkout.md) : socle connecté complet (auth/profil/adresses CRUD/commandes/checkout/panier). Manques = décisions produit : checkout invité (🔴), RGPD self-service (🟠, déjà anticipé code), double opt-in (🟡). |
| B7. Wishlist (`GET/POST/DELETE /wishlist`) | ✅ 🔒 | table `wishlist_item` (PK customer+variant) préexistante → routes ajoutées (client authentifié, `customerAuth`). Ajout idempotent, listing enrichi (variant+produit+imageRef), 404 variante inconnue, 401 anonyme. SDK régénéré (namespace `wishlist`). Verrou : `wishlist.test.ts` (5 cas). |
| B8. Recommandations `/products/{id}/related` | ✅ 🔒 | **curation directionnelle** (choix admin) + fallback voisinage si vide — cf. [0022](./adr/ADR-0022-produits-lies.md). Table `product_related` (ordonnée), set via body produit (`relatedProductIds`), UI admin `RelatedProductsInput` (recherche+réordonnancement), route publique cartes ordonnées. SDK régénéré. Verrou : `related-products.test.ts`. |

### P4 — contenu & confort
| Item | État | Notes |
|------|------|-------|
| B9. Bloc prose/richText page-builder | 🅱️ backlog | **Bloqué sur décision format : HTML vs Markdown.** Une partie du contenu est déjà en HTML → choisir Markdown imposerait d'homogénéiser tout l'existant (migration). Trancher ce point AVANT d'implémenter. `pages/by-slug` existe ; ajouter type de bloc prose une fois le format arbitré. |
| B10. Signal low-stock public | ⬜ | ⚠️ décision : booléen calculé `isLowStock` vs seuil brut ([ADR-0006](./adr/ADR-0006-visibilite-catalogue.md) : seuil masqué) |
| B11. Source onglets produit (livraison/retours/conseils) | ⬜ | ⚠️ décision : backend vs statique |

## Checklist publication (avant bump)
`generate` + migration committés (pas push) · SDK régénéré depuis l'image · smoke fresh + upgrade
verts (T1–T5 runbook 0.4.0) · versions api/admin/SDK alignées. Cf.
[ADR-0004](./adr/ADR-0004-migrations-release.md), [ADR-0007](./adr/ADR-0007-contrat-sdk.md).
