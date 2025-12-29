# Installation

## Déploiement rapide (Production)

### 1. Créez un fichier `docker-compose.yaml`

```yaml
services:
  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: echoppe
      POSTGRES_PASSWORD: echoppe
      POSTGRES_DB: echoppe
    volumes:
      - echoppe-data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U echoppe -d echoppe']
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - echoppe-redis:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 5s
      retries: 5

  init:
    image: axiomeapp/echoppe-init:latest
    environment:
      DATABASE_URL: postgresql://echoppe:echoppe@postgres:5432/echoppe
    depends_on:
      postgres:
        condition: service_healthy
    restart: 'no'

  api:
    image: axiomeapp/echoppe-api:latest
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://echoppe:echoppe@postgres:5432/echoppe
      REDIS_URL: redis://redis:6379
      ADMIN_URL: http://localhost:3211
      STORE_URL: http://localhost:3141
      # === À MODIFIER ===
      ADMIN_EMAIL: admin@example.com        # Votre email
      ADMIN_PASSWORD: votre-mot-de-passe    # Votre mot de passe
      ENCRYPTION_KEY: votre-cle-ici         # Générer avec: openssl rand -base64 32
    ports:
      - '7532:7532'
    volumes:
      - echoppe-uploads:/app/uploads
    depends_on:
      init:
        condition: service_completed_successfully
      redis:
        condition: service_healthy

  admin:
    image: axiomeapp/echoppe-admin:latest
    restart: unless-stopped
    ports:
      - '3211:80'
    depends_on:
      - api

  store:
    image: axiomeapp/echoppe-store:latest
    restart: unless-stopped
    ports:
      - '3141:3000'
    depends_on:
      - api

volumes:
  echoppe-data:
  echoppe-redis:
  echoppe-uploads:
```

### 2. Modifiez les 3 valeurs obligatoires

Dans la section `api.environment`, modifiez :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `ADMIN_EMAIL` | Email du compte administrateur | `jean@maboutique.fr` |
| `ADMIN_PASSWORD` | Mot de passe (min. 8 caractères) | `MonSuperMotDePasse!` |
| `ENCRYPTION_KEY` | Clé de chiffrement AES-256 | Voir ci-dessous |

::: tip Générer la clé de chiffrement
```bash
openssl rand -base64 32
```
Copiez le résultat et collez-le comme valeur de `ENCRYPTION_KEY`.
:::

### 3. Lancez

```bash
docker compose up -d
```

::: info Premier démarrage
- Les migrations sont automatiquement appliquées
- Le compte admin est créé avec vos identifiants
- Les images sont téléchargées depuis Docker Hub (~600MB au total)
:::

### Accès aux services

| Service | URL |
|---------|-----|
| **Admin** | http://localhost:3211 |
| **Store** | http://localhost:3141 |
| **API** | http://localhost:7532 |
| **API Docs** | http://localhost:7532/docs |

### Variables optionnelles

Pour changer les ports ou les URLs :

```yaml
environment:
  ADMIN_URL: https://admin.maboutique.fr   # URL publique de l'admin
  STORE_URL: https://maboutique.fr         # URL publique du store
ports:
  - '8080:7532'  # Changer le port exposé
```

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

**Login dev :** `admin@echoppe.dev` / `admin123`

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
