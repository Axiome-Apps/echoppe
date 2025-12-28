---

# Configuration des ports — Échoppe by Axiome

## Ports par défaut

| Service | Port | Signification |
|---------|------|---------------|
| Store | `3141` | π (Pi) |
| Admin | `3211` | 1123 inversé (Fibonacci) |
| API | `7532` | 2357 inversé (Nombres premiers) |

## Pourquoi ces choix ?

### Une identité mathématique

Axiome signifie *une vérité évidente, simple, fondamentale*. Les ports d'Échoppe reflètent cette philosophie en s'appuyant sur des constantes et suites mathématiques universelles :

- **3141** — Les premiers chiffres de π, la constante la plus reconnaissable. Le store est la vitrine publique, ce que le monde voit en premier.

- **3211** — La suite de Fibonacci (1, 1, 2, 3) lue à l'envers. Fibonacci représente la croissance organique — approprié pour l'interface d'administration où l'on fait grandir son commerce.

- **7532** — Les quatre premiers nombres premiers (2, 3, 5, 7) en miroir. Les nombres premiers sont les briques élémentaires des mathématiques — comme l'API est la fondation technique de l'application.

### Le miroir comme signature

Deux des trois ports sont des inversions. C'est intentionnel : un axiome est une vérité qu'on peut lire dans tous les sens. Échoppe propose une autre perspective sur le e-commerce pour artisans.

### Logique technique

- **3xxx** pour les frontends (Store & Admin) — reste dans la plage conventionnelle des applications web
- **7xxx** pour le backend (API) — séparation claire, zone peu encombrée

## Pour les DevOps

Ces ports sont des *defaults*, pas des contraintes. Chaque port est configurable via variables d'environnement :

```env
# .env
STORE_PORT=3141
ADMIN_PORT=3211
API_PORT=7532
```

Vous préférez une configuration classique ? Aucun problème :

```env
STORE_PORT=3000
ADMIN_PORT=3001
API_PORT=8000
```

### Pourquoi des ports "originaux" par défaut ?

1. **Éviter les conflits** — Les ports standards (3000, 8000, 8080) sont souvent déjà occupés en environnement de développement
2. **Identité** — Comme Directus avec son 8055, des ports reconnaissables créent une signature technique
3. **Zéro ambiguïté** — En voyant `3141` dans vos logs, vous savez immédiatement que c'est Échoppe

## Vérification des conflits

| Port | Conflits connus | Verdict |
|------|-----------------|---------|
| 3141 | Aucun | ✓ Safe |
| 3211 | Aucun | ✓ Safe |
| 7532 | Aucun | ✓ Safe |

---

*Échoppe fait partie d'[Axiome](https://axiome.app), une organisation open source créant des outils pour les artisans.*
