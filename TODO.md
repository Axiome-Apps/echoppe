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
- [x] Refactor ProductEditView (splitter en composants)

---

## V1

### Paramètres
- [x] Paramètres boutique (API + Admin) - infos légales, logo, TVA exonéré

### Stock
- [x] Mouvements de stock (API + Admin)
- [x] Alertes rupture / seuil bas

### Adapters (abstractions services tiers)
- [x] Interface PaymentAdapter + implémentations (Stripe, PayPal)
- [x] Interface ShippingAdapter + implémentations (Colissimo, Mondial Relay, Sendcloud)
- [x] Génération factures PDF (Typst, stockage interne)

### Commandes
- [x] Commandes (API + Admin) - création, statuts, historique
- [x] Liaison stock/paiement/livraison

### Auth & Permissions
- [ ] Auth Customer (inscription, login, profil)
- [ ] Permissions RBAC (middleware + admin)

### Front Store
- [ ] Pages vitrine (accueil, catégories, produits)
- [ ] Panier + Checkout
- [ ] Espace client (commandes, adresses)

### Autres
- [ ] Webhooks
- [ ] Notifications email (confirmation commande, expédition, facture client)
- [ ] Export/Import CSV
- [ ] Logs d'audit

### Docker / Déploiement
- [ ] Auto-génération ENCRYPTION_KEY au premier lancement
- [ ] Publier les images sur Docker Hub ou ghcr.io
- [ ] GitHub Actions pour build/push automatique à chaque tag
- [ ] Compose de distribution (images pré-construites)

---

## V2

- [ ] Gestion Users (API + Admin) - CRUD utilisateurs admin
- [ ] Multi-langue
- [ ] SEO avancé
- [ ] Analytics intégrés
- [ ] Doc pas-à-pas webhooks Stripe/PayPal (screenshots)
