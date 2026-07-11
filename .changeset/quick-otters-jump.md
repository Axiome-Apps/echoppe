---
"create-echoppe": patch
---

Aligne le template scaffoldé sur la façade namespacée de `@echoppe/client`.

Le template pin `@echoppe/client: "latest"` et appelait le client brut
(`api.GET('/products/', …)`). Depuis `@echoppe/client@0.2.0`, `createEchoppeClient`
renvoie la façade (`api.products.list()`, `api.products.bySlug(…)`, `api.raw` en
échappatoire) — l'ancien pattern cassait tout store fraîchement généré. Les pages
`index`, `produits/index` et `produits/[slug]` passent désormais par les namespaces.
