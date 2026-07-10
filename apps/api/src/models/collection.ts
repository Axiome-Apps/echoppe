import { t } from 'elysia';
import { paginatedResponse } from '../utils/pagination';

// Schéma d'entité collection — SOURCE UNIQUE. Importé par les routes (par valeur) ET agrégé
// dans `collectionModels` pour être enregistré comme modèle nommé → peuple
// `components.schemas` du contrat OpenAPI.

export const collectionSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  description: t.Nullable(t.String()),
  image: t.Nullable(t.String()),
  isVisible: t.Boolean(),
  dateCreated: t.Date(),
});

// Modèles nommés exposés dans le contrat (components.schemas).
export const collectionModels = {
  Collection: collectionSchema,
  CollectionList: paginatedResponse(collectionSchema),
};
