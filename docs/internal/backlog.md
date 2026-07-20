# Backlog — Échoppe (index activable)

Liste de tâches **à cocher**, point d'entrée unique du travail ouvert. Le **détail** de chaque
tâche vit dans un document dédié (ADR, audit, note de design) — la ligne le **pointe**. Ce fichier
ne porte que l'**état**, pas le contenu.

- Roadmap **publique** ≠ ce backlog interne → voir [`docs/roadmap.md`](../roadmap.md).
- Décisions structurantes → [ADR](./adr/README.md). Discipline de publication →
  [pipeline-release.md](./pipeline-release.md).

Légende : `[x]` fait · `[ ]` ouvert · 🔴 fort impact · 🟠 moyen · 🟡 faible / durcissement.

---

## Ouvert

### Catalogue storefront
- [ ] 🟠 **Facettes catalogue** (endpoints scopés catégorie/collection) → [détail](./design/facettes-catalogue.md)
      — tri livré (B4) ; reste fourchette prix + `inStock`, puis facettes par option (agrégation).
- [ ] 🟡 **Signal low-stock public** (B10) → [détail](./design/signal-low-stock.md)
      — booléen calculé `isLowStock`, jamais le seuil brut ([ADR-0006](./adr/ADR-0006-visibilite-catalogue.md)).
- [ ] 🟠 **Système de contenu léger** (absorbe B9 prose + B11 onglets produit) →
      [design](./design/systeme-contenu-leger.md) — ⚠️ décision format HTML vs Markdown à trancher ;
      **ADR requis avant impl**.

### Compte & checkout — détail : [audit-compte-checkout.md](./audit-compte-checkout.md)
- [ ] 🔴 **Checkout invité (guest)** — `POST /checkout` exige un compte ; décision produit à trancher.
- [ ] 🟠 **RGPD self-service** (export + suppression de compte) — foyer déjà anticipé dans `customer-account.ts`.
- [ ] 🟡 **Double opt-in** à l'inscription (vérification email).
- [ ] ⚪ **Suivi de commande invité** (lookup n° + email) — dépend du checkout invité.

### Sécurité / durcissement — détail : [security-audit.md](./security-audit.md)
- [ ] 🔴 **Rate-limit fail-open sans Redis** + IP de confiance (X-Forwarded-For spoofable).
- [ ] 🟠 **Timing login** — verify factice sur user introuvable (anti-énumération).
- [ ] 🟠 **Whitelist upload média** (MIME/extension + cap taille) + `Content-Disposition: attachment`.
- [ ] 🟠 **Hasher les tokens de session** (aujourd'hui en clair, incohérent avec clés API / reset).
- [ ] 🟡 **`onError` global** (message générique en prod) + sanitize extension upload + hardening divers.

### RBAC & observabilité — détail : [audit-rbac-plan.md](./audit-rbac-plan.md)
- [ ] 🟠 **Journal d'audit** — table `auditLog` existe, ni route API ni vue admin. Instrumenter les
      routes critiques (products/orders/users/roles…).
- [ ] 🟡 **Nettoyage matrice RBAC** — ressources par scope (admin vs store), guards PATCH explicites.
      *(Vérifier l'état : `wishlist` n'est plus orpheline depuis B7 ; code mort rbacPlugin retiré.)*

### Architecture interne
- [ ] 🟡 **Refactor `domain/<concept>/` dans `core`** (slicing vertical, différé) →
      [conventions.md § packages/core](./conventions.md). Déclencheur = 2ᵉ consommateur de `core`.
      **ADR requis avant exécution.**

---

## Fait (référence)

Historique verrouillé par test, détail en ADR. Les correctifs A1–A3 et B1–B8 sont l'exécution du
brief storefront DPC.

| Lot | Contenu | Détail |
|-----|---------|--------|
| A1–A3 | Variante par défaut : image ne casse plus `isDefault`/`sortOrder`, exclusivité API, fallback publié | [ADR-0009](./adr/ADR-0009-variante-defaut-image.md) |
| B1 | `variant.featuredImage` sur le détail | [ADR-0009](./adr/ADR-0009-variante-defaut-image.md) |
| B2 | Personnalisation produit (champs déclarés, addon prix) | [ADR-0010](./adr/ADR-0010-personnalisation-produit.md) |
| B3 | Tags produit storefront (`tag` + `product_tag`) | [ADR-0019](./adr/ADR-0019-tags-produit.md) |
| B4 | Tri `sort`/`order` sur endpoints scopés (délégation `queryProductCards`) | — (reste : facettes, ci-dessus) |
| B5 | Stratégie images : pas de resize serveur, dimensions exposées (`imageRef`) | [ADR-0021](./adr/ADR-0021-strategie-images.md) |
| B6 | Audit surface compte/checkout | [audit-compte-checkout.md](./audit-compte-checkout.md) |
| B7 | Wishlist (`GET/POST/DELETE /wishlist`, client authentifié) | — |
| B8 | Produits liés : curation directionnelle + fallback voisinage | [ADR-0022](./adr/ADR-0022-produits-lies.md) |
| Options | Options typées & swatches (oklch canonique, `/option-axes`) | [ADR-0020](./adr/ADR-0020-colormetadata-double-representation.md) |
| Audits | Lot A (Zod retiré, webhook `/:provider`), lot 2 (#1 toasts, #2 code mort, #3 helpers, #4 DIP adapters, #5 PayPal AUTHORIZE, #6 `useCrudResource`, #7 registres adapters) | — |

## Rappel publication

Avant tout bump : migration committée (pas `push`), SDK régénéré (`bun run contracts`), smoke
fresh+upgrade verts (gate T2–T5), versions alignées. Détail : [pipeline-release.md](./pipeline-release.md).
</content>
</invoke>
