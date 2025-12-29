# Échoppe

> Framework e-commerce pour artisans français — 10x plus simple que Shopify

## Déploiement rapide (Docker)

**1. Créez un fichier `docker-compose.yaml` :**

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

**2. Modifiez les 3 valeurs dans la section `api` :**

| Variable | Description |
|----------|-------------|
| `ADMIN_EMAIL` | Votre adresse email pour le compte admin |
| `ADMIN_PASSWORD` | Votre mot de passe (min. 8 caractères) |
| `ENCRYPTION_KEY` | Générez avec `openssl rand -base64 32` |

**3. Lancez :**

```bash
docker compose up -d
```

**URLs :**
- Admin : http://localhost:3211
- Store : http://localhost:3141
- API : http://localhost:7532
- API Docs : http://localhost:7532/docs (OpenAPI/Scalar)

---

## Développement

```bash
# Prérequis : Bun, Docker

# 1. Cloner et installer
git clone https://github.com/Axiome-Apps/echoppe.git
cd echoppe
bun install

# 2. Lancer PostgreSQL + Redis
docker compose up -d

# 3. Initialiser la DB
bun run db:push --force
bun run db:seed

# 4. Lancer le dev
bun run dev
```

**Login dev :** `admin@echoppe.dev` / `admin123`

## Stack

- **Runtime** : Bun
- **API** : Elysia + OpenAPI (documentation interactive sur `/docs`)
- **DB** : PostgreSQL + Drizzle ORM
- **Dashboard** : Vue 3 + Vite + Tailwind 4
- **Store** : Next.js 16

## Structure

```
echoppe/
├── apps/
│   ├── api/          # Backend Elysia
│   ├── admin/        # Dashboard Vue
│   └── store/        # Boutique Next.js
├── packages/
│   ├── core/         # DB + Schema
│   └── shared/       # Types partagés
└── docs/             # Documentation VitePress
```

## Scripts

| Commande | Description |
|----------|-------------|
| `bun run dev` | Lance API + Dashboard + Store |
| `bun run db:push` | Push schema vers DB |
| `bun run db:seed` | Seed données de base |
| `bun run db:studio` | Interface Drizzle Studio |

## License

Private - Axiome
