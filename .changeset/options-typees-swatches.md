---
"@echoppe/client": minor
---

Contrat storefront enrichi (options typées & swatches). La carte produit expose
désormais `swatches[]` (`optionValueId`, `label`, `color` rendue en oklch, `image` de
variante) ; les options de `ProductDetail` portent `type` (`string` | `color`) et
`metadata` couleur oklch (`{ l, c, h, alpha }`). La pagination gagne `hasNextPage` /
`hasPrevPage`. Ajouts rétrocompatibles.
