# Design — Système de contenu léger (B9 + B11)

Détail des tâches **Système de contenu léger** du [backlog](../backlog.md). **Note de conception** —
pas encore d'ADR : plusieurs points structurants restent ouverts. **ADR requis avant impl.**

## Reframe

Deux besoins remontés séparément convergent :

- **B9 — bloc prose/richText** : pages légales/éditoriales (CGV, confidentialité, retours, mentions).
- **B11 — onglets produit** (livraison / retours / conseils) : au départ envisagé comme système dédié.

Plutôt qu'un système par besoin, on vise **un système d'entités de contenu léger** (CMS minimal) :
des **types d'entités configurables**, chacun **singleton** (ex. politique de livraison, page CGV) ou
**liste** (ex. FAQ, conseils, articles). Les onglets produit et les pages prose deviennent alors de
simples **consommateurs** de ce système. B9 est **absorbé** : le prose est une entité de contenu.

## Relation au module contenu existant

À ne pas confondre avec le **page-builder headless** `@echoppe/content`
([ADR-0012](../adr/ADR-0012-module-contenu.md) / [content-module.md](../content-module.md)) : celui-ci
gère des **pages à blocs** déclarés en config-as-code par le dev du front (rendu côté front). Le
système d'entités vise du **contenu structuré éditable en admin** sans déclaration côté front.
La conception devra **arbitrer le recouvrement** : entité de contenu = nouveau primitif, ou extension
du modèle de blocs existant ? À trancher dans l'ADR.

## Décision bloquante : format du texte riche

**HTML vs Markdown.** Une partie du contenu existant est **déjà en HTML** → choisir Markdown
imposerait d'**homogénéiser tout l'existant** (migration). Ce choix est **celui du système** (pas de
B9 isolé) : le format retenu s'applique à toutes les entités prose. **Trancher AVANT toute impl.**

## Questions ouvertes (pour l'ADR)

- Modèle : table générique `content_entity` (type + `data` jsonb) vs tables par type ?
- Singleton vs liste : contrainte au niveau schéma ou au niveau type déclaré ?
- Édition admin : formulaires génériques dérivés du type (cf. page-builder P3) ?
- Surface storefront : endpoint générique `/content/:type[/:slug]` vs endpoints dédiés ?
- Format riche : HTML sanitisé vs Markdown (+ migration de l'existant HTML).

## Consommateurs cibles (V1)

Pages légales prose (B9) · onglets produit livraison/retours/conseils (B11) · potentiellement FAQ.
</content>
