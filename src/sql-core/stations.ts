/**
 * Stations: the places in the café where the SQL console can be opened.
 * Each one sees a different part of the data (GAME_DESIGN.md §3), which teaches that
 * company data lives in many systems. Pure data: no game engine or UI here.
 */
export type StationId = 'menu-board' | 'cash-register';

export const STATIONS: Record<StationId, { tables: readonly string[] }> = {
  'menu-board': { tables: ['menu_items'] },
  'cash-register': { tables: ['sales', 'customers'] },
};

export const STATION_IDS = Object.keys(STATIONS) as StationId[];

/**
 * The tables a station shows, keeping only those that exist in the database.
 * A station whose tables do not exist yet (e.g. `sales` before Chapter 3) is not open.
 */
export function stationTables<T extends { table: string }>(station: StationId, schema: readonly T[]): T[] {
  const allowed = STATIONS[station].tables;
  return schema.filter((t) => allowed.includes(t.table));
}

/**
 * Table names a query reads, found after FROM and JOIN. A simple scan that is good
 * enough for our own level solutions (used by tests, not for grading players).
 */
export function tablesInQuery(sql: string): string[] {
  const found = [...sql.matchAll(/\b(?:from|join)\s+([a-z_][a-z0-9_]*)/gi)].map((m) => m[1].toLowerCase());
  return [...new Set(found)];
}
