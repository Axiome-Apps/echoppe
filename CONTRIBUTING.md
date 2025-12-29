# Contribuer à Échoppe

Merci de votre intérêt pour Échoppe ! Ce guide vous aidera à contribuer au projet.

## Code de conduite

Soyez respectueux et constructif dans toutes vos interactions. Nous souhaitons maintenir un environnement accueillant et inclusif.

## Prérequis

- [Bun](https://bun.sh) (runtime principal)
- [Docker](https://docker.com) (pour PostgreSQL et Redis)

## Installation

```bash
# Cloner le repo
git clone https://github.com/Axiome-Apps/echoppe.git
cd echoppe

# Installer les dépendances
bun install

# Lancer les services
docker compose up -d

# Initialiser la base de données
bun run db:push --force
bun run db:seed

# Lancer le dev
bun run dev
```

**Login dev :** `admin@echoppe.dev` / `admin123`

## Structure du projet

```
echoppe/
├── apps/
│   ├── api/          # Backend Elysia
│   ├── admin/        # Dashboard Vue 3
│   └── store/        # Boutique Next.js
├── packages/
│   ├── core/         # DB + Schema Drizzle
│   └── shared/       # Types partagés
└── docs/             # Documentation VitePress
```

## Conventions de code

### Général

- TypeScript strict, jamais `any` sans type guard
- Fonctions < 20 lignes, fichiers < 200 lignes
- Noms explicites, early returns
- TailwindCSS pour le styling

### API (Elysia)

- Un fichier par ressource dans `apps/api/src/routes/`
- Valider avec `t.Object()` pour body/params
- Sessions + Cookies HTTP-only (pas de JWT)

### Dashboard (Vue 3)

- Atomic Design : `atoms/` → `molecules/` → `organisms/`
- Imports directs pour les composants Vue (pas de barrel files)
- Inférer les types depuis l'API Eden, pas d'interfaces manuelles

### Base de données

- Schema dans `packages/core/src/db/schema/`
- Un fichier par domaine

## Branches

```
feat/nom-feature     # Nouvelles fonctionnalités
fix/description      # Corrections de bugs
docs/sujet           # Documentation
refactor/description # Refactoring
```

## Commits

Utilisez des messages clairs et concis :

```
feat: ajouter le support des variantes produit
fix: corriger le calcul du panier
docs: mettre à jour le guide d'installation
refactor: simplifier la gestion des médias
```

## Pull Requests

1. Créer une branche depuis `main`
2. Faire vos modifications
3. Tester localement avec `bun run dev`
4. Créer une PR avec une description claire
5. Référencer les issues liées si applicable

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `bun run dev` | Lance API + Admin + Store |
| `bun run db:push --force` | Push le schema |
| `bun run db:seed` | Seed les données |
| `bun run db:studio` | Interface Drizzle Studio |

## Signaler un bug

1. Vérifiez que le bug n'est pas déjà signalé
2. Créez une issue avec les étapes de reproduction
3. Incluez les informations système si pertinent

## Proposer une fonctionnalité

1. Ouvrez une issue pour en discuter
2. Expliquez le cas d'usage
3. Attendez la validation avant de coder

## Licence

En contribuant à Échoppe, vous acceptez que vos contributions soient sous licence [CeCILL v2.1](LICENSE).
