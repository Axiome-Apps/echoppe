# Échoppe

> Framework e-commerce pour artisans français — 10x plus simple que Shopify

## Déploiement rapide (Docker)

```bash
# Télécharger le fichier compose
curl -O https://raw.githubusercontent.com/Axiome-Apps/echoppe/main/docker-compose.dist.yaml

# Générer la clé de chiffrement
export ENCRYPTION_KEY=$(openssl rand -base64 32)

# Lancer
docker compose -f docker-compose.dist.yaml up -d
```

**URLs :**
- Admin : http://localhost:3211 (`admin@echoppe.dev` / `admin123`)
- Store : http://localhost:3141
- API : http://localhost:7532

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

## Stack

- **Runtime** : Bun
- **API** : Elysia
- **DB** : PostgreSQL + Drizzle ORM
- **Dashboard** : Vue 3 + Vite + Tailwind 4
- **Store** : Next.js 16
- **Validation** : Zod

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
| `bun run dev:api` | API seule |
| `bun run dev:admin` | Dashboard seul |
| `bun run dev:store` | Store seul |
| `bun run db:push` | Push schema vers DB |
| `bun run db:seed` | Seed données de base |
| `bun run db:studio` | Interface Drizzle Studio |

## Images Docker

| Image | Taille |
|-------|--------|
| `axiomeapp/echoppe-api` | ~200MB |
| `axiomeapp/echoppe-admin` | ~50MB |
| `axiomeapp/echoppe-store` | ~180MB |
| `axiomeapp/echoppe-init` | ~155MB |

## Documentation

- [docs/](./docs/) - Documentation VitePress
- [TODO.md](./TODO.md) - Roadmap du projet

## License

Private - Axiome
