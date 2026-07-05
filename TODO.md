# Échoppe - Roadmap

## V1

### API
- [x] Setup monorepo Bun workspaces
- [x] PostgreSQL + Drizzle ORM (35 tables, 12 enums)
- [x] Auth Admin (sessions + cookies HTTP-only)
- [x] CRUD Categories
- [x] CRUD Products (variantes, options, médias)
- [x] CRUD Collections
- [x] Upload & gestion médias
- [x] Helper réponses d'erreur communes (401/400/500) dans OpenAPI

### Dashboard
- [x] Setup Vue 3 + Vite + Tailwind 4
- [x] Eden client type-safe
- [x] Login + Layout admin
- [x] Pages produits/catégories/collections
- [x] Médiathèque (upload, dossiers, drag & drop)
- [x] Refactor ProductEditView (splitter en composants)

### Paramètres
- [x] Paramètres boutique (API + Admin) - infos légales, logo, TVA exonéré

### Stock
- [x] Mouvements de stock (API + Admin)
- [x] Alertes rupture / seuil bas

### Adapters
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

### Clients
- [x] Gestion Customers (Admin) - liste, détail, désactivation, anonymisation RGPD

### Users
- [x] Gestion Users (API + Admin) - CRUD utilisateurs admin

### Notifications
- [x] Notifications email (confirmation commande, expédition, welcome)
- [x] Logs d'audit + nettoyage RBAC ([plan détaillé](docs/audit-rbac-plan.md))

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
- [x] ⚠️ Vérifier SameSite cookies admin (audit a trouvé `lax` dans `auth.ts:116` vs `strict` attendu)
- [x] Vérification signature webhook PayPal

**Basse**
- [x] Réduire durée session (30j → 7j + refresh token)
- [x] Vérification User-Agent sur sessions admin + customer (+ log IP changes)
- [x] Logger structuré pour erreurs webhook

### Docker / Déploiement
- [x] Dockerfile monorepo optimisé (API ~200MB, Admin ~50MB, Store ~180MB, Init ~155MB)
- [x] Publier les images sur Docker Hub (axiomeapp/echoppe-*)
- [x] GitHub Actions pour build/push automatique à chaque tag
- [x] GitHub Actions pour déployer la doc VitePress sur GitHub Pages
- [x] Compose de distribution (docker-compose.dist.yaml)
- [x] Auto-migrations au premier lancement (container init)
- [x] Création admin via variables d'environnement
- [x] Documentation en ligne : https://axiome-apps.github.io/echoppe/

### Documentation
- [x] Documentation POC (VitePress)
- [x] Documentation API interactive (Scalar sur `/docs`)

**Captures d'écran**
- [ ] Screenshots interface admin (produits, commandes, médiathèque, paramètres)
- [ ] Screenshots parcours client store

**Guides providers**
- [ ] Guide setup Stripe (clés API, webhooks, test mode)
- [ ] Guide setup PayPal (credentials, webhooks)
- [ ] Guide setup Colissimo (API, étiquettes)
- [ ] Guide setup Mondial Relay (points relais)
- [ ] Guide setup Sendcloud (multi-transporteurs)
- [ ] Guide setup email (Resend, Brevo, SMTP)

**Documentation technique**
- [ ] Doc SDK Eden (installation, usage, exemples)
- [ ] Guide déploiement production (reverse proxy Nginx/Caddy, SSL, backups)
- [ ] FAQ / Troubleshooting (erreurs courantes, debug)

**Corrections**
- [ ] Fixer lien mort `/admin/providers` dans installation.md
- [ ] Clarifier URL doc API (`{API_URL}/docs` avec Scalar)

### Refactoring / Qualité de code
**Urgent**
- [x] Refactoriser `POST /checkout` (229 lignes → extraire 6-7 fonctions)
- [x] Supprimer les `as any` dans `VariantModal.vue` (lignes 183, 212, 283)

**Important**
- [ ] Fallback in-memory si Redis down au lieu de désactiver le rate limiting (`rate-limit.ts:26`)
- [ ] Extraire `enrichProductsWithMediaAndVariants()` (dupliqué dans categories.ts, collections.ts, products.ts)
- [ ] Centraliser les schémas `productListSchema` et `defaultVariantSchema` dans `schemas/product.ts`
- [ ] Rate limiting sur webhooks Stripe/PayPal (`payments.ts:307-378`)

**Recommandé**
- [ ] Remplacer les `console.log/error` par un logger structuré (pino) - 17 occurrences
- [ ] Refactoriser `GET /orders/:id/invoices/:invoiceId/pdf` (77 lignes)
- [ ] Refactoriser `handleVariantReorder` dans `useProductVariants.ts` (43 lignes)
- [ ] Uniformiser les messages d'erreur API (français vs anglais)
- [ ] Inférer le type `Invoice` depuis Eden dans `OrderDetailView.vue` au lieu d'interface manuelle

### Stock & Concurrence (refonte — décidé)
> Décrément "atomique" (l.77) transactionnel mais **sans garde** → survente possible. **Stratégie retenue : capture manuelle Stripe + garde atomique Postgres** (boutiques Échoppe = beaucoup de pièces uniques → collisions fréquentes sur le dernier/seul exemplaire). L'autorisation Stripe remplace le système de réservation maison. BullMQ écarté (surdimensionné).

**Bug (prioritaire — base de tout le reste)**
- [x] Survente non bloquée — garde `WHERE quantity >= qty` + `.returning()` (rollback si insuffisant) dans `handlePaymentResult` (`payments.ts`).
- [x] Idempotence webhook — court-circuit `payment.status === 'completed'` + verrou `FOR UPDATE` avec recontrôle (bloque le double décrément sur rejeu/concurrence).

**Socle décidé — capture manuelle (obligatoire)**
- [x] Checkout Session avec `payment_intent_data.capture_method: 'manual'` (`stripe.ts`) → autorisation seule, pas de débit.
- [x] Webhook : décrément atomique **gardé** → OK `paymentIntents.capture()` + commande `confirmed` ; KO `paymentIntents.cancel()` + `cancelled` (**client jamais débité**). PayPal (pas de capture manuelle) → fallback `refund()`.
- [ ] Page retour (`success_url`) pilotée par le **statut réel de la commande** (pas l'URL Stripe) : succès, ou feedback "rupture — vous n'avez pas été débité". → **côté front (store)**, pas encore fait.
- [x] Retirer l'échafaudage réservation mort : colonne `variant.reserved` supprimée (`catalog.ts`) + calculs `quantity - reserved` → `quantity` (`cart.ts`, `services/checkout.ts`, `products.ts`). **Nécessite `bun run db:push --force` pour dropper la colonne en DB.**
- [ ] (optionnel) Valeur d'enum `stockMove: 'reservation'` laissée en place (inoffensive, jamais émise) — retrait = migration d'enum PG, non prioritaire.
- [ ] ⚠️ **Prérequis avant prod** : tester le nouveau flux en mode test Stripe (`stripe listen` + `stripe trigger checkout.session.completed`). Sans capture au webhook, un paiement resterait autorisé sans jamais être débité.

**À cadrer — moyens de paiement (capture différée non universelle)**
- [x] État actuel : Stripe = carte only (`payment_method_types: ['card']`) → capture manuelle 100 % compatible. Rien à changer tant que carte only.
- [ ] Si ajout SEPA / BNPL (Klarna...) plus tard : n'activer que les moyens compatibles capture manuelle, OU fallback capture immédiate + refund.
- [x] PayPal : laissé en capture immédiate + refund-à-l'échec (fallback). Authorize/capture PayPal → à explorer si besoin.

**Écarté**
- [ ] ~~Réservation maison (`reserved` + TTL + job)~~ → remplacé par l'autorisation Stripe.
- [ ] ~~BullMQ / Queue-Based Load Leveling~~ → sauf drops massifs (non pertinent artisan). Infra Redis déjà là (`ioredis` + compose) si besoin futur.

### UI/UX
- [ ] Revoir les espacements et alignements sur le dashboard admin
- [ ] Améliorer les feedbacks visuels (loading states, toasts)
- [ ] Responsive mobile sur le store

---

## V2

### Distribution & découpage repo (framework / template / SDK / CLI)
> Objectif : framework clé en main « à la Medusa » + front agnostique + CLI wizard `create-echoppe`. **Détail complet : [`docs/internal/distribution-architecture.md`](docs/internal/distribution-architecture.md).** Docker = runtime backend (déjà là) ; npm = SDK + CLI (à créer). Monorepo = plusieurs packages npm publiés depuis 1 repo (pas 1 repo/couche).

- [ ] `@echoppe/client` — SDK TS généré depuis l'OpenAPI, publié npm, versionné en phase avec les tags Docker de l'API (Eden reste pour le dashboard interne)
- [ ] `examples/store-astro` — template front Astro (remplace `apps/store` Next, obsolète vs choix Astro)
- [ ] `create-echoppe` — CLI wizard (npm) : scaffold une boutique Astro + SDK configuré + option lancer le backend Docker
- [ ] Première boutique réelle = **repo Astro hors monorepo**, généré par la CLI, parle à l'API via le SDK
- [ ] Trancher : contrat externe SDK publié (B) vs génération locale depuis `openapi.json` (C) ; template interne (`examples/`) vs starter sorti

### Tests
- [ ] Tests unitaires services critiques (checkout, payments, stock) - `bun:test`
- [ ] Tests e2e parcours client (inscription → panier → checkout → paiement) - Playwright
- [ ] Tests API endpoints critiques
- [ ] Tests webhooks avec Stripe CLI (`stripe listen --forward-to`)
- [ ] Mocks PayPal webhooks

### Onboarding simplifié (réduction friction providers)

**Paiement OAuth (plus de clés API manuelles)**
- [ ] Stripe Connect : OAuth flow, l'artisan connecte son compte en 1 clic
- [ ] PayPal Commerce Platform : Partner Referrals API, même principe
- [ ] Configuration webhook automatique à la connexion

**Shipping OAuth (si APIs disponibles)**
- [ ] Explorer API partenaires Colissimo / Mondial Relay / Sendcloud

### Installeur desktop (Tauri)
> App native pour lancer Échoppe en local sans toucher au terminal

- [ ] Scaffold app Tauri (Rust backend, Vue/React frontend)
- [ ] Détection/installation Docker (ou Colima/Podman)
- [ ] Pull automatique des images Échoppe
- [ ] Wizard configuration .env (visuel, pas de fichier à éditer)
- [ ] Dashboard : logs, status containers, health checks
- [ ] Backup/restore DB en 1 clic
- [ ] Mise à jour Échoppe (pull nouvelles images)
- [ ] Optionnel : déploiement distant via SSH sur VPS

### Store : Thèmes & Personnalisation
- [ ] Système de thèmes (structure, variables CSS, assets)
- [ ] 2-3 thèmes de base (minimal, artisan, moderne)
- [ ] Sélecteur de thème dans l'admin
- [ ] Preview thème avant activation

### Store : Page Builder
- [ ] Architecture blocs réutilisables (hero, grille produits, texte, image, CTA...)
- [ ] Éditeur drag & drop intuitif (inspiration : Framer, Webflow)
- [ ] Sauvegarde pages en JSON, rendu Next.js
- [ ] Pages personnalisables : accueil, à propos, contact
- [ ] Responsive preview (mobile/tablet/desktop)

### Export / Import
- [ ] Export CSV produits
- [ ] Import CSV produits (avec mapping colonnes)
- [ ] Export CSV commandes
- [ ] Export CSV clients (RGPD)

### Intégrations
- [ ] Webhooks sortants (notifications externes)
- [ ] Templates Zapier / n8n / Make
- [ ] API publique documentée pour intégrations tierces

### RGPD
- [ ] Bannière cookies (consentement granulaire)
- [ ] CGU/CGV personnalisables dans l'admin
- [ ] Export données client (RGPD art. 20)
- [ ] Suppression compte client avec anonymisation

### Analytics
- [ ] Dashboard stats (CA, commandes, panier moyen, tendances)
- [ ] Top produits / catégories
- [ ] Taux conversion tunnel
- [ ] Events tracking (sans Google Analytics, privacy-first)

### Autres
- [ ] Multi-langue (i18n admin + store)
- [ ] SEO avancé (sitemap auto, meta dynamiques, JSON-LD structured data)
- [ ] Mode caisse simplifié (vente rapide en boutique/marché)
- [ ] PWA store (installation mobile, offline basique)
