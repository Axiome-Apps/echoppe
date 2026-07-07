# Architecture de distribution & découpage repo

> Document interne de cadrage. Décrit comment Échoppe est (et sera) distribué, et
> comment les couches se répartissent entre repos et artefacts publiés.

## Vision produit

Un framework e-commerce **clé en main « à la Medusa »** :

1. **Backend déployable** (API + Dashboard) — l'artisan/le dev le fait tourner.
2. **Front agnostique** — n'importe quelle techno front, qui se connecte via l'API.
3. **CLI de scaffolding one-shot** façon `create-next-app` — `create-echoppe`.

## Deux canaux de distribution : Docker et npm

Ils ne se remplacent pas, ils sont **complémentaires**.

| | **Docker Hub** | **npm** |
|---|---|---|
| Distribue | des **images = applications qui tournent** | du **code = librairies à intégrer** |
| Sert à | **déployer/faire tourner** le backend | **consommer du code** dans un projet |
| Public | celui qui **héberge** Échoppe | celui qui **développe un front / scaffolde** |
| Analogie | le serveur PostgreSQL qu'on lance | le driver `pg` qu'on installe |
| État | ✅ en place (`axiomeapp/echoppe-*`) | ❌ à créer (SDK + CLI) |

Docker fait *tourner* le backend ; npm *outille* le développement du front. Docker
ne peut pas fournir un client à importer dans un projet Astro → npm est indispensable.

Référence : **Medusa** fait exactement cette séparation — backend déployable +
`@medusajs/js-sdk` (npm) + `create-medusa-app` (npm).

## Idée reçue à lever : un package npm n'est PAS un repo

`npm publish` envoie au registre le **contenu d'un dossier qui contient un
`package.json`**. Le repo Git n'a aucun rôle : au mieux un champ `repository`
optionnel, purement informatif.

- **1 repo peut publier 0, 1 ou N packages.**
- C'est le `package.json` qui définit un package, pas le repo.
- Analogie : le registre npm est une bibliothèque, chaque package un livre, un
  monorepo une maison d'édition qui publie plusieurs livres.

Conséquence : l'**indépendance des artefacts** (chaque couche installable séparément)
se joue au niveau **package**, pas au niveau **repo**. Un monorepo suffit.

## Structure monorepo cible

```
echoppe/                           ← 1 seul repo Git (le framework)
├─ apps/
│  ├─ api/                         → image Docker  echoppe-api      (runtime)
│  └─ admin/                       → image Docker  echoppe-admin    (runtime)
├─ packages/
│  ├─ core/          name:@echoppe/core           (privé, interne)
│  ├─ shared/        name:@echoppe/shared          (privé, interne)
│  ├─ client/        name:@echoppe/client         → npm publish  (SDK)
│  └─ create-echoppe/ name:create-echoppe (bin)   → npm publish  (CLI)
└─ examples/
   └─ store-astro/                 exemple de front (non publié)
```

- **Framework** (API + Dashboard) → distribué en **images Docker**.
- **SDK** (`@echoppe/client`) → **npm**. Généré depuis l'OpenAPI de l'API.
- **CLI** (`create-echoppe`) → **npm**. Wizard de scaffolding.
- **Template** (`examples/store-astro`) → exemple de référence, testé en CI.
- **Boutique réelle** → **repo séparé, hors monorepo** (voir plus bas).

→ **2 repos au total** (framework + boutique), pas un par couche. Le monorepo publie
plusieurs packages npm distincts + plusieurs images Docker.

## Le contrat API : Eden (interne) vs OpenAPI (externe)

Comment un front obtient les types/le client de l'API :

| Option | Pour | Pros | Cons |
|---|---|---|---|
| **A. Types Eden `@echoppe/api`** | **Dashboard interne** (co-versionné) | DX max, inférence directe | couplage de version fort, TS-only |
| **B. SDK npm généré depuis OpenAPI** (`@echoppe/client`) | **Boutiques externes** (reco) | versionnable, découplé, propre | une étape de génération |
| **C. Génération locale depuis `openapi.json` déployé** | fronts non-TS / zéro dépendance | découplage total, multi-langage | pas de SDK prêt à l'emploi |

Décision de principe : **Eden reste pour le dashboard interne** (dans le monorepo,
co-versionné) ; **SDK OpenAPI (B) pour les boutiques externes**. Échoppe expose déjà
OpenAPI (Scalar sur `/docs`), la matière est là.

## La boutique réelle vit dans son propre repo

Règle non négociable : une **boutique client est un consommateur du framework**, pas
un morceau de lui. Elle vit dans un **repo Astro autonome** qui :

- dépend de `@echoppe/client` (npm),
- parle à l'API déployée (Docker) via **URL + SDK**,
- est scaffoldée par `create-echoppe`.

La mettre dans le monorepo framework coupleraient le framework à du code client → à
proscrire.

## La CLI `create-echoppe`

`npm create echoppe@latest` (package npm avec un `bin`) :

1. Wizard : nom du projet, techno front (**Astro** par défaut), URL de l'API, options.
2. Scaffold un **repo boutique Astro** préconfiguré, avec `@echoppe/client` installé.
3. Optionnel : proposer de lancer le backend Docker (`docker compose up`).

## Publier des packages npm (workflow) — **changesets câblé**

Deux paquets publiables : `@echoppe/client` (scopé) et `create-echoppe` (non-scopé,
comme `create-next-app`). Tous les autres workspaces sont `private: true` → ignorés.

**Outillage en place** ([changesets](https://github.com/changesets/changesets)) :

- `.changeset/config.json` : `access: public`, `privatePackages.version: false`
  (changesets ne touche QUE les 2 paquets publiables).
- Scripts racine : `bun run changeset` (déclarer un changement), `bun run
  version-packages` (`changeset version` → bump + CHANGELOG), `bun run release`
  (`scripts/release.sh` : build des 2 paquets + `changeset publish`).
- Publier : `npm login` **une fois**, puis `bun run release`. Le `publishConfig.access:
  public` de chaque paquet gère le `--access public` des scopés.

### Politique de versions (actée)

**Contrainte changesets** : en mode pre, le dist-tag **est** l'identifiant du pre
(impossible de le surcharger — `--tag` est refusé en pre mode). On ne peut donc pas
avoir des versions `-alpha.N` **et** un tag `next`. On tranche pour **un canal `next`
stable** : identifiant = `next` → versions **`-next.N`**, tag **`next`**. La maturité
(alpha/beta/rc) se raconte dans le **CHANGELOG**, pas dans le numéro. C'est le modèle
`@next` de Next.js / Astro.

- **Pré-1.0** : `changeset pre enter next` → versions `0.1.0-next.N`, `0.2.0-next.N`…
  publiées sur **`next`** (opt-in : `npm install @echoppe/client@next`). **Rien sur
  `latest`** → `npm install` nu échoue, c'est voulu.
- **1.0.0** : `changeset pre exit` → plus de suffixe → publié sur **`latest`**. Ensuite
  semver normal (1.0.1, 1.1.0…). `scripts/release.sh` = juste `changeset publish` :
  changesets choisit le tag automatiquement selon le mode.
- **Majeur suivant** : `pre enter next` à nouveau (`2.0.0-next.N` sur `next`), puis stable.

Point de départ : les 2 paquets à **`0.1.0-next.0`**, mode pre `next` actif.

Conséquence sur la CLI : pendant le 0.x, le template référence `@echoppe/client@next`
(pas `latest`, qui n'existe pas encore). À basculer sur un caret `^1.0.0` au palier 1.0.

## Versioning : aligner SDK ↔ API

Le SDK est généré depuis le contrat de l'API → il doit être **versionné en phase avec
l'API**. Une boutique déployée contre l'API `v0.3` consomme le SDK `0.3.x`. C'est
l'intérêt du monorepo : régénération + publication atomiques, versions cohérentes.

## Ordre de réalisation

1. **Stabiliser l'OpenAPI** de l'API (le contrat).
2. **`@echoppe/client`** (SDK OpenAPI) → publié npm.
3. **`examples/store-astro`** (template Astro, remplace `apps/store` Next).
4. **`create-echoppe`** (CLI) → scaffold depuis le template + installe le SDK.
5. Première **boutique réelle** = repo Astro externe généré par la CLI.

## Points ouverts

- Contrat externe : SDK publié (**B**) vs génération locale depuis `openapi.json` (**C**).
- Template : interne (`examples/`) vs starter clonable sorti du repo.
- Sort de `apps/store` (Next, obsolète vs choix Astro) : figer comme exemple /
  remplacer par Astro / supprimer.
- Alignement des versions SDK ↔ tags Docker de l'API (stratégie de release).
