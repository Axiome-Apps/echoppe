# Utilisation

Le client expose une **façade ressource** : les routes sont regroupées par namespace
(`products`, `cart`, `auth`, `orders`…) avec des méthodes nommées. Chaque appel renvoie
`{ data, error }`, tous deux typés d'après le contrat.

```ts
const { data, error } = await echoppe.products.bySlug({
  params: { path: { slug: 'mug-en-gres' } },
});
```

> **Client brut (échappatoire)** — la façade couvre toute la surface boutique, mais si un cas
> n'y est pas exposé, le client `openapi-fetch` brut reste accessible via `echoppe.raw` :
> `echoppe.raw.GET('/products/{id}', …)`. Verbe HTTP + chemin typés, même `{ data, error }`.

## Le motif `{ data, error }`

`openapi-fetch` ne lève **pas** d'exception sur une réponse HTTP en erreur : il remplit
`error` à la place de `data`. Les deux sont typés d'après le contrat.

```ts
const { data, error } = await echoppe.products.bySlug({
  params: { path: { slug: 'mug-en-gres' } },
});

if (error) {
  // `error` = corps de la réponse d'erreur (ex. { message: string })
  return handleNotFound(error);
}

// `data` est le ProductDetail, entièrement typé
console.log(data.name, data.variants[0]?.priceHt);
```

## Paramètres de chemin et de requête

```ts
// Query (pagination)
const { data } = await echoppe.products.list({
  params: { query: { page: 1, limit: 12 } },
});

// data.data  → tableau de produits
// data.meta  → { total, page, limit, totalPages }

// Path
await echoppe.categories.bySlug({
  params: { path: { slug: 'vaisselle' } },
});
```

## Corps de requête

```ts
// Ajouter un article au panier
const { data, error } = await echoppe.cart.addItem({
  body: { variantId: '…uuid…', quantity: 1 },
});

if (error) return showStockError(error);
// data = état complet du panier (Cart)
```

## Aperçu des namespaces

| Namespace | Méthodes |
|---|---|
| `products` | `list, get, bySlug, variants, media` |
| `categories` · `collections` | `list, get, bySlug, products` |
| `cart` | `get, addItem, updateItem, removeItem, clear, merge` |
| `checkout` | `create, paymentProviders, pay` |
| `auth` | `register, login, logout, refresh, me, changePassword` |
| `account` | `update` (profil) |
| `addresses` | `list, get, create, update, remove` |
| `orders` | `list, get` |
| `company` · `taxRates` · `contact` | `get` / `list` / `send` |

> Les URLs d'images ne sont pas un namespace : utilisez le helper `mediaUrl(id)`.

## Session et cookies

L'authentification (panier anonyme, compte client) repose sur un **cookie de session**.
Le client force `credentials: 'include'`, mais en **SSR** deux relais sont à votre charge :

**1. Requête entrante → API** : relayer le cookie du visiteur (voir
[Installation → SSR](/sdk/installation#server-side-rendering)).

**2. Réponse API → navigateur** : sur les mutations, l'API renvoie un `Set-Cookie` (nouvelle
session de panier, connexion…). Il faut le réémettre dans la réponse SSR, sinon la session
est perdue au rechargement.

```ts
// Récupérer les Set-Cookie renvoyés par l'API (via un fetch custom ou la réponse brute)
// puis les réémettre côté framework SSR :
setCookieHeaders.forEach((cookie) => response.headers.append('set-cookie', cookie));
```

> Les boutiques scaffoldées fournissent des helpers (`sessionInit`, `forwardSetCookies`)
> qui encapsulent ces deux relais.

## Exemple : profil client

```ts
const { data, error } = await echoppe.auth.me();

if (error) {
  // 401 → visiteur non connecté
  return null;
}

return data.customer; // { id, email, firstName, lastName, … }
```
