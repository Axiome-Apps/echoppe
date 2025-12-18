import { t, type TSchema } from 'elysia';

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
  limit: number
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
