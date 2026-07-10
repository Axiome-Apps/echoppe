import { t } from 'elysia';

// Schéma d'entité client (profil) — SOURCE UNIQUE. Agrégé dans `customerModels` → peuple
// `components.schemas`. La réponse de `GET /customer/auth/me` enveloppe le profil dans
// `{ customer }` ; on nomme la réponse entière (`CustomerAuth`) car un nom de modèle n'est
// pas référençable via `t.Ref` à l'intérieur d'un wrapper (cf. contrainte connue).

export const customerSchema = t.Object({
  id: t.String(),
  email: t.String(),
  firstName: t.String(),
  lastName: t.String(),
  phone: t.Nullable(t.String()),
  emailVerified: t.Boolean(),
  marketingOptin: t.Boolean(),
});

// Modèles nommés exposés dans le contrat (components.schemas).
export const customerModels = {
  Customer: customerSchema,
  CustomerAuth: t.Object({ customer: customerSchema }),
};
