---
"@echoppe/client": minor
---

Ajout de la navigation : `echoppe.menus.byHandle({ params: { path: { handle } } })` expose les menus résolus du storefront (arbre d'items récursif, liens URL ou entités internes projetées). Le générateur du SDK normalise désormais les schémas récursifs (TypeBox `t.Recursive`) en composants nommés → type `MenuItemResolved` correctement récursif côté client.
