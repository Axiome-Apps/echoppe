# create-echoppe

## 0.1.2

### Patch Changes

- 224c95f: Aligne le template scaffoldé sur la façade namespacée de `@echoppe/client`.

  Le template pin `@echoppe/client: "latest"` et appelait le client brut
  (`api.GET('/products/', …)`). Depuis `@echoppe/client@0.2.0`, `createEchoppeClient`
  renvoie la façade (`api.products.list()`, `api.products.bySlug(…)`, `api.raw` en
  échappatoire) — l'ancien pattern cassait tout store fraîchement généré. Les pages
  `index`, `produits/index` et `produits/[slug]` passent désormais par les namespaces.

## 0.1.0-next.1

### Patch Changes

- 494fd94: Valider le pipeline de release (Trusted Publishing OIDC, publication sans token).
