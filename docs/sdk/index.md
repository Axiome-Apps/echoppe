# SDK `@echoppe/client`

`@echoppe/client` est le **client typé** pour consommer l'API Échoppe depuis une boutique.
C'est le point d'entrée des storefronts générés par `npm create echoppe@latest`.

## À qui s'adresse ce SDK

Ce SDK cible le **front e-commerce** (la boutique). Il n'expose que la **surface
storefront** de l'API : catalogue, panier, tunnel de commande, compte client. Les routes
d'administration (back-office) n'y figurent pas — elles sont gérées par le dashboard Admin.

> Le dashboard Admin, lui, vit dans le monorepo et consomme l'API via
> [Eden Treaty](https://elysiajs.com/eden/treaty/overview.html) (couplage direct aux types
> Elysia). Le SDK boutique est **autonome** : il ne dépend que d'un contrat OpenAPI figé, pas
> du code de l'API.

## Comment ça marche

| Élément | Choix |
|---------|-------|
| Transport | [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/) — un `fetch` typé, minimal |
| Types | générés par [`openapi-typescript`](https://openapi-ts.dev/) depuis un contrat OpenAPI **figé** (`openapi.json`) |
| Authentification | cookies de **session** HTTP-only (`credentials: 'include'`) — pas de JWT |
| Surface | **boutique uniquement** : le contrat est filtré à la génération (routes admin exclues) |

Le contrat étant figé et versionné, le SDK est **découplé** de l'implémentation de l'API :
il fonctionne face à une API livrée en conteneur Docker opaque, sans accès au code source.

## En bref

```ts
import { createEchoppeClient } from '@echoppe/client';

const echoppe = createEchoppeClient({ baseUrl: 'https://api.maboutique.fr' });

const { data, error } = await echoppe.GET('/products/');
if (error) throw error;

for (const product of data.data) {
  console.log(product.name);
}
```

Chaque route est **entièrement typée** (paramètres, corps, réponse) à partir du contrat.

## Pour aller plus loin

- [Installation](/sdk/installation) — ajouter et configurer le client.
- [Utilisation](/sdk/usage) — requêtes, gestion des erreurs, session, exemples.
- [Types & surface](/sdk/types) — les modèles nommés et le périmètre exposé.
