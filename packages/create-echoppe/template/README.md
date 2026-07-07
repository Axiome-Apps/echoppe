# Boutique Échoppe

Boutique e-commerce **Astro** (SSR) connectée à une API [Échoppe](https://github.com/Axiome-Apps/echoppe)
via le SDK [`@echoppe/client`](https://www.npmjs.com/package/@echoppe/client).

Générée avec `npm create echoppe@latest`.

## Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'URL de l'API (déjà écrite dans .env par la CLI)
#    PUBLIC_API_URL=http://localhost:7532

# 3. Lancer en développement
npm run dev
```

L'API Échoppe doit tourner et être joignable à l'URL de `PUBLIC_API_URL`.

## Pages

- `/` — accueil (produits à la une)
- `/produits` — liste des produits
- `/produits/[slug]` — fiche produit

Tout part de `src/` : `layouts/`, `components/`, `pages/`, et `lib/api.ts`
(client SDK typé). Étendez librement.

## Build & production

```bash
npm run build     # build SSR (adapter Node standalone)
npm run start     # node ./dist/server/entry.mjs
```
