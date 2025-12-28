# Commandes

Gérez les commandes de vos clients.

## Liste des commandes

La page **Commandes** affiche toutes les commandes avec :
- Numéro de commande
- Client
- Date
- Montant
- Statut

### Filtres
- **Recherche** : numéro, email ou nom client
- **Statut** : En attente, Confirmée, En préparation, Expédiée, Livrée, Annulée, Remboursée
- **Date** : période de création
- **Montant** : fourchette de prix

## Statuts des commandes

| Statut | Description | Action stock |
|--------|-------------|--------------|
| **En attente** | Paiement en cours | - |
| **Confirmée** | Paiement reçu | Stock décrémenté |
| **En préparation** | Commande en cours de traitement | - |
| **Expédiée** | Colis envoyé | - |
| **Livrée** | Colis reçu | - |
| **Annulée** | Commande annulée | Stock réincrémenté |
| **Remboursée** | Paiement remboursé | Stock réincrémenté |

## Détail d'une commande

Cliquez sur une commande pour voir :

### Informations générales
- Numéro et date
- Statut actuel
- Notes internes et client

### Articles
- Liste des produits commandés
- Quantités et prix unitaires
- Sous-total, TVA, frais de port, total

### Client
- Nom et email
- Adresse de livraison
- Adresse de facturation

### Paiement
- Mode de paiement (Stripe, PayPal)
- Statut du paiement
- ID de transaction

### Livraison
- Transporteur
- Numéro de suivi
- Historique du suivi

## Actions

### Changer le statut
Utilisez le menu déroulant pour faire évoluer le statut de la commande.

### Générer une facture
1. Cliquez sur **Générer la facture**
2. Le PDF est créé et stocké
3. Téléchargez ou envoyez par email

### Rembourser
1. Cliquez sur **Rembourser**
2. Confirmez le remboursement
3. Le paiement est remboursé via le prestataire
4. Le stock est réincrémenté

## Notes

- **Notes internes** : visibles uniquement par l'équipe
- **Notes client** : visibles par le client dans son espace
