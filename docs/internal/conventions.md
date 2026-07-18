# Conventions projet — Échoppe

Capture les **choix et seuils projet non dérivables du code** (cf. philosophy §9). La SSOT des
idiomes reste `~/.code-conform/docs/` ; ce fichier ne note que ce qui est **spécifique à Échoppe**
ou qui **tranche un point contextuel**. Les décisions structurantes vivent dans les
[ADR](./adr/README.md) ; ici on capture les conventions de travail et les seuils.

## Structure des packages

### `packages/core` — slicing horizontal assumé (pour l'instant)

`core` est organisé par **couche technique** : `db/schema/*`, `adapters/<famille>/*`, `services/*`,
`utils/*` — **pas** en `domain/<concept>/` (slicing vertical DDD). C'est un **écart conscient** vs
philosophy §6 / typescript.md §8, acté ici :

- **Pourquoi maintenant** : `core` a un seul consommateur (l'API). La première implémentation reste
  concrète et minimale (philosophy §4) ; introduire `domain/product/{Product.ts, Product.schema.ts,
  Product.repository.ts}` par anticipation serait une abstraction non justifiée.
- **Seuil de bascule** : on passe au slicing vertical `domain/` **quand le wiring se duplique** —
  typiquement à l'arrivée d'un 2ᵉ consommateur de `core` (worker, CLI de maintenance, job externe)
  qui recompose la même logique métier hors des routes. C'est le signal #1 de typescript.md §4.
- **Suivi** : refactor différé, tracé en tâche dédiée. À rouvrir formellement (ADR) avant exécution.

### `apps/api` — frontière + SSOT contrat

`models/*.ts` (TypeBox) = SSOT du contrat : validation runtime **+** OpenAPI **+** inférence Eden.
Une donnée `jsonb` typée côté `core` **et** validée côté `api` suit le pattern à double
représentation verrouillée (interface core + TypeBox api + guard `Static<> extends`) —
cf. [ADR-0020](./adr/ADR-0020-colormetadata-double-representation.md).

### `apps/admin` — atomic + composables

Détail dans [PATTERNS.md](./PATTERNS.md) / [ADR-0016](./adr/ADR-0016-conventions-front-admin.md) :
atomic design, **imports directs** (pas de barrel pour les composants Vue), types **inférés depuis
Eden** (jamais d'interface manuelle pour les données API), un composable par feature `{state,
actions}`.

## Gestion des erreurs

- **Erreur métier attendue** = valeur de retour typée via `status(4xx, …)` à la frontière Elysia
  (ex. 404 produit introuvable, 400 personnalisation invalide). Pas d'exception pour un cas nominal.
- **Erreur exceptionnelle** = `throw`, capturé à la frontière (ex. `verifyWebhook` d'un adapter qui
  lève sur signature invalide → `catch` route → 400). Try/catch async **aux frontières**, pas par
  réflexe partout.
- Jamais de catch silencieux. Pas de `console.log` de debug en prod (les logs structurés
  `[Contexte] …` sont volontaires).

## Frontière de validation

Une seule frontière (philosophy §5) : **TypeBox/Elysia** à l'entrée HTTP
([ADR-0015](./adr/ADR-0015-validation-typebox.md)). Pas de Zod (retiré de `core`/`shared`, deps
mortes). En interne, on **truste** la donnée déjà parsée. `slugify`/dédup et autres normalisations
sont des transformations, pas des revalidations.

## Providers & frontière HTTP

`payments`/`shipping`/`communications` ne sont pas « le métier du paiement/livraison » mais la
**frontière HTTP mince** vers le provisionner (adapters, [ADR-0011](./adr/ADR-0011-adapters-providers.md)).
Ajouter un provider = un adapter + une entrée dans la SSOT `PAYMENT_PROVIDERS`, **zéro route**
(webhook paramétrique `/:provider`). Seules restent des routes : création de session (secret serveur
+ montant autoritaire), webhook (le provider nous rappelle), config/statut/refund admin.

## Seuils (non chiffrés)

Pas de seuil dur sur lignes/fichiers (philosophy §9) : un fichier/fonction « lourd » est un **signal
de revue**, pas une violation. Le découpage suit la lisibilité et la duplication **réelle** (≥2
occurrences déclenchent la factorisation, pas l'anticipation).

## Tests

Filet **lean anti-régression** (esprit CI/CD, sans gonfler la CI) : `bun test` intégré. Smoke API via
`bun run --cwd apps/api test:smoke` sur **base Postgres jetable éphémère** (conteneur sur port libre,
**jamais** la base dev ni `dpc-*`/5432). Les routes auth-gated se testent **sans Redis** en injectant
user+rôle+session Postgres et le cookie `echoppe_admin_session` (owner bypass). Chaque capacité ajoute
1–2 assertions ciblées (contrat + comportement clé), rien de plus.

## Nommage & Git

Code/API en **anglais**, URLs storefront en **français** (`/produits`), UI en français. Messages de
commit en **français**, **aucune mention d'IA/assistant** (seul le nom de l'utilisateur). Commit
oui, **push jamais** sans demande explicite.
