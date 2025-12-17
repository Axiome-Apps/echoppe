# Dashboard Échoppe

Interface d'administration Vue 3.

## Structure

```
src/
├── components/
│   ├── atoms/        # Button, Checkbox, Modal, Thumbnail...
│   ├── molecules/    # Breadcrumb, SearchInput, ContextMenu...
│   └── organisms/    # FolderSidebar, MediaGrid, DataTable...
├── composables/
│   └── media/        # useMedia (state + actions médiathèque)
├── lib/
│   └── api.ts        # Eden client type-safe
├── views/            # Pages (ProductsView, MediaView...)
├── App.vue
└── main.ts
```

## Alias

Utiliser `@/` pour tous les imports :

```typescript
import { api } from '@/lib/api';
import { Button, Modal } from '@/components/atoms';
import { useMedia } from '@/composables/media';
```

## Atomic Design

### Atoms
Composants de base réutilisables : `Button`, `Checkbox`, `Modal`, `Thumbnail`, `IconButton`

### Molecules
Combinaisons d'atoms : `Breadcrumb`, `SearchInput`, `ContextMenu`, `FolderTreeItem`

### Organisms
Sections complètes : `FolderSidebar`, `MediaGrid`, `MediaList`, `MediaDetailModal`

## Composables

Un composable par feature, dans un dossier dédié :

```
composables/
└── media/
    ├── types.ts      # Interfaces
    └── useMedia.ts   # State + actions
```

```typescript
// Utilisation
const { folders, mediaItems, loading, loadMedia, uploadFiles } = useMedia();
```

## API Client

Eden génère un client type-safe depuis l'API Elysia :

```typescript
import { api } from '@/lib/api';

// GET
const { data } = await api.products.get();

// GET avec params
const { data } = await api.products({ id: '123' }).get();

// POST
const { data } = await api.products.post({ name: 'Produit', slug: 'produit' });

// PUT
const { data } = await api.products({ id: '123' }).put({ name: 'Nouveau nom' });

// DELETE
await api.products({ id: '123' }).delete();
```

## Commandes

```bash
bun run dev:admin    # Lance le dashboard seul (port 3000)
bun run dev          # Lance API + Admin
```
