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
- [x] Auth Customer (inscription, login, profil)
- [x] Permissions RBAC (middleware + admin)

### Front Store
- [x] Setup Next.js 16 + React 19 + Tailwind 4
- [x] API Cart (routes Elysia, sessions anonymes/client)
- [x] Composants réutilisables (Button, Input, Price, Badge, ProductCard, etc.)
- [x] Header/Footer + Providers (Cart, Auth)
- [x] Pages: accueil, catalogue, détail produit, panier
- [x] Auth client: connexion, inscription
- [x] Espace client: dashboard, commandes, adresses, profil
- [x] Pages catégories (/categories, /categories/[slug])
- [x] Pages collections (/collections, /collections/[slug])
- [x] Header amélioré (menu catégories, badge panier, état auth, autocomplétion recherche)
- [x] Fil d'ariane (breadcrumb)
- [x] Recherche produits (API + composants)
- [x] Filtres et tri catalogue (catégorie, prix, stock, tri)
- [x] Pages légales (CGV, mentions légales, contact)
- [x] Endpoint API pour formulaire de contact (envoi email)
- [x] Checkout (tunnel paiement)
- [x] Documentation API Headless
- [ ] Doc SDK

### Clients
- [x] Gestion Customers (Admin) - liste, détail, désactivation, anonymisation RGPD

### API Documentation
- [x] Helper pour ajouter les réponses d'erreur communes (401/400/500) automatiquement dans OpenAPI

### Users
- [x] Gestion Users (API + Admin) - CRUD utilisateurs admin

### Autres
- [x] Notifications email (confirmation commande, expédition, welcome)
- [x] Logs d'audit + nettoyage RBAC ([plan détaillé](docs/audit-rbac-plan.md))

### Documentation
- [x] Documentation POC (VitePress)
- [ ] Contenu exhaustif + images / vidéos

### UI/UX
- [ ] Polish UI/UX Admin/Store

### Sécurité
**Critique**
- [x] Rate limiting sur login/register/checkout (Redis + elysia-rate-limit)

**Haute**
- [x] Vérification propriétaire sur `/payments/checkout`
- [x] Décrémentation stock atomique au paiement réussi (transaction DB)
- [x] Cleanup job commandes expirées (>1h → cancelled)

**Moyenne**
- [x] Whitelist domaines pour URLs de redirection (open redirect)
- [x] SameSite=strict sur cookies session (admin + customer)
- [ ] Vérification signature webhook PayPal

**Basse**
- [x] Réduire durée session (30j → 7j + refresh token)
- [x] Vérification User-Agent sur sessions admin + customer (+ log IP changes)
- [x] Logger structuré pour erreurs webhook

### Docker / Déploiement
- [ ] Auto-génération ENCRYPTION_KEY au premier lancement
- [ ] Publier les images sur Docker Hub ou ghcr.io
- [ ] GitHub Actions pour build/push automatique à chaque tag
- [ ] Compose de distribution (images pré-construites)

---

## V2

- [ ] Export/Import CSV
- [ ] Webhooks sortants (notifications externes, intégration Zapier/n8n/Make)
- [ ] Conformité RGPD (bannière cookies, CGU/CGV personnalisables, consentement)
- [ ] Page builder intégré (blocs, drag & drop, génération Next.js)
- [ ] Stats / Dashboard insight (CA, top produits, tendances)
- [ ] Mode caisse simplifié (vente rapide en boutique/marché)
- [ ] Multi-langue
- [ ] SEO avancé
- [ ] Analytics intégrés
- [ ] Doc pas-à-pas webhooks Stripe/PayPal (screenshots)
