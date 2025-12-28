# Contribuer

Guide pour contribuer au développement d'Échoppe.

## Setup développement

```bash
# Cloner le repo
git clone https://github.com/your-org/echoppe.git
cd echoppe

# Installer les dépendances
bun install

# Copier la config
cp .env.example .env

# Lancer les services
docker compose up -d

# Initialiser la DB
bun run db:push --force
bun run db:seed

# Lancer en dev
bun run dev
```

## Structure du code

### API (`apps/api`)

```
apps/api/src/
├── index.ts          # Point d'entrée
├── routes/           # Routes par ressource
├── plugins/          # Plugins Elysia (auth, etc.)
├── lib/              # Utilitaires
└── utils/            # Helpers
```

### Admin (`apps/admin`)

```
apps/admin/src/
├── components/
│   ├── atoms/        # Composants de base
│   ├── molecules/    # Composants composés
│   └── organisms/    # Composants complexes
├── composables/      # Logique réutilisable
├── views/            # Pages
├── layouts/          # Layouts
└── router/           # Configuration routes
```

## Conventions

### Code style

- **Linter** : Biome (API, packages) + ESLint (Admin, Store)
- **Format** : Biome

```bash
bun run lint        # Vérifier
bun run lint:fix    # Corriger
```

### TypeScript

- Strict mode activé
- Pas de `any` sans type guard
- Types inférés depuis l'API (Eden)

### Commits

Format : `type(scope): description`

Types :
- `feat` : nouvelle fonctionnalité
- `fix` : correction de bug
- `refactor` : refactoring
- `docs` : documentation
- `chore` : maintenance

Exemples :
```
feat(api): add order export endpoint
fix(admin): fix product form validation
refactor(core): simplify permission check
```

### Branches

- `main` : production
- `feat/xxx` : nouvelles fonctionnalités
- `fix/xxx` : corrections

## Ajouter une fonctionnalité

### 1. Route API

```typescript
// apps/api/src/routes/example.ts
import { Elysia, t } from 'elysia';
import { authPlugin } from '../plugins/auth';
import { db, eq } from '@echoppe/core';
import { example } from '@echoppe/core/schema';

export const exampleRoutes = new Elysia({ prefix: '/examples' })
  .use(authPlugin)
  .get('/', async () => {
    return db.select().from(example);
  })
  .post('/', async ({ body }) => {
    const [item] = await db.insert(example).values(body).returning();
    return item;
  }, {
    auth: true,
    permission: 'examples.create',
    body: t.Object({
      name: t.String(),
    }),
  });
```

### 2. Page Admin

```vue
<!-- apps/admin/src/views/ExamplesView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/lib/api';

type Example = Awaited<ReturnType<typeof api.examples.get>>['data'][number];

const items = ref<Example[]>([]);

onMounted(async () => {
  const { data } = await api.examples.get();
  if (data) items.value = data;
});
</script>

<template>
  <div>
    <h1>Examples</h1>
    <!-- ... -->
  </div>
</template>
```

### 3. Ajouter la route

```typescript
// apps/admin/src/router/index.ts
{
  path: 'examples',
  name: 'examples',
  component: () => import('../views/ExamplesView.vue'),
}
```

## Tests

```bash
# À venir
bun test
```

## Documentation

La documentation utilise VitePress :

```bash
bun run docs:dev    # Développement
bun run docs:build  # Build
```
