# Échoppe

> Framework e-commerce pour artisans français — 10x plus simple que Shopify

## Quick Start

```bash
# Prérequis : Bun, Docker

# 1. Cloner et installer
bun install

# 2. Lancer PostgreSQL
bun run docker:up

# 3. Push schema + seed
bun run db:push --force
bun run db:seed

# 4. Lancer le dev
bun run dev
```

**URLs :**
- API : http://localhost:8000
- Dashboard : http://localhost:3000

**Login dev :** `admin@echoppe.dev` / `admin123`

## Stack

- **Runtime** : Bun
- **API** : Elysia
- **DB** : PostgreSQL + Drizzle ORM
- **Dashboard** : Vue 3 + Vite + Tailwind 4
- **Validation** : Zod

## Structure

```
echoppe/
├── apps/
│   ├── api/          # Backend Elysia
│   └── admin/        # Dashboard Vue
├── packages/
│   ├── core/         # DB + Schema
│   └── shared/       # Types partagés
└── docs/             # Documentation
```

## Scripts

| Commande | Description |
|----------|-------------|
| `bun run dev` | Lance API + Dashboard |
| `bun run dev:api` | API seule |
| `bun run dev:admin` | Dashboard seul |
| `bun run db:push` | Push schema vers DB |
| `bun run db:seed` | Seed données de base |
| `bun run db:studio` | Interface Drizzle Studio |
| `bun run lint` | Lint tout le projet |

## Documentation

- [TODO.md](./TODO.md) - Roadmap du projet
- [CLAUDE.md](./CLAUDE.md) - Context pour Claude Code
- [docs/echoppe-schema.dbml](./docs/echoppe-schema.dbml) - Schema DB

## License

Private - Axiome
