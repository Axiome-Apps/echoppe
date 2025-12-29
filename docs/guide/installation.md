# Installation

## Déploiement rapide (Production)

Déployez Échoppe en 3 commandes :

```bash
# Télécharger le fichier compose
curl -O https://raw.githubusercontent.com/Axiome-Apps/echoppe/main/docker-compose.dist.yaml

# Générer la clé de chiffrement (obligatoire)
export ENCRYPTION_KEY=$(openssl rand -base64 32)

# Lancer tous les services
docker compose -f docker-compose.dist.yaml up -d
```

::: tip Premier démarrage
Les migrations sont automatiquement appliquées et un compte admin est créé avec les identifiants par défaut.
:::

### Accès aux services

| Service | URL | Identifiants |
|---------|-----|--------------|
| Admin | http://localhost:3211 | `admin@echoppe.dev` / `admin123` |
| Store | http://localhost:3141 | - |
| API | http://localhost:7532 | - |
| API Docs | http://localhost:7532/docs | - |

### Variables d'environnement

Personnalisez votre installation avec ces variables :

```bash
# Obligatoire
export ENCRYPTION_KEY=$(openssl rand -base64 32)

# Optionnel - personnaliser l'admin
export ADMIN_EMAIL=mon@email.com
export ADMIN_PASSWORD=monsupermotdepasse

# Optionnel - changer les ports
export API_PORT=8080
export ADMIN_PORT=8081
export STORE_PORT=8082

# Lancer
docker compose -f docker-compose.dist.yaml up -d
```

### Images Docker

| Image | Taille | Description |
|-------|--------|-------------|
| `axiomeapp/echoppe-api` | ~200MB | API Elysia (binaire compilé) |
| `axiomeapp/echoppe-admin` | ~50MB | Dashboard Vue (Caddy + static) |
| `axiomeapp/echoppe-store` | ~180MB | Boutique Next.js |
| `axiomeapp/echoppe-init` | ~155MB | Migrations Drizzle |

---

## Installation développement

### Prérequis

- [Bun](https://bun.sh/) >= 1.0
- [Docker](https://www.docker.com/) et Docker Compose

### Étapes

```bash
# 1. Cloner le projet
git clone https://github.com/Axiome-Apps/echoppe.git
cd echoppe

# 2. Installer les dépendances
bun install

# 3. Copier la configuration
cp .env.example .env

# 4. Lancer PostgreSQL + Redis
docker compose up -d

# 5. Initialiser la base de données
bun run db:push --force
bun run db:seed

# 6. Lancer en développement
bun run dev
```

### Commandes utiles

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
```

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
