# @echoppe/client

## 0.2.0

### Minor Changes

- 985e216: Façade ressource namespacée + nouvelle surface storefront.

  - **Façade namespacée** : `createEchoppeClient` renvoie désormais des namespaces
    typés (`products`, `cart`, `checkout`, `auth`, `account`, `addresses`,
    `orders`, `pages`, …) au lieu du client brut. Le client `openapi-fetch` reste
    accessible en échappatoire via `echoppe.raw`. **Breaking** pour les appels
    directs `client.GET(...)` → passer par les namespaces ou `.raw`.
  - **Espace client** : `orders.list()` / `orders.get()`, `account.updateProfile()`,
    `auth.changePassword()`, `auth.forgotPassword()`, `auth.resetPassword()`.
  - **Panier enrichi** : la ligne panier expose `compareAtPriceHt` et `optionValues`.
  - **Content (page builder P1)** : `pages.list()` et `pages.bySlug()`.

## 0.1.0-next.1

### Patch Changes

- 494fd94: Valider le pipeline de release (Trusted Publishing OIDC, publication sans token).
