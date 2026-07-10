import { t } from 'elysia';

// Schéma d'entité taux de TVA — SOURCE UNIQUE. Importé par la route (par valeur, pour
// l'array) ET agrégé dans `taxRateModels` → peuple `components.schemas` du contrat OpenAPI.

export const taxRateSchema = t.Object({
  id: t.String(),
  name: t.String(),
  rate: t.String(),
  isDefault: t.Boolean(),
});

// Modèles nommés exposés dans le contrat (components.schemas).
export const taxRateModels = {
  TaxRate: taxRateSchema,
  TaxRateList: t.Array(taxRateSchema),
};
