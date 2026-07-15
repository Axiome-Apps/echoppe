import { asc, type Column, desc, eq, inArray, type SQL } from '@echoppe/core';
import { type TSchema, t } from 'elysia';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const paginationQuery = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: DEFAULT_PAGE })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: MAX_LIMIT, default: DEFAULT_LIMIT })),
});

export type PaginationQuery = {
  page?: number;
  limit?: number;
};

// Schema pour la meta pagination
const paginatedMeta = t.Object({
  total: t.Number(),
  page: t.Number(),
  limit: t.Number(),
  totalPages: t.Number(),
});

// Helper pour créer un schema de réponse paginée typé
export function paginatedResponse<T extends TSchema>(itemSchema: T) {
  return t.Object({
    data: t.Array(itemSchema),
    meta: paginatedMeta,
  });
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export function getPaginationParams(query: PaginationQuery) {
  const page = query.page ?? DEFAULT_PAGE;
  const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// =============================================================================
// LIST QUERY — socle partagé tri + filtre + meta enrichie.
//
// Objectif : rendre TRIVIAL l'ajout/modif d'une entité listable. Une route
// déclare ses colonnes triables/filtrables (allowlist) et le parsing + la meta
// sont produits ici, jamais recopiés. Les filtres complexes (ranges, full-text,
// jointures) restent dans la route, en s'ajoutant aux conditions du helper.
//
// `buildPaginatedResponse` est conservé le temps de migrer les routes ;
// les nouvelles routes utilisent `buildListResponse` (meta enrichie).
// =============================================================================

export const sortQuery = t.Object({
  sort: t.Optional(t.String()),
  order: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
});

// Fragment prêt à composer : pagination + tri (les filtres restent par entité).
export const listQuery = t.Composite([paginationQuery, sortQuery]);

const listMeta = t.Object({
  total: t.Number(),
  page: t.Number(),
  limit: t.Number(),
  totalPages: t.Number(),
  hasNextPage: t.Boolean(),
  hasPrevPage: t.Boolean(),
});

export function listResponse<T extends TSchema>(itemSchema: T) {
  return t.Object({
    data: t.Array(itemSchema),
    meta: listMeta,
  });
}

export interface ListMeta extends PaginatedMeta {
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ListResponse<T> {
  data: T[];
  meta: ListMeta;
}

export function buildListResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): ListResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

// Tri générique validé contre une allowlist { clé publique -> colonne }. La clé
// est ce que le front envoie (?sort=clé) : elle mappe un id de colonne côté UI
// vers la colonne DB, sans jamais exposer un nom de colonne arbitraire.
export function parseSort(
  sort: string | undefined,
  order: string | undefined,
  sortable: Record<string, Column>,
  fallback: SQL,
): SQL {
  if (sort && sort in sortable) {
    const direction = order === 'asc' ? asc : desc;
    return direction(sortable[sort]);
  }
  return fallback;
}

// Filtres d'égalité génériques validés contre une allowlist { clé -> colonne }.
// Valeur multi (séparée par des virgules) -> inArray. Cas complexes (ranges,
// full-text, jointures) : à construire dans la route et à concaténer.
export function buildEqFilters(
  query: Record<string, unknown>,
  filterable: Record<string, Column>,
): SQL[] {
  const conditions: SQL[] = [];
  for (const [key, column] of Object.entries(filterable)) {
    const raw = query[key];
    if (raw === undefined || raw === null || raw === '') continue;
    const values = String(raw).split(',').filter(Boolean);
    if (values.length === 0) continue;
    conditions.push(values.length === 1 ? eq(column, values[0]) : inArray(column, values));
  }
  return conditions;
}
