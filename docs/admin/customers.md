# Clients

Gérez votre base clients et la conformité RGPD.

## Liste des clients

La page **Clients** affiche tous les comptes clients avec :
- Nom et email
- Date d'inscription
- Nombre de commandes
- Total dépensé
- Statut (actif/inactif)

### Filtres
- **Recherche** : nom, email, téléphone
- **Statut** : Actif, Inactif
- **Date d'inscription** : période

## Fiche client

Cliquez sur un client pour voir son profil complet :

### Informations
- Nom, prénom, email
- Téléphone
- Date d'inscription
- Dernière connexion

### Adresses
Liste des adresses de livraison enregistrées.

### Commandes
Historique complet des commandes du client.

### Statistiques
- Nombre de commandes
- Montant total dépensé
- Panier moyen

## Actions

### Désactiver un compte
1. Ouvrez la fiche client
2. Cliquez sur **Désactiver**
3. Le client ne pourra plus se connecter

### Réactiver un compte
Même procédure avec le bouton **Réactiver**.

## Conformité RGPD

### Anonymiser un client

L'anonymisation permet de supprimer les données personnelles tout en conservant l'historique des commandes pour la comptabilité.

1. Ouvrez la fiche client
2. Cliquez sur **Anonymiser**
3. Confirmez l'action

**Données supprimées :**
- Nom, prénom
- Email
- Téléphone
- Adresses

**Données conservées :**
- Historique des commandes (avec données anonymisées)
- Montants et statistiques

::: warning
L'anonymisation est irréversible. Assurez-vous d'avoir traité toutes les commandes en cours avant d'anonymiser un client.
:::

### Export des données

Pour répondre à une demande d'accès aux données :
1. Ouvrez la fiche client
2. Cliquez sur **Exporter les données**
3. Un fichier JSON est téléchargé avec toutes les données du client
