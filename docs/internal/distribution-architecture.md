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

## Publier des packages npm (workflow)

Pour un package isolé :

1. Un `package.json` : `name`, `version`, `exports` (ce qui est exposé), `files`
   (ce qui est publié), `bin` (pour une CLI), `publishConfig.access: "public"`.
2. `npm login` puis `npm publish --access public` (le `--access public` est requis
   pour les packages **scopés** publics comme `@echoppe/*`).

Pour un **monorepo**, outil standard : **[changesets](https://github.com/changesets/changesets)**.
On déclare les changements (« client en mineure »), il bump les versions, génère les
changelogs et publie tous les packages concernés d'un coup. C'est le modèle de Medusa,
Astro, etc.

Nuance de nommage : `@echoppe/client` est **scopé** (scope `@echoppe`) ;
`create-echoppe` est **non-scopé** (comme `create-next-app`).

## Versioning : aligner SDK ↔ API

Le SDK est généré depuis le contrat de l'API → il doit être **versionné en phase avec
les tags Docker de l'API**. Une boutique déployée contre l'API `v0.3` consomme le SDK
`v0.3`. C'est l'intérêt du monorepo : régénération + publication atomiques, versions
cohérentes, tests d'intégration API↔SDK dans la même CI.

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
