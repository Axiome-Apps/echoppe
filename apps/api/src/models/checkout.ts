import { t } from 'elysia';

// Schémas d'entité du tunnel de commande — SOURCE UNIQUE. Importés par la route (par valeur,
// pour l'array de providers) ET agrégés dans `checkoutModels` → peuplent `components.schemas`.

export const providerInfoSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
});

export const checkoutResultSchema = t.Object({
  orderId: t.String(),
  orderNumber: t.String(),
  paymentUrl: t.String(),
  provider: t.String(),
});

// Modèles nommés exposés dans le contrat (components.schemas).
export const checkoutModels = {
  PaymentProvider: providerInfoSchema,
  PaymentProviderList: t.Array(providerInfoSchema),
  CheckoutResult: checkoutResultSchema,
};
