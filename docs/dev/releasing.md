# Publier une version

Échoppe distribue **deux artefacts coordonnés** sur une même version :

- **Images Docker** `axiomeapp/echoppe-api` + `-admin` — déclenchées par un tag `v*`.
- **Paquet npm** `@echoppe/client` (SDK) — déclenché par un push `main` **avec changeset**.

La règle d'or : **une release n'est bonne que si une base vierge, migrée depuis
l'image publiée, répond `200` sur les routes clés.** Ce qui marche en dev via
`db:push` ne prouve rien pour l'utilisateur.

## Invariant migrations (à ne jamais enfreindre)

En dev, `db:push` applique le schéma **sans produire de fichier de migration**.
L'image de prod, elle, n'embarque que les **migrations versionnées** (`packages/core/drizzle/`)
et les applique au boot. Un schéma modifié en dev par `push` seul est donc **absent
de l'image** → 500 au runtime pour toute boutique.

**Après tout changement de `packages/core/src/db/schema/` :**

```bash
bun run db:generate   # produit la migration DDL manquante
```

Puis **committer** le `.sql` généré + le `meta/*_snapshot.json` + `_journal.json`.
Vérifier qu'il ne reste **aucune dérive** :

```bash
bun run db:generate   # doit afficher « No schema changes, nothing to migrate »
```

### Données de référence (≠ seed démo)

Le `db:seed` est **exclusif au dev** (jeu de démo complet). Une donnée dont la
**prod a besoin** (ex. un pays de livraison par défaut) ne doit **pas** dépendre du
seed : elle s'ajoute en **migration idempotente**, appendée au `.sql` généré :

```sql
-- Idempotent : rejouable sans doublon ni erreur.
INSERT INTO "country" ("name", "code", "is_shipping_enabled")
VALUES ('France', 'FR', true)
ON CONFLICT ("code") DO NOTHING;
```

## Validation en deux temps

| Étape | Fichier compose | Prouve |
|-------|-----------------|--------|
| **Pré-publication** (sources) | `compose.dev.yaml` | Le working tree migre et boot correctement |
| **Post-publication** (artefact) | `compose.yaml` (`VERSION=x.y.z`) | L'**image publiée** boot en base vierge |

Boucle serrée pré-commit (sans stack complet) : un Postgres jetable + migrate.

```bash
docker run -d --name mig-check -e POSTGRES_USER=echoppe -e POSTGRES_PASSWORD=echoppe \
  -e POSTGRES_DB=echoppe -p 5433:5432 postgres:17-alpine
DATABASE_URL="postgresql://echoppe:echoppe@localhost:5433/echoppe" \
  bun run --cwd packages/core db:migrate       # 0000→N sans erreur
docker rm -f mig-check
```

> ⚠️ Ne jamais migrer/seed une base **de prod** (conteneurs `dpc-*` ou toute
> boutique réelle). Utiliser `echoppe-*` ou un conteneur éphémère jetable.

## Le SDK dérive de l'API

`@echoppe/client` est **généré depuis l'OpenAPI** de l'API (`packages/client/scripts/generate.ts`),
il ne se code pas à la main. Après un changement de contrat storefront :

```bash
# API à jour lancée (source :7533, ou une image via ECHOPPE_API_URL)
bun run --cwd packages/client generate   # regénère openapi.json + types + façade
```

Comme le SDK **dérive** du contrat, corriger l'API réaligne toute la chaîne : un SDK
« en avance » sur des migrations en retard n'est pas un bug SDK, c'est un bug API.

## Checklist de release

- [ ] Schéma changé → `db:generate` + migration committée (**jamais** `push` en prod).
- [ ] Donnée requise en prod → seed **idempotent** dans une migration (pas le `db:seed`).
- [ ] `db:generate` de contrôle → « No schema changes » (aucune dérive résiduelle).
- [ ] Base vierge migrée → `/products/` `200`, `/countries/` non vide.
- [ ] SDK régénéré depuis l'OpenAPI, `type-check` + `build` verts.
- [ ] Changeset ajouté (bump `@echoppe/client`).
- [ ] Push `main` (ouvre la PR « Version Packages ») **et** tag `v x.y.z` (déclenche Docker), même version.
- [ ] Merge de la PR « Version Packages » → publication npm.
- [ ] Images `api` + `admin` + SDK publiés en **cohérence** de version.

## Coordination des déclencheurs

| Déclencheur | Workflow | Effet |
|-------------|----------|-------|
| push `main` + changeset | `release.yml` | Ouvre/maj la PR « Version Packages » (npm) |
| merge PR « Version Packages » | `release.yml` | Publie `@echoppe/client` sur npm |
| push tag `v*` | `docker-build.yml` | Build + push `echoppe-api` / `-admin` (`x.y.z` + `latest`) |

Les deux lignes de version sont **indépendantes** (tags `v*` pour Docker,
`@echoppe/client@x` créés par changesets) mais on les **aligne** sur le même numéro
pour une release donnée.
