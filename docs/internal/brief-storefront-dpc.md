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
| B3. Tags produit storefront (couplé B2) | ⬜ | — | table `tag` + `product_tag`, `tags: string[]` liste+détail |

### P2 — complétude catalogue
| Item | État | Notes |
|------|------|-------|
| B4. `sort`/`order` sur `/categories\|collections/{id}/products` | ⬜ | réutiliser `queryProductCards`/`enrichProductCards` |
| B5. Resize média `/assets/{id}?width=` | ⬜ | lib d'image + cache disque ; ADR (choix lib) |

### P3 — compte & engagement
| Item | État | Notes |
|------|------|-------|
| B6. Audit surface compte/checkout (**à faire en premier de P3**) | ⬜ | pur doc : existe/manque login/register, adresses CRUD, commandes |
| B7. Wishlist (`GET/POST/DELETE /wishlist`) | ⬜ | vérifier resource RBAC existante |
| B8. Recommandations `/products/{id}/related` | ⬜ | voisins même catégorie/collection |

### P4 — contenu & confort
| Item | État | Notes |
|------|------|-------|
| B9. Bloc prose/richText page-builder | ⬜ | `pages/by-slug` existe ; ajouter type de bloc prose |
| B10. Signal low-stock public | ⬜ | ⚠️ décision : booléen calculé `isLowStock` vs seuil brut ([ADR-0006](./adr/ADR-0006-visibilite-catalogue.md) : seuil masqué) |
| B11. Source onglets produit (livraison/retours/conseils) | ⬜ | ⚠️ décision : backend vs statique |

## Checklist publication (avant bump)
`generate` + migration committés (pas push) · SDK régénéré depuis l'image · smoke fresh + upgrade
verts (T1–T5 runbook 0.4.0) · versions api/admin/SDK alignées. Cf.
[ADR-0004](./adr/ADR-0004-migrations-release.md), [ADR-0007](./adr/ADR-0007-contrat-sdk.md).
