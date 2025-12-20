# Échoppe - Roadmap

## MVP (En cours)

### API
- [x] Setup monorepo Bun workspaces
- [x] PostgreSQL + Drizzle ORM (35 tables, 12 enums)
- [x] Auth Admin (sessions + cookies HTTP-only)
- [x] CRUD Categories
- [x] CRUD Products (variantes, options, médias)
- [x] CRUD Collections
- [x] Upload & gestion médias

### Dashboard
- [x] Setup Vue 3 + Vite + Tailwind 4
- [x] Eden client type-safe
- [x] Login + Layout admin
- [x] Pages produits/catégories/collections
- [x] Médiathèque (upload, dossiers, drag & drop)
- [ ] Refactor ProductEditView (splitter en composants)

---

## V1

### Paramètres & Users
- [ ] Paramètres boutique (API + Admin) - infos légales, devise, TVA
- [ ] Gestion Users (API + Admin) - CRUD utilisateurs admin

### Stock
- [x] Mouvements de stock (API + Admin)
- [x] Alertes rupture / seuil bas

### Adapters (abstractions services tiers)
- [x] Interface PaymentAdapter + implémentations (Stripe, PayPal)
- [ ] Interface ShippingAdapter + implémentations (Colissimo, Mondial Relay)
- [ ] Interface InvoiceAdapter + implémentation (Pennylane)

### Commandes
- [ ] Commandes (API + Admin) - création, statuts, historique
- [ ] Liaison stock/paiement/livraison

### Auth & Permissions
- [ ] Auth Customer (inscription, login, profil)
- [ ] Permissions RBAC (middleware + admin)

### Front Store
- [ ] Pages vitrine (accueil, catégories, produits)
- [ ] Panier + Checkout
- [ ] Espace client (commandes, adresses)

### Autres
- [ ] Webhooks
- [ ] Notifications email
- [ ] Export/Import CSV
- [ ] Logs d'audit

### Docker / Déploiement
- [ ] Publier les images sur Docker Hub ou ghcr.io
- [ ] GitHub Actions pour build/push automatique à chaque tag
- [ ] Compose de distribution (images pré-construites)

---

## V2

- [ ] Multi-langue
- [ ] SEO avancé
- [ ] Analytics intégrés
