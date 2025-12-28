# Paramètres

Configurez votre boutique, les rôles et les utilisateurs.

## Onglets

La page Paramètres contient trois onglets :
- **Informations** : paramètres de la boutique
- **Rôles & permissions** : gestion des rôles
- **Utilisateurs** : gestion des comptes admin

## Informations boutique

### Informations générales
- **Nom de la boutique** : affiché sur le site et les documents
- **Email public** : email de contact
- **Téléphone public** : téléphone de contact
- **Logo** : logo affiché sur le site et les factures

### Informations légales
- **Raison sociale** : nom légal de l'entreprise
- **Forme juridique** : EI, EURL, SARL, SAS, etc.
- **SIREN / SIRET** : numéros d'identification
- **N° TVA intracommunautaire** : pour les échanges EU
- **Ville RCS** : ville d'immatriculation
- **Capital social** : montant du capital

### TVA
- **Exonération de TVA** : activer si franchise en base de TVA
- Les nouveaux produits seront créés avec TVA à 0% par défaut

### Adresse
Adresse du siège social, affichée sur les documents légaux.

### Pages légales
Informations pour les mentions légales :
- Directeur de publication
- Hébergeur (nom, adresse, téléphone)

### Numérotation des documents
- **Préfixe reçus** : ex. REC-2025-00001
- **Préfixe factures** : ex. FA-2025-00001

## Rôles & permissions {#roles}

### Rôles système

| Rôle | Description |
|------|-------------|
| **Owner** | Propriétaire, accès total, ne peut pas être supprimé |
| **Admin** | Administrateur, accès total |
| **Customer** | Client (scope boutique) |

### Créer un rôle personnalisé

1. Cliquez sur **Nouveau rôle**
2. Remplissez :
   - **Nom** : nom du rôle
   - **Description** : description optionnelle
   - **Scope** : Admin ou Boutique
3. Configurez les permissions dans la matrice
4. Enregistrez

### Matrice de permissions

Les permissions sont organisées par ressource :
- **Produits** : voir, créer, modifier, supprimer
- **Commandes** : voir, modifier statut, rembourser
- **Clients** : voir, modifier, anonymiser
- **Paramètres** : voir, modifier
- etc.

Cochez les permissions à accorder pour chaque ressource.

## Utilisateurs

### Liste des utilisateurs
- Nom et email
- Rôle attribué
- Statut (actif/inactif)
- Dernière connexion

### Créer un utilisateur

1. Cliquez sur **Nouvel utilisateur**
2. Remplissez :
   - **Prénom / Nom**
   - **Email** : servira d'identifiant
   - **Mot de passe**
   - **Rôle** : sélectionnez le rôle à attribuer
3. Enregistrez

### Modifier un utilisateur

1. Cliquez sur l'utilisateur
2. Modifiez les informations
3. Pour changer le mot de passe, remplissez le champ dédié
4. Enregistrez

### Désactiver un utilisateur

1. Sélectionnez les utilisateurs
2. Cliquez sur **Désactiver**
3. Les utilisateurs ne pourront plus se connecter

::: warning
Le compte Owner ne peut pas être désactivé ni supprimé.
:::
