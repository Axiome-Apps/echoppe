import { t } from 'elysia';

// Schémas d'entité du domaine entreprise — SOURCE UNIQUE. Importés par la route (par valeur,
// pour l'union GET / et l'array countries) ET agrégés dans `companyModels` → peuplent
// `components.schemas`. Les infos entreprise = mentions légales publiques (pas de champ
// sensible type coût/marge) → exposables au storefront.

export const companySchema = t.Object({
  id: t.String(),
  shopName: t.String(),
  logo: t.Nullable(t.String()),
  publicEmail: t.String(),
  publicPhone: t.Nullable(t.String()),
  legalName: t.String(),
  legalForm: t.Nullable(t.String()),
  siren: t.Nullable(t.String()),
  siret: t.Nullable(t.String()),
  tvaIntra: t.Nullable(t.String()),
  rcsCity: t.Nullable(t.String()),
  shareCapital: t.Nullable(t.String()),
  street: t.String(),
  street2: t.Nullable(t.String()),
  postalCode: t.String(),
  city: t.String(),
  country: t.String(),
  documentPrefix: t.String(),
  invoicePrefix: t.String(),
  taxExempt: t.Boolean(),
  publisherName: t.Nullable(t.String()),
  hostingProvider: t.Nullable(t.String()),
  hostingAddress: t.Nullable(t.String()),
  hostingPhone: t.Nullable(t.String()),
});

export const countrySchema = t.Object({
  id: t.String(),
  name: t.String(),
  code: t.String(),
  isShippingEnabled: t.Boolean(),
});

// Modèles nommés exposés dans le contrat (components.schemas).
export const companyModels = {
  Company: companySchema,
  Country: countrySchema,
  CountryList: t.Array(countrySchema),
};
