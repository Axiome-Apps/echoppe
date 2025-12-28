import { t, type TSchema } from 'elysia';

// ============================================
// Schemas de réponse communs
// ============================================

/**
 * Schema d'erreur générique avec message.
 * @deprecated Utiliser les schémas spécifiques (notFoundResponse, badRequestResponse, etc.)
 */
export const errorSchema = t.Object({
  message: t.String({ description: 'Description de l\'erreur' }),
});

/** Schema de succès simple */
export const successSchema = t.Object({
  success: t.Literal(true, { description: 'Opération réussie' }),
});

/** Schema de message de succès */
export const messageSchema = t.Object({
  message: t.String({ description: 'Message de confirmation' }),
});

// ============================================
// Réponses d'erreur HTTP communes
// ============================================

/** 400 Bad Request - Requête invalide */
export const badRequestResponse = t.Object({
  message: t.String({ description: 'Détail de l\'erreur de validation' }),
}, { description: 'Requête invalide - Données manquantes ou incorrectes' });

/** 401 Unauthorized - Non authentifié */
export const unauthorizedResponse = t.Object({
  message: t.String({ description: 'Raison du refus d\'authentification' }),
}, { description: 'Non authentifié - Session invalide ou expirée' });

/** 403 Forbidden - Permission refusée */
export const forbiddenResponse = t.Object({
  message: t.String({ description: 'Permission manquante' }),
}, { description: 'Permission refusée - Droits insuffisants' });

/** 404 Not Found - Ressource non trouvée */
export const notFoundResponse = t.Object({
  message: t.String({ description: 'Ressource non trouvée' }),
}, { description: 'Ressource non trouvée' });

/** 409 Conflict - Conflit de données */
export const conflictResponse = t.Object({
  message: t.String({ description: 'Détail du conflit' }),
}, { description: 'Conflit - La ressource existe déjà ou est en conflit' });

/** 422 Unprocessable Entity - Erreur de validation métier */
export const unprocessableResponse = t.Object({
  message: t.String({ description: 'Détail de l\'erreur métier' }),
}, { description: 'Entité non traitable - Règle métier non respectée' });

/** 429 Too Many Requests - Rate limit dépassé */
export const rateLimitResponse = t.Object({
  message: t.String({ description: 'Temps d\'attente avant nouvelle tentative' }),
}, { description: 'Trop de requêtes - Limite de débit dépassée' });

/** 500 Internal Server Error - Erreur serveur */
export const serverErrorResponse = t.Object({
  message: t.String({ description: 'Erreur interne' }),
}, { description: 'Erreur serveur interne' });

/** 503 Service Unavailable - Service indisponible */
export const serviceUnavailableResponse = t.Object({
  message: t.String({ description: 'Service temporairement indisponible' }),
}, { description: 'Service indisponible - Réessayez plus tard' });

// ============================================
// Types de réponse
// ============================================

type ResponseMap = Record<number, TSchema>;

// ============================================
// Helpers pour combiner les réponses
// ============================================

/**
 * Ajoute les réponses d'erreur communes à un objet de réponses.
 * Utile pour les routes protégées par authentification.
 *
 * @example
 * response: withAuthErrors({
 *   200: productSchema,
 *   404: notFoundResponse,
 * })
 * // Ajoute automatiquement 401 et 403
 */
export function withAuthErrors<T extends ResponseMap>(responses: T): T & { 401: typeof unauthorizedResponse; 403: typeof forbiddenResponse } {
  return {
    ...responses,
    401: unauthorizedResponse,
    403: forbiddenResponse,
  };
}

/**
 * Ajoute les réponses d'erreur communes pour les routes avec rate limiting.
 *
 * @example
 * response: withRateLimitErrors({
 *   200: loginResponseSchema,
 *   401: unauthorizedResponse,
 * })
 * // Ajoute automatiquement 429
 */
export function withRateLimitErrors<T extends ResponseMap>(responses: T): T & { 429: typeof rateLimitResponse } {
  return {
    ...responses,
    429: rateLimitResponse,
  };
}

/**
 * Ajoute les réponses d'erreur pour les routes d'authentification (login, register).
 * Combine auth errors + rate limit.
 *
 * @example
 * response: withLoginErrors({
 *   200: loginResponseSchema,
 * })
 * // Ajoute 401, 403, 429
 */
export function withLoginErrors<T extends ResponseMap>(responses: T): T & { 401: typeof unauthorizedResponse; 403: typeof forbiddenResponse; 429: typeof rateLimitResponse } {
  return {
    ...responses,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    429: rateLimitResponse,
  };
}

/**
 * Ajoute les réponses d'erreur communes pour les routes CRUD protégées.
 * Inclut: 401 (non auth), 403 (forbidden), 404 (not found)
 *
 * @example
 * response: withCrudErrors({
 *   200: productSchema,
 * })
 * // Ajoute 401, 403, 404
 */
export function withCrudErrors<T extends ResponseMap>(responses: T): T & { 401: typeof unauthorizedResponse; 403: typeof forbiddenResponse; 404: typeof notFoundResponse } {
  return {
    ...responses,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
  };
}

/**
 * Ajoute uniquement 404 pour les routes publiques qui peuvent ne pas trouver la ressource.
 *
 * @example
 * response: withNotFound({
 *   200: productSchema,
 * })
 */
export function withNotFound<T extends ResponseMap>(responses: T): T & { 404: typeof notFoundResponse } {
  return {
    ...responses,
    404: notFoundResponse,
  };
}

/**
 * Ajoute les erreurs de service (500, 503) pour les routes qui dépendent de services externes.
 *
 * @example
 * response: withServiceErrors({
 *   200: messageSchema,
 * })
 * // Ajoute 500, 503
 */
export function withServiceErrors<T extends ResponseMap>(responses: T): T & { 500: typeof serverErrorResponse; 503: typeof serviceUnavailableResponse } {
  return {
    ...responses,
    500: serverErrorResponse,
    503: serviceUnavailableResponse,
  };
}

/**
 * Combinaison complète pour les routes CRUD avec rate limiting.
 * Inclut: 401, 403, 404, 429
 */
export function withFullErrors<T extends ResponseMap>(responses: T): T & { 401: typeof unauthorizedResponse; 403: typeof forbiddenResponse; 404: typeof notFoundResponse; 429: typeof rateLimitResponse } {
  return {
    ...responses,
    401: unauthorizedResponse,
    403: forbiddenResponse,
    404: notFoundResponse,
    429: rateLimitResponse,
  };
}

/**
 * Helper pour créer une réponse paginée avec erreurs auth.
 * Utile pour les routes de liste protégées.
 *
 * @example
 * response: withAuthErrors({
 *   200: paginatedResponse(productSchema),
 * })
 */
// Ré-export de paginatedResponse pour centraliser les imports
export { paginatedResponse } from './pagination';
