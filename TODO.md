# Échoppe - Roadmap

## MVP (En cours)

### API
- [x] Setup monorepo Bun workspaces
- [x] PostgreSQL + Drizzle ORM (35 tables, 12 enums)
- [x] Auth Admin (sessions + cookies HTTP-only)
- [x] CRUD Categories
- [x] CRUD Products
- [x] CRUD Collections
- [x] Upload & gestion médias
- [ ] Permissions RBAC
- [ ] Validation Zod sur toutes les routes

### Dashboard
- [x] Setup Vue 3 + Vite + Tailwind 4
- [x] Eden client type-safe
- [x] Login + Layout admin
- [x] Pages produits/catégories/collections
- [x] Médiathèque (upload, dossiers, drag & drop)
- [ ] CRUD complet produits (variantes, options, prix)
- [ ] Paramètres boutique

---

## V1

### Intégrations
- [ ] Payment Adapters (Stripe, PayPal)
- [ ] Shipping Adapters (Colissimo, Mondial Relay)
- [ ] Invoice Adapters (Pennylane)

### Features
- [ ] Auth Customer
- [ ] Webhooks
- [ ] Notifications email
- [ ] Export/Import CSV
- [ ] Logs d'audit

---

## V2

- [ ] Front Store (headless ou templates)
- [ ] Panier + Checkout
- [ ] Multi-langue
- [ ] SEO
