# API Échoppe

Documentation de l'API REST pour la plateforme e-commerce Échoppe.

## Configuration

| Paramètre | Valeur par défaut |
|-----------|-------------------|
| Base URL | `http://localhost:8000` |
| Port | `8000` (env: `API_PORT`) |
| Runtime | Bun |
| Framework | Elysia |
| CORS | `http://localhost:3000` (env: `ADMIN_URL`) |

## Authentification

L'API utilise un système de **session + cookie HTTP-only** (pas de JWT).

### Mécanisme

1. Login via `POST /auth/login` avec email/password
2. L'API crée une session en base et renvoie un cookie `echoppe_admin_session`
3. Ce cookie est automatiquement envoyé à chaque requête
4. Les routes protégées vérifient la validité de la session

### Configuration du cookie

| Propriété | Valeur |
|-----------|--------|
| Nom | `echoppe_admin_session` |
| httpOnly | `true` |
| secure | `true` en production |
| sameSite | `strict` |
| maxAge | 30 jours |

---

## Endpoints

### Auth (`/auth`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `POST` | `/auth/login` | Non | Connexion |
| `POST` | `/auth/logout` | Non | Déconnexion |
| `GET` | `/auth/me` | Oui | Utilisateur courant |

#### `POST /auth/login`

```typescript
// Body
{
  email: string,    // format: email
  password: string  // minLength: 1
}

// Response 200
{
  user: {
    id: string,
    email: string,
    firstName: string,
    lastName: string
  }
}

// Response 401
{ message: "Identifiants invalides" }

// Response 403
{ message: "Compte désactivé" }
```

#### `GET /auth/me`

```typescript
// Response 200
{
  user: {
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    isOwner: boolean,
    isActive: boolean
  },
  role: {
    id: string,
    name: string,
    scope: "admin" | "store"
  }
}

// Response 401
{ message: "Non authentifié" }
```

---

### Categories (`/categories`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/categories` | Non | Lister toutes |
| `GET` | `/categories/:id` | Non | Récupérer une |
| `POST` | `/categories` | Oui | Créer |
| `PUT` | `/categories/:id` | Oui | Mettre à jour |
| `PATCH` | `/categories/batch/order` | Oui | Réordonner (drag & drop) |
| `DELETE` | `/categories/:id` | Oui | Supprimer |

#### Schéma de création/mise à jour

```typescript
{
  name: string,         // minLength: 1, maxLength: 100
  slug: string,         // minLength: 1, maxLength: 100
  description?: string,
  parent?: string,      // UUID catégorie parent
  image?: string,       // UUID media
  sortOrder?: number,   // default: 0
  isVisible?: boolean   // default: true
}
```

---

### Products (`/products`)

#### Endpoints produits

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/products` | Non | Lister tous |
| `GET` | `/products/:id` | Non | Récupérer avec variantes/options |
| `POST` | `/products` | Oui | Créer |
| `PUT` | `/products/:id` | Oui | Mettre à jour (complet) |
| `PATCH` | `/products/:id` | Oui | Mettre à jour (partiel) |
| `DELETE` | `/products/:id` | Oui | Supprimer |

#### Schéma produit

```typescript
// POST/PUT
{
  name: string,         // minLength: 1, maxLength: 255
  slug: string,         // minLength: 1, maxLength: 255
  description?: string,
  category: string,     // UUID (obligatoire)
  taxRate: string,      // UUID (obligatoire)
  status?: "draft" | "published" | "archived"  // default: "draft"
}

// PATCH (tous optionnels)
{
  name?: string,
  slug?: string,
  description?: string,
  category?: string,
  taxRate?: string,
  status?: "draft" | "published" | "archived"
}
```

#### Endpoints variantes

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/products/:id/variants` | Non | Lister variantes |
| `POST` | `/products/:id/variants` | Oui | Créer variante |
| `PUT` | `/products/:id/variants/:variantId` | Oui | Mettre à jour variante |
| `DELETE` | `/products/:id/variants/:variantId` | Oui | Supprimer variante |

#### Schéma variante

```typescript
{
  sku?: string,              // maxLength: 50, unique
  barcode?: string,          // maxLength: 50
  priceHt: number,           // minimum: 0 (obligatoire)
  compareAtPriceHt?: number, // prix barré
  costPrice?: number,        // coût
  weight?: number,           // kg
  length?: number,           // cm (dimensions pour frais de port)
  width?: number,            // cm
  height?: number,           // cm
  isDefault?: boolean,       // default: false
  status?: "draft" | "published" | "archived",
  sortOrder?: number,        // default: 0
  quantity?: number,         // default: 0
  lowStockThreshold?: number // default: 5
}
```

#### Endpoints options

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `POST` | `/products/:id/options` | Oui | Créer option (Color, Size...) |
| `POST` | `/products/:id/options/:optionId/values` | Oui | Ajouter valeur |

#### Schémas options

```typescript
// Option
{
  name: string,       // minLength: 1, maxLength: 50
  sortOrder?: number  // default: 0
}

// Valeur d'option
{
  value: string,      // minLength: 1, maxLength: 100
  sortOrder?: number  // default: 0
}
```

#### Endpoints media produit

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/products/:id/media` | Oui | Lister media attachés |
| `POST` | `/products/:id/media` | Oui | Attacher media |
| `PUT` | `/products/:id/media/:mediaId` | Oui | Modifier placement |
| `DELETE` | `/products/:id/media/:mediaId` | Oui | Détacher media |

#### Schémas media produit

```typescript
// POST - Attacher
{
  mediaId: string,           // UUID (obligatoire)
  sortOrder?: number,        // default: 0
  isFeatured?: boolean,      // default: false
  featuredForVariant?: string // UUID variante
}

// PUT - Modifier
{
  sortOrder?: number,
  isFeatured?: boolean,
  featuredForVariant?: string | null
}
```

---

### Media (`/media`)

Tous les endpoints sont **protégés** (authentification requise).

#### Endpoints dossiers

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/media/folders` | Lister tous les dossiers |
| `POST` | `/media/folders` | Créer dossier |
| `PUT` | `/media/folders/:id` | Renommer/déplacer |
| `DELETE` | `/media/folders/:id` | Supprimer |

#### Schéma dossier

```typescript
{
  name: string,     // minLength: 1, maxLength: 100
  parent?: string   // UUID parent ou null
}
```

#### Endpoints fichiers

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/media` | Lister avec filtres |
| `GET` | `/media/:id` | Récupérer metadata |
| `POST` | `/media/upload` | Uploader fichier(s) |
| `PUT` | `/media/:id` | Modifier metadata |
| `PUT` | `/media/batch/move` | Déplacer plusieurs |
| `DELETE` | `/media/:id` | Supprimer |
| `DELETE` | `/media/batch` | Supprimer plusieurs |

#### Query parameters `GET /media`

```typescript
{
  folder?: string,  // UUID - filtrer par dossier
  search?: string,  // recherche titre/nom
  sort?: "name" | "size" | "date",  // default: "date"
  order?: "asc" | "desc",           // default: "desc"
  all?: "true"      // ignorer filtre dossier
}
```

#### Schéma upload

```typescript
// multipart/form-data
{
  file: File | File[],  // obligatoire
  folder?: string       // UUID dossier destination
}
```

#### Schéma mise à jour

```typescript
{
  title?: string,       // maxLength: 255
  description?: string,
  alt?: string,         // maxLength: 255
  folder?: string       // UUID ou null
}
```

#### Schéma déplacement batch

```typescript
{
  ids: string[],    // UUIDs des media
  folder: string    // UUID destination ou null
}
```

---

### Collections (`/collections`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/collections` | Non | Lister toutes |
| `GET` | `/collections/:id` | Non | Récupérer une |
| `POST` | `/collections` | Oui | Créer |
| `PUT` | `/collections/:id` | Oui | Mettre à jour |
| `DELETE` | `/collections/:id` | Oui | Supprimer |

#### Schéma collection

```typescript
{
  name: string,         // minLength: 1, maxLength: 100
  slug: string,         // minLength: 1, maxLength: 100
  description?: string,
  image?: string,       // UUID media
  isVisible?: boolean   // default: true
}
```

---

### Tax Rates (`/tax-rates`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/tax-rates` | Non | Lister les taux |

Lecture seule, utilisé pour les formulaires produits.

---

### Assets (`/assets`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/assets/:id` | Non | Servir fichier media |

Sert les fichiers uploadés avec :
- `Content-Type` depuis la base de données
- `Cache-Control: public, max-age=31536000` (1 an)

---

### Settings (`/settings`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/settings` | Oui | Récupérer paramètres boutique |
| `GET` | `/settings/countries` | Oui | Liste pays (pour select) |
| `PUT` | `/settings` | Oui | Créer/modifier paramètres (upsert) |

Paramètres : infos boutique, mentions légales (SIREN, SIRET, TVA intra), adresse, préfixes documents.

---

### Stock (`/stock`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/stock` | Oui | Liste mouvements avec pagination |
| `GET` | `/stock/alerts` | Oui | Variantes sous seuil de stock |
| `GET` | `/stock/variants` | Oui | Liste variantes (pour modal ajustement) |
| `POST` | `/stock` | Oui | Créer mouvement et MAJ quantité |

Types de mouvement : `restock`, `adjustment`

---

### Orders (`/orders`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/orders` | Oui | Liste avec filtres (statut, dates, montant, recherche) |
| `GET` | `/orders/:id` | Oui | Détail avec items, paiement, expédition |
| `GET` | `/orders/stats` | Oui | Statistiques par statut |
| `PATCH` | `/orders/:id/status` | Oui | Changer statut (MAJ stock auto) |
| `PATCH` | `/orders/:id/notes` | Oui | Modifier notes internes/client |
| `GET` | `/orders/:id/invoices` | Oui | Liste factures de la commande |
| `POST` | `/orders/:id/invoice` | Oui | Générer facture PDF |
| `GET` | `/orders/:id/invoices/:invoiceId/pdf` | Oui | Télécharger PDF |

Statuts : `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`

Gestion stock automatique : pending→confirmed décrémente, cancelled/refunded incrémente.

---

### Payments (`/payments`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/payments/providers` | Oui | Liste providers avec statut |
| `PUT` | `/payments/providers/stripe` | Oui | Configurer Stripe |
| `PUT` | `/payments/providers/paypal` | Oui | Configurer PayPal |
| `POST` | `/payments/checkout` | Non | Créer session paiement |
| `GET` | `/payments/:orderId` | Oui | Statut paiement |
| `POST` | `/payments/webhook/stripe` | Non | Webhook Stripe |
| `POST` | `/payments/webhook/paypal` | Non | Webhook PayPal |
| `POST` | `/payments/:orderId/refund` | Oui | Rembourser |

Providers : `stripe`, `paypal`

---

### Shipping (`/shipping`)

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| `GET` | `/shipping/providers` | Oui | Liste providers avec statut |
| `PUT` | `/shipping/providers/colissimo` | Oui | Configurer Colissimo |
| `PUT` | `/shipping/providers/mondialrelay` | Oui | Configurer Mondial Relay |
| `PUT` | `/shipping/providers/sendcloud` | Oui | Configurer Sendcloud |
| `POST` | `/shipping/rates` | Oui | Calculer tarifs |
| `POST` | `/shipping/labels` | Oui | Créer étiquette |
| `GET` | `/shipping/tracking/:trackingNumber` | Oui | Événements suivi |

Providers : `colissimo`, `mondialrelay`, `sendcloud`

---

## Gestion des erreurs

Format standard des erreurs :

```typescript
{
  message: string
}
```

### Codes HTTP

| Code | Signification |
|------|---------------|
| `400` | Requête invalide (validation) |
| `401` | Non authentifié |
| `403` | Accès refusé (compte désactivé) |
| `404` | Ressource non trouvée |
| `500` | Erreur serveur |

---

## Exemples d'utilisation

### Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@echoppe.dev","password":"admin123"}' \
  -c cookies.txt
```

### Requête authentifiée

```bash
curl http://localhost:8000/auth/me \
  -b cookies.txt
```

### Upload de fichier

```bash
curl -X POST http://localhost:8000/media/upload \
  -b cookies.txt \
  -F "file=@image.jpg" \
  -F "folder=uuid-du-dossier"
```

### Créer un produit

```bash
curl -X POST http://localhost:8000/products \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mon produit",
    "slug": "mon-produit",
    "category": "uuid-categorie",
    "taxRate": "uuid-tva"
  }'
```
