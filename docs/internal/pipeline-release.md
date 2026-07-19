# Pipeline de release & gardes anti-dérive

Point d'entrée unique de la mécanique de publication. Le **comment** pas-à-pas vit dans
[`docs/dev/releasing.md`](../dev/releasing.md) ; les **invariants + post-mortem** dans
[`release-runbook.md`](./release-runbook.md) ; le détail **npm/changesets** dans
[`distribution-architecture.md`](./distribution-architecture.md). Ici : la **vue d'ensemble** qui les
relie.

## En une phrase

Échoppe publie **deux artefacts coordonnés** (SDK npm `@echoppe/client` + images Docker
`echoppe-api`/`-admin`) à la **même version**, en **un seul acte humain** : le **merge de la PR
« Version Packages »**. La version n'est jamais saisie à la main — elle est **dérivée du niveau de
bump** du changeset.

## Le curseur unique : le niveau de bump

Tout part du niveau déclaré dans le changeset (`patch` | `minor` | `major`) appliqué à la version
courante de `@echoppe/client` :

```
version client (0.4.0)  +  niveau changeset  →  nouvelle version  →  tag v*  →  version images
```

- `api`/`admin` ne sont **pas** versionnés par changesets (`privatePackages.version: false`) → leur
  numéro **est** ce `v x.y.z` dérivé, appliqué par le job `images`. Un seul curseur pilote les trois.
- **0.x** : un changement **cassant = `minor`** (le `major` est réservé au passage 1.0). Mode pre
  changesets **désactivé** → versions propres (`0.5.0`, pas `-next.N`), publiées sur le dist-tag
  `next`.
- Raccourci : `bun run ship "résumé"` crée le changeset au niveau `BUMP` (défaut `minor`), committe,
  pousse `main`. `BUMP=major` / `BUMP=patch` pour dévier. `--dry` pour l'aperçu.

## Le flux one-move

```
bun run ship "…"  (ou changeset committé + git push main)
        │
        ▼
 push main ──► release.yml ──► PR « Version Packages » (bump + CHANGELOG)   [aucune publication]
                                      │
                                  MERGE  ◄── unique acte humain
                                      │
                        release.yml (re-run sur main) :
                          1. changesets publish → npm @x.y.z
                          2. tag v x.y.z (traçage ; GITHUB_TOKEN → ne re-déclenche rien)
                          3. job `images` ──workflow_call──► docker-build.yml
                                                               ├─ gate T2–T5 (base vierge, upgrade,
                                                               │   contrat, idempotence)
                                                               └─ push images :x.y.z + :latest
```

Échappatoire manuelle : un `push` de tag `v*` déclenche `docker-build.yml` seul (re-cut d'images hors
release npm). C'est un secours, pas la voie normale.

## Les gardes anti-dérive

Chaque garde attrape une classe de « faux vert » **le plus tôt possible**.

| Garde | Où | Attrape |
|-------|-----|---------|
| **Drift Drizzle** (T1) | `ci.yml` (PR/push) | schéma TS modifié sans migration générée (`db:generate` + `git diff`) — cause de l'incident 0.4.0 |
| **Drift contrat** | `ci.yml` (PR/push) | route changée sans SDK figé régénéré (`contracts:check` : régénère depuis l'app pure + `git diff` sur les types) — dès la PR, plus seulement au gate T4 |
| **Validation env** | boot API (`env.ts`) | config incomplète (`DATABASE_URL`, `ENCRYPTION_KEY`) → refus au démarrage avec message clair, avant crash cryptique |
| **Gate image T2–T5** | `docker-build.yml` (`integration` needs `build-and-push`) | image cassée : base vierge (T2), upgrade depuis `:latest` (T3), parité contrat (T4), idempotence seeds (T5) — aucune image ne part si un test casse |

Invariant transverse : **la vérité de prod = les migrations committées appliquées à l'image
publiée**, jamais `db:push` (dev only). Cf. [`release-runbook.md`](./release-runbook.md).

## Commandes

| Commande | Rôle |
|----------|------|
| `bun run contracts` | régénère le SDK figé depuis l'app pure offline (remplace le boot `:7533` manuel) |
| `bun run contracts:check` | idem + échoue si les types divergent des routes (garde CI) |
| `bun run ship "msg"` | cut une release au niveau `BUMP` (défaut `minor`) → changeset + push `main` |
| `bun run --cwd apps/api test:integration` | rejoue le gate T2–T5 en local |
| `bun run --cwd apps/api test:smoke` | smoke source-level (base jetable) |

## Checklist minimale

1. Travail committé, `type-check` + `lint` + `smoke` verts.
2. Schéma changé → migration committée (`db:generate`, diff propre).
3. Contrat changé → `bun run contracts` committé.
4. `bun run ship "résumé"` (ou push d'un changeset déjà committé).
5. **Merge de la PR** → npm + images à la version dérivée. Fin.
