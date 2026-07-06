import createOpenApiClient, { type ClientOptions } from 'openapi-fetch';
import type { paths } from './openapi';

export interface EchoppeClientOptions {
  /** URL de base de l'API Échoppe, ex. `https://api.maboutique.fr`. */
  baseUrl: string;
  /** En-têtes envoyés par défaut sur chaque requête (contexte SSR, etc.). */
  headers?: Record<string, string>;
  /**
   * Implémentation de `fetch` à utiliser (SSR, tests). Défaut : `fetch` global.
   */
  fetch?: ClientOptions['fetch'];
}

/**
 * Crée un client typé pour l'API Échoppe.
 *
 * L'authentification repose sur des cookies de session HTTP-only : le client
 * force donc `credentials: 'include'` pour que les routes protégées fonctionnent.
 */
export function createEchoppeClient(options: EchoppeClientOptions) {
  return createOpenApiClient<paths>({
    baseUrl: options.baseUrl.replace(/\/+$/, ''),
    credentials: 'include',
    headers: options.headers,
    fetch: options.fetch,
  });
}

export type EchoppeClient = ReturnType<typeof createEchoppeClient>;
