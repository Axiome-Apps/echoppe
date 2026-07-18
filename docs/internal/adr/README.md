# ADR — Architecture Decision Records

Référence **unique et centrale** des décisions structurantes d'Échoppe. Chaque décision = un ADR
numéroté. Les ADR sont la **porte d'entrée** ; quand le détail est dense, un ADR *lie* un fichier
détaillé (souvent un doc `docs/internal/` préexistant) qui, lui, survit.

## Format

```
# ADR-000X — <titre>
Statut : accepté | proposé | remplacé par ADR-00YY   ·   Date
## Contexte            le problème / la contrainte
## Options envisagées
## Décision
## Conséquences        impacts, dette, suivis
## Détail (optionnel)  → lien vers le fichier détaillé
```

## Index

| N° | Titre | Statut | Détail |
|----|-------|--------|--------|
| [0001](./ADR-0001-stack-storefront.md) | Stack storefront : Astro hybrid + îlots Vue (topologie B) | accepté | — |
| [0002](./ADR-0002-distribution.md) | Distribution : Docker runtime + npm SDK/CLI, modèle déploiement A | accepté | [distribution-architecture.md](../distribution-architecture.md) |
| [0003](./ADR-0003-runtime-pm.md) | Runtime & package manager : PM-agnostique, Bun API / Node front | accepté | [contraintes-outillage.md](../contraintes-outillage.md) |
| [0004](./ADR-0004-migrations-release.md) | Migrations au boot + validation release (compose dev vs prod) | accepté | [release-runbook.md](../release-runbook.md) |
| [0005](./ADR-0005-panier-stock.md) | Panier & stock : capture manuelle Stripe + garde atomique Postgres | accepté | — |
| [0006](./ADR-0006-visibilite-catalogue.md) | Sécurité visibilité catalogue : 404 vs 403, `adminOnly` | accepté | [security-audit.md](../security-audit.md) |
| [0007](./ADR-0007-contrat-sdk.md) | Contrat API & SDK figé (OpenAPI SSOT, Eden interne / SDK externe) | accepté | [distribution-architecture.md](../distribution-architecture.md) |
| [0008](./ADR-0008-auth-sessions.md) | Auth : sessions Postgres (pas JWT), cookies HTTP-only, RBAC | accepté | [api-keys.md](../api-keys.md) |
| [0009](./ADR-0009-variante-defaut-image.md) | Variante par défaut (exclusivité + fallback publié) & `featuredImage` | accepté | — |
| [0010](./ADR-0010-personnalisation-produit.md) | Personnalisation produit (champs déclarés, optionnelle par produit) | accepté | — |

## Conventions (non-ADR)

Règles de code et pièges récurrents — documentés à part, référencés par les ADR mais sans décision
d'architecture à trancher :
- [`PATTERNS.md`](../PATTERNS.md) — atomic design, slicing vertical, imports directs Vue, types Eden.
- **Eden verbe réservé** — ne jamais nommer un segment de route comme un verbe HTTP (`options`,
  `get`…) si le client Eden passe un param dessus (casse la forme appel). Cf. ADR-0007.
