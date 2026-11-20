import { createCafeDatabase, type CafeDatabase } from '../sql-core/db';
import { daySalesSql, type DayLog } from '../sql-core/truck/day';
import { WorkerCafeDatabase } from './workerDatabase';

let dbPromise: Promise<CafeDatabase> | null = null;
let dayPromise: Promise<CafeDatabase> | null = null;

/**
 * The database with every play day's sales already in it: the saved day logs (past days, then
 * today) are replayed once, before anyone can query, so `sales` always shows what the player
 * served (GAME_DESIGN.md §8).
 */
export function getDayDatabase(days: readonly DayLog[]): Promise<CafeDatabase> {
  dayPromise ??= getDatabase().then(async (db) => {
    for (const sql of days.flatMap(daySalesSql)) await db.write(sql);
    return db;
  });
  return dayPromise;
}

/**
 * One shared database for the whole page (created on first use).
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
