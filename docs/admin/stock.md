# Stock

Gérez les niveaux de stock et les mouvements.

## Vue d'ensemble

La page **Stock** affiche :
- Les mouvements de stock récents
- Les alertes de rupture et stock bas

## Alertes

### Types d'alertes

| Type | Description |
|------|-------------|
| **Rupture** | Stock à 0 |
| **Stock bas** | Stock sous le seuil d'alerte défini |

### Configurer les seuils

Le seuil d'alerte se configure par variante dans la fiche produit :
1. Ouvrez le produit
2. Modifiez la variante
3. Définissez le **Seuil d'alerte** (défaut : 5)

## Mouvements de stock

### Types de mouvements

| Type | Description | Effet |
|------|-------------|-------|
| **Réapprovisionnement** | Réception de marchandise | + stock |
| **Ajustement** | Correction manuelle | + ou - stock |
| **Vente** | Commande confirmée | - stock (automatique) |
| **Annulation** | Commande annulée/remboursée | + stock (automatique) |

### Créer un mouvement

1. Cliquez sur **Nouveau mouvement**
2. Sélectionnez la variante
3. Choisissez le type (Réapprovisionnement ou Ajustement)
4. Entrez la quantité (positive ou négative)
5. Ajoutez une note explicative (optionnel)
6. Validez

### Historique

Chaque mouvement est enregistré avec :
- Date et heure
- Type de mouvement
- Variante concernée
- Quantité modifiée
- Quantité résultante
- Note
- Utilisateur ayant effectué l'action

## Bonnes pratiques

- **Inventaire régulier** : Utilisez les ajustements pour corriger les écarts
- **Seuils adaptés** : Définissez des seuils en fonction du délai de réapprovisionnement
- **Notes explicatives** : Documentez les ajustements pour traçabilité
