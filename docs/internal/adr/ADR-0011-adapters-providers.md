# ADR-0011 — Adapters de providers externes (paiement / livraison / communication)

Statut : accepté

## Contexte

Une boutique doit brancher des services tiers variables selon le commerçant : paiement (Stripe,
PayPal, virement, chèque), livraison (Colissimo, Mondial Relay, Sendcloud), email transactionnel
(Resend, Brevo, SMTP). Le cœur métier ne doit pas coupler sa logique à un provider particulier, et les
**secrets** (clés API) ne doivent jamais fuiter.

## Options envisagées

- Intégration directe d'un provider (ex. Stripe en dur) — simple mais non substituable.
- Couche d'abstraction par famille avec implémentations interchangeables, sélection par config.

## Décision

Un **adapter par famille**, structure uniforme sous `packages/core/src/adapters/<famille>/` :
- `types.ts` — l'interface commune (ex. `PaymentAdapter`, `CommunicationAdapter`) ;
- une implémentation par provider (`stripe.ts`, `paypal.ts`, `colissimo.ts`, `resend.ts`…) ;
- `config.ts` + `index.ts` — sélection/résolution du provider actif depuis la configuration en base.
- **Secrets chiffrés au repos** : les clés des `*_provider_config` sont chiffrées via
  `utils/crypto.ts` (clé `ENCRYPTION_KEY`), jamais stockées ni renvoyées en clair.
- Capacités **optionnelles** exprimées dans l'interface (ex. `capturePayment`/`cancelPayment` pour la
  capture manuelle Stripe, cf. ADR-0005 ; fallback `refund` pour PayPal).

## Conséquences

- Ajouter un provider = une implémentation + son enregistrement, sans toucher le métier.
- La configuration provider (activation, secrets chiffrés) est administrable ; la CLI génère
  `ENCRYPTION_KEY` au scaffolding (cf. ADR-0002).
- Le contrat storefront ne dépend d'aucun provider (checkout via l'API, cf. ADR-0005).
