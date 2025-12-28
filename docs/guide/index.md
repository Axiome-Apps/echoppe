# Présentation

Échoppe est une plateforme e-commerce open source conçue pour être simple à utiliser et à étendre.

## Fonctionnalités principales

### Catalogue
- **Produits** avec variantes (taille, couleur, etc.) et options personnalisables
- **Catégories** hiérarchiques avec images et descriptions
- **Collections** pour regrouper des produits thématiques
- **Médiathèque** avec upload drag & drop, dossiers et gestion des fichiers

### Ventes
- **Panier** avec sessions anonymes ou client connecté
- **Commandes** avec suivi des statuts et historique
- **Paiements** via Stripe et PayPal
- **Livraison** via Colissimo, Mondial Relay ou Sendcloud
- **Factures PDF** générées automatiquement

### Clients
- Inscription et connexion sécurisées
- Espace client avec historique des commandes
- Gestion des adresses de livraison

### Administration
- Dashboard avec statistiques
- Gestion des utilisateurs et rôles (RBAC)
- Paramètres boutique (infos légales, TVA, etc.)
- Journal d'audit des actions

## Architecture technique

| Composant | Technologie |
|-----------|-------------|
| API | [Elysia](https://elysiajs.com/) sur [Bun](https://bun.sh/) |
| Admin | [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/) |
| Store | [Next.js 15](https://nextjs.org/) + [React 19](https://react.dev/) |
| Base de données | [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/) |
| Cache/Sessions | [Redis](https://redis.io/) |

## Prochaines étapes

- [Installation](/guide/installation) - Installer Échoppe en local ou en production
- [Configuration](/guide/configuration) - Configurer les variables d'environnement
