# Installation

## Prérequis

- [Bun](https://bun.sh/) >= 1.0
- [Docker](https://www.docker.com/) et Docker Compose
- [Node.js](https://nodejs.org/) >= 20 (pour le store Next.js)

## Installation rapide (Docker)

```bash
# Cloner le projet
git clone https://github.com/your-org/echoppe.git
cd echoppe

# Copier la configuration
cp .env.example .env

# Lancer les services (PostgreSQL, Redis)
docker compose up -d

# Installer les dépendances
bun install

# Initialiser la base de données
bun run db:push --force
bun run db:seed

# Lancer en développement
bun run dev
```

## Accès aux services

| Service | URL | Identifiants |
|---------|-----|--------------|
| API | http://localhost:7532 | - |
| Admin | http://localhost:3211 | admin@echoppe.dev / admin123 |
| Store | http://localhost:3141 | - |
| Swagger | http://localhost:7532/swagger | - |

## Installation en production

### Avec Docker Compose

```bash
# Construire les images
docker compose -f compose.yaml build

# Lancer en production
docker compose up -d
```

### Variables d'environnement requises

Voir la page [Configuration](/guide/configuration) pour la liste complète des variables d'environnement.

## Structure du projet

```
echoppe/
├── apps/
│   ├── api/          # API Elysia
│   ├── admin/        # Dashboard Vue 3
│   └── store/        # Boutique Next.js
├── packages/
│   ├── core/         # DB, schemas, utils partagés
│   └── shared/       # Types partagés
├── docs/             # Cette documentation
└── uploads/          # Fichiers uploadés
```

## Commandes utiles

```bash
# Développement
bun run dev              # Lancer tous les services
bun run dev:api          # API seule
bun run dev:admin        # Admin seul
bun run dev:store        # Store seul

# Base de données
bun run db:push --force  # Appliquer le schéma
bun run db:seed          # Données de test
bun run db:studio        # Interface Drizzle Studio

# Build
bun run build            # Construire tous les services
bun run type-check       # Vérifier les types

# Qualité
bun run lint             # Linter
bun run lint:fix         # Corriger automatiquement
```
