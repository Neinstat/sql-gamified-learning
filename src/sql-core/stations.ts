/**
 * Stations: each one sees a different part of the data (GAME_DESIGN.md §8), which teaches that
 * company data lives in many systems. In the food truck every station is an object the player can
 * use (truck/objects.ts). Pure data: no game engine or UI here.
 */
export type StationId = 'menu-board' | 'cash-register' | 'recipe-book' | 'stock-ledger' | 'back-office';

export const STATIONS: Record<StationId, { tables: readonly string[] }> = {
  'menu-board': { tables: ['menu_items'] },
  // The till knows the menu too, so sales can be joined with menu_items here (Chapter 4).
  'cash-register': { tables: ['sales', 'customers', 'menu_items'] },
  // In the kitchen: what goes into each item, next to the menu it belongs to.
  'recipe-book': { tables: ['recipes', 'menu_items'] },
  // In the storeroom: what came in, from whom, and when it ran out.
  'stock-ledger': { tables: ['inventory', 'suppliers'] },
  // Sees everything: the manager's cases and the Analysis Case.
  'back-office': { tables: ['menu_items', 'sales', 'customers', 'recipes', 'inventory', 'suppliers'] },
};

export const STATION_IDS = Object.keys(STATIONS) as StationId[];

/**
 * Where each station is in the food truck, as players see it in feedback ("that table is at the
 * fridge"). Lower case: used inside sentences.
 */
export const STATION_NAMES: Record<'en' | 'id', Record<StationId, string>> = {
  en: {
    'menu-board': 'menu board',
    'cash-register': 'tablet',
    'recipe-book': 'recipe binders',
    'stock-ledger': 'fridge',
    'back-office': "manager's laptop",
  },
  id: {
    'menu-board': 'papan menu',
    'cash-register': 'tablet',
    'recipe-book': 'binder resep',
    'stock-ledger': 'kulkas',
    'back-office': 'laptop manajer',
  },
};

/** Where a table really lives: the first station that has it (menu_items → the menu board). */
export function homeStation(table: string): StationId | null {
  return STATION_IDS.find((id) => STATIONS[id].tables.includes(table)) ?? null;
}

/**
 * The tables a station shows, keeping only those that exist in the database.
 * A station whose tables do not exist yet is not open.
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
  // EXTRACT(DOW FROM sold_at), SUBSTRING(x FROM 2), TRIM(BOTH FROM x): that FROM is not a table.
  const withoutFunctionFrom = sql.replace(/\b(extract|substring|trim)\s*\([^()]*\)/gi, '$1()');
  const found = [...withoutFunctionFrom.matchAll(/\b(?:from|join)\s+([a-z_][a-z0-9_]*)/gi)].map((m) =>
    m[1].toLowerCase(),
  );
  return [...new Set(found)];
}
