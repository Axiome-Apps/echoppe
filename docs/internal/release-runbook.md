# Runbook release — invariant, post-mortem, durcissement

Notes internes sur la discipline de publication. La version contributeur (le
« comment ») vit dans `docs/dev/releasing.md` ; ici on garde l'**invariant**, le
**post-mortem** de l'incident 0.4.0 et le **plan de tests** qui l'aurait attrapé.

## Invariant

> Pull image → migrate (base **vierge** ou **upgrade**) → `200` sur les routes clés,
> vérifié sur l'**artefact publié**, pas sur la base de dev.

Corollaire : `db:push` est du prototypage local. Il ne produit pas de migration donc
ne prouve **rien** sur ce que l'image embarque. La seule vérité de prod = le dossier
`packages/core/drizzle/` appliqué au boot.

## Post-mortem — 0.4.0 (2026-07-17)

**Symptôme.** `echoppe-api:0.4.0` → `500` sur `/products/` (`select … option_value.metadata
… where option.type = 'color'`), `/countries/` → `200 []`. Toute boutique qui pull 0.4.0
obtient un backend cassé.

**Cause racine.** Le chantier options typées a ajouté `option.type` (enum) +
`option_value.metadata` (jsonb) au schéma, appliqués en dev via `db:push` **sans**
`db:generate`. Les migrations committées s'arrêtaient à 0005 → l'image 0.4.0 crée un
schéma sans ces colonnes. Drizzle réconcilie *migrations ↔ journal*, jamais
*schéma-du-code ↔ base* → « Schéma à jour » trompeur, cassé au seul runtime.
Secondairement, `country` (créée par migration mais peuplée uniquement par le
`db:seed` dev-only) restait vide en prod.

**Correctif (0.4.1).** Migration `0006_option_type_metadata_country_seed` :
`CREATE TYPE option_type`, `ADD COLUMN option.type`, `ADD COLUMN option_value.metadata`,
+ `INSERT` idempotent de la France (référentiel prod minimal, `ON CONFLICT (code) DO
NOTHING`). Validée base vierge (0000→0006) + idempotence. `db:generate` de contrôle :
« No schema changes » → dérive entièrement capturée. Le SDK n'était pas en cause (il
dérive de l'OpenAPI, juste en avance sur les migrations).

**Leçon.** Le faux vert vient de l'absence de test sur l'**artefact**. Cf. plan ci-dessous.

## Plan de durcissement (tests à ajouter)

Priorité décroissante. T1 aurait attrapé l'incident directement.

- **T1 — Garde anti-dérive (pré-build, unitaire, rapide).** En CI, échouer si
  `schéma ≠ migrations committées` : après `db:generate`, `git diff --exit-code`
  sur `packages/core/drizzle/` doit être propre (ou `drizzle-kit check`). Bannir
  `db:push` de la CI.
- **T2 — Smoke « base vierge depuis l'image ».** Postgres éphémère → image buildée
  (migrate au boot) → mini-seed d'un produit à option `color` → assert `/products/`
  `200` (images/swatches non vides), `/products/by-slug/{slug}` `200` avec
  `values[].type` / `.metadata`, `/countries/` `200` non vide.
- **T3 — Chemin upgrade.** Restaurer un dump `n-1` (fixture `db-<prev>.sql`) → booter
  la nouvelle image → migrations forward OK → rejouer T2. Empêche « marche en fresh,
  casse en upgrade ».
- **T4 — Parité contrat.** OpenAPI de l'image buildée == SDK publié ; valider la
  forme des réponses réelles contre le schéma (attrape « champ promis, non fourni »).
- **T5 — Idempotence seeds.** Rejouer boot/migrate 2× → ni erreur ni doublon
  (`country` upsert).

**Branchement.** T1 en check unitaire (bloquant, pré-build). T2–T5 en job
d'intégration après build image, avant publication (`docker-build.yml` /
`release.yml`).

## Garde-fous environnement

- **Ne jamais** migrer/seed une base de prod. Conteneurs `dpc-*` = boutique réelle.
  Framework = `echoppe-*` (via `compose.dev.yaml` / `compose.yaml`) ou éphémère jetable.
- `echoppe-db` et `dpc-db` partagent le port 5432 → ne pas lancer le stack framework
  pendant que dpc tourne ; préférer un conteneur jetable sur un port libre.
