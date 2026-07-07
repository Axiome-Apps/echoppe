# create-echoppe

Scaffolde une **boutique Astro** connectée à une API [Échoppe](https://github.com/Axiome-Apps/echoppe),
prête à démarrer, via le SDK [`@echoppe/client`](https://www.npmjs.com/package/@echoppe/client).

## Utilisation

```bash
npm create echoppe@latest
# ou
bunx create-echoppe
pnpm create echoppe
```

Le wizard demande :

1. le **nom du projet** (dossier créé dans le répertoire courant) ;
2. l'**URL de l'API** Échoppe (écrite dans `.env` → `PUBLIC_API_URL`).

Puis il génère une boutique Astro (SSR, adapter Node, Tailwind v4) préconfigurée :

```bash
cd ma-boutique
npm install
npm run dev
```

## Ce qui est généré

Une boutique autonome, hors du monorepo framework :

- `src/pages/` — accueil, `/produits`, `/produits/[slug]`
- `src/lib/api.ts` — client `@echoppe/client` typé, pointé sur `PUBLIC_API_URL`
- `src/layouts/`, `src/components/` — mise en page et carte produit

À étendre librement : c'est **votre** boutique.

## Licence

[CeCILL v2.1](LICENSE) — compatible GNU GPL.
