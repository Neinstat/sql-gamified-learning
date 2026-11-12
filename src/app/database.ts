import { createCafeDatabase, type CafeDatabase } from '../sql-core/db';

let dbPromise: Promise<CafeDatabase> | null = null;

/** One shared café database for the whole page (created on first use). */
export function getDatabase(): Promise<CafeDatabase> {
  dbPromise ??= createCafeDatabase();
  return dbPromise;
}
