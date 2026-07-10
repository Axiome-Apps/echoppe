# Utilisation

Le client expose une méthode par verbe HTTP : `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
Chaque appel prend le **chemin de la route** (typé) et un objet d'options, et renvoie
`{ data, error }`.

> Aujourd'hui le SDK expose l'appel « brut » `openapi-fetch`. Une façade ressource curatée
> (`echoppe.products.bySlug(...)`, `echoppe.cart.add(...)`) est prévue — voir la feuille de
> route. Les exemples ci-dessous reflètent l'usage actuel.

## Le motif `{ data, error }`

`openapi-fetch` ne lève **pas** d'exception sur une réponse HTTP en erreur : il remplit
`error` à la place de `data`. Les deux sont typés d'après le contrat.

```ts
const { data, error } = await echoppe.GET('/products/by-slug/{slug}', {
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
const { data } = await echoppe.GET('/products/', {
  params: { query: { page: 1, limit: 12 } },
});

// data.data  → tableau de produits
// data.meta  → { total, page, limit, totalPages }

// Path
await echoppe.GET('/categories/by-slug/{slug}', {
  params: { path: { slug: 'vaisselle' } },
});
```

## Corps de requête

```ts
// Ajouter un article au panier
const { data, error } = await echoppe.POST('/cart/items', {
  body: { variantId: '…uuid…', quantity: 1 },
});

if (error) return showStockError(error);
// data = état complet du panier (Cart)
```

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
const { data, error } = await echoppe.GET('/customer/auth/me');

if (error) {
  // 401 → visiteur non connecté
  return null;
}

return data.customer; // { id, email, firstName, lastName, … }
```
