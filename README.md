# Échoppe

[![Bun](https://img.shields.io/badge/Bun-1.0+-black.svg)](https://bun.sh/)
[![Elysia](https://img.shields.io/badge/Elysia-1.0-blue.svg)](https://elysiajs.com/)
[![Vue](https://img.shields.io/badge/Vue-3-42b883.svg)](https://vuejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791.svg)](https://www.postgresql.org/)

> Framework e-commerce pour artisans français — Shopify en mieux et gratuit

**[Documentation](https://axiome-apps.github.io/echoppe/)** · **[API Docs](http://localhost:7532/docs)** · **[Contribuer](CONTRIBUTING.md)**

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

### Prérequis

- [Bun](https://bun.sh/) 1.0+
- [Docker](https://docker.com/)

### Installation

```bash
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

### Scripts

| Commande | Description |
|----------|-------------|
| `bun run dev` | Lance API + Dashboard + Store |
| `bun run db:push` | Push schema vers DB |
| `bun run db:seed` | Seed données de base |
| `bun run db:studio` | Interface Drizzle Studio |

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

## Built With

- [Bun](https://bun.sh/) - Runtime JavaScript ultra-rapide
- [Elysia](https://elysiajs.com/) - Framework web TypeScript avec OpenAPI
- [Drizzle ORM](https://orm.drizzle.team/) - ORM TypeScript type-safe
- [Vue 3](https://vuejs.org/) - Framework frontend pour le dashboard
- [Next.js](https://nextjs.org/) - Framework React pour la boutique
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utility-first
- [PostgreSQL](https://www.postgresql.org/) - Base de données relationnelle
- [Redis](https://redis.io/) - Cache et sessions

## Support

- Bug Reports : [GitHub Issues](https://github.com/Axiome-Apps/echoppe/issues)
- Discussions : [GitHub Discussions](https://github.com/Axiome-Apps/echoppe/discussions)

## License

[CeCILL v2.1](LICENSE) - Compatible GNU GPL
