import { t } from 'elysia';

// Schéma d'entité adresse client — SOURCE UNIQUE. Importé par la route (par valeur, pour
// l'array de liste) ET agrégé dans `addressModels` → peuple `components.schemas`.

export const addressSchema = t.Object({
  id: t.String(),
  type: t.Union([t.Literal('shipping'), t.Literal('billing')]),
  label: t.Nullable(t.String()),
  firstName: t.String(),
  lastName: t.String(),
  company: t.Nullable(t.String()),
  street: t.String(),
  street2: t.Nullable(t.String()),
  postalCode: t.String(),
  city: t.String(),
  country: t.Object({
    id: t.String(),
    name: t.String(),
    code: t.String(),
  }),
  phone: t.Nullable(t.String()),
  isDefault: t.Boolean(),
});

// Modèles nommés exposés dans le contrat (components.schemas).
export const addressModels = {
  Address: addressSchema,
  AddressList: t.Array(addressSchema),
};
