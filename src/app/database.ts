import { createCafeDatabase, type CafeDatabase } from '../sql-core/db';
import { WorkerCafeDatabase } from './workerDatabase';

let dbPromise: Promise<CafeDatabase> | null = null;

/**
 * One shared café database for the whole page (created on first use).
 * It runs in a Web Worker so a slow query can be stopped; if the browser can't start the
 * worker, it falls back to this thread (queries then can't be stopped).
 */
export function getDatabase(): Promise<CafeDatabase> {
  dbPromise ??= openInWorker().catch((err) => {
    console.warn('Database worker unavailable, running in the page instead:', err);
    return createCafeDatabase();
  });
  return dbPromise;
}

async function openInWorker(): Promise<CafeDatabase> {
  if (typeof Worker === 'undefined') throw new Error('No Web Worker support');
  const db = new WorkerCafeDatabase();
  await db.whenReady();
  return db;
}
