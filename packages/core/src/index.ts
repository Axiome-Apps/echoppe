export type { Database } from './db/index';
export { db } from './db/index';
export * from './db/schema/index';

// Re-export drizzle-orm utilities
export { eq, ne, gt, gte, lt, lte, and, or, like, ilike, inArray, notInArray, isNull, isNotNull, asc, desc, sql } from 'drizzle-orm';
