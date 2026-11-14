import { PGlite, types } from '@electric-sql/pglite';

const { DATE, TIME, TIMESTAMP, TIMESTAMPTZ } = types;
import { CAFE_SCHEMA_SQL, CAFE_SEED_SQL } from './data/cafe';
import { SALES_SCHEMA_SQL, salesSeedSql } from './data/sales';
import { RECIPES_SCHEMA_SQL, recipesSeedSql } from './data/recipes';
import { STOCK_SCHEMA_SQL, stockSeedSql } from './data/stock';
import type { Feedback } from './feedback';
import { STATION_IDS, STATIONS, homeStation, type StationId } from './stations';

/** A table and its columns, for the schema browser. */
export type TableInfo = { table: string; columns: { name: string; type: string }[] };

/**
 * Grandma's café database, wherever it runs: in this thread (tests, and inside the Web Worker)
 * or in a Web Worker (the browser, so a runaway query can be stopped).
 */
export interface CafeDatabase {
  /** Run a player's SQL safely; `station` limits it to the tables that station can see. */
  run(sql: string, station?: StationId): Promise<QueryResult>;
  schema(): Promise<TableInfo[]>;
  /** Stop a running query (only possible when the database runs in a worker). */
  stop?(): void;
}

/** A single cell value as it comes back from the database. */
export type CellValue = string | number | boolean | Date | null | unknown;

export type QueryResult =
  | { ok: true; columns: string[]; rows: CellValue[][] }
  | { ok: false; error: Feedback };

/** The PostgreSQL role a station's console runs as: it may only read that station's tables. */
export const stationRole = (station: StationId) => `station_${station.replace(/-/g, '_')}`;

/** Create a fresh in-memory database filled with Grandma's café data. */
export async function createCafeDatabase(): Promise<LocalCafeDatabase> {
  // Dates and times come back exactly as PostgreSQL writes them ('2026-08-01 07:05:00'),
  // not as JavaScript Dates, which would shift with the player's time zone.
  const asText = (value: string) => value;
  const pg = new PGlite({ parsers: { [DATE]: asText, [TIME]: asText, [TIMESTAMP]: asText, [TIMESTAMPTZ]: asText } });
  await pg.exec(CAFE_SCHEMA_SQL);
  await pg.exec(CAFE_SEED_SQL);
  await pg.exec(SALES_SCHEMA_SQL);
  await pg.exec(salesSeedSql());
  await pg.exec(RECIPES_SCHEMA_SQL);
  await pg.exec(recipesSeedSql());
  await pg.exec(STOCK_SCHEMA_SQL);
  await pg.exec(stockSeedSql());
  await pg.exec(stationRolesSql());
  return new LocalCafeDatabase(pg);
}

/**
 * One role per station with SELECT on its own tables only (GAME_DESIGN.md §10), so a query to
 * another station's table fails like in a real company. `set_config` is taken away from everyone
 * but the owner, so a player can't use it to switch back to the all-seeing role.
 */
function stationRolesSql(): string {
  return [
    ...STATION_IDS.map((station) => {
      const role = stationRole(station);
      return `CREATE ROLE ${role} NOLOGIN; GRANT SELECT ON ${STATIONS[station].tables.join(', ')} TO ${role};`;
    }),
    'REVOKE EXECUTE ON FUNCTION set_config(text, text, boolean) FROM PUBLIC;',
  ].join('\n');
}

const TRANSACTION_CONTROL =
  /^\s*(begin|commit|rollback|end|abort|savepoint|release|start\s+transaction|set\s+transaction)\b/i;
/** Commands that could switch roles (SET ROLE, RESET ROLE, a DO block running them): never needed to query. */
const SESSION_CONTROL = /^\s*(set|reset|do)\b/i;

/** The database in this thread. `raw` is the PGlite instance, for tests. */
export class LocalCafeDatabase implements CafeDatabase {
  constructor(readonly raw: PGlite) {}

  /**
   * Run a player's SQL safely.
   *
   * - Runs inside a READ ONLY transaction that is always rolled back,
   *   so the café data can never be changed or deleted.
   * - Transaction and SET/RESET/DO commands are refused, so the player can escape neither
   *   the transaction nor the station's role.
   * - With a station, the query runs as that station's role (see stationRolesSql).
   * - If the SQL has several statements, the result of the last one is shown.
   *
   * PGlite runs on a single thread, so `statement_timeout` can't interrupt a slow query:
   * in the browser the database runs in a Web Worker, which can be stopped instead.
   */
  async run(sql: string, station?: StationId): Promise<QueryResult> {
    const statements = splitStatements(sql);
    if (statements.length === 0) {
      return { ok: false, error: { kind: 'empty-query' } };
    }
    if (statements.some((s) => TRANSACTION_CONTROL.test(s))) {
      return { ok: false, error: { kind: 'transaction' } };
    }
    if (statements.some((s) => SESSION_CONTROL.test(s))) {
      return { ok: false, error: { kind: 'not-a-query' } };
    }

    await this.raw.exec('BEGIN READ ONLY');
    try {
      if (station) await this.raw.exec(`SET LOCAL ROLE ${stationRole(station)}`);
      const results = await this.raw.exec(sql, { rowMode: 'array' });
      const last = results.at(-1);
      if (!last) {
        return { ok: false, error: { kind: 'empty-query' } };
      }
      return {
        ok: true,
        columns: last.fields.map((f) => f.name),
        rows: last.rows as unknown as CellValue[][],
      };
    } catch (err) {
      return { ok: false, error: friendlyError(err) };
    } finally {
      await this.raw.exec('ROLLBACK');
    }
  }

  async schema(): Promise<TableInfo[]> {
    const res = await this.raw.query<{ table_name: string; column_name: string; data_type: string }>(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);
    const tables = new Map<string, { name: string; type: string }[]>();
    for (const r of res.rows) {
      if (!tables.has(r.table_name)) tables.set(r.table_name, []);
      tables.get(r.table_name)!.push({ name: r.column_name, type: r.data_type });
    }
    return [...tables].map(([table, columns]) => ({ table, columns }));
  }
}

/** Run a player's SQL (see LocalCafeDatabase.run). */
export function runQuery(db: CafeDatabase, sql: string, station?: StationId): Promise<QueryResult> {
  return db.run(sql, station);
}

/** List tables and their columns (for the schema browser). */
export function getSchema(db: CafeDatabase): Promise<TableInfo[]> {
  return db.schema();
}

/**
 * Rough split on semicolons, ignoring those inside quotes and comments.
 * Only used to check for empty input and transaction commands.
 */
function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let current = '';
  let quote: string | null = null;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
    } else if (ch === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
    } else if (ch === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? sql.length : end + 1;
      current += ' ';
    } else if (ch === ';') {
      out.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.map((s) => s.trim()).filter(Boolean);
}

function friendlyError(err: unknown): Feedback {
  const message = err instanceof Error ? err.message : String(err);
  if (/read-only transaction/i.test(message)) return { kind: 'read-only' };

  const near = message.match(/^syntax error at or near "(.*)"$/);
  if (near) return { kind: 'syntax-error', near: near[1] };
  if (/^syntax error at end of input$/.test(message)) return { kind: 'syntax-error', near: null };

  const column = message.match(/^column "(.*)" does not exist$/);
  if (column) return { kind: 'unknown-column', name: column[1] };

  const table = message.match(/^relation "(.*)" does not exist$/);
  if (table) return { kind: 'unknown-table', name: table[1] };

  const denied = message.match(/^permission denied for table (.*)$/);
  if (denied) return { kind: 'other-station', table: denied[1], station: homeStation(denied[1]) };

  return { kind: 'sql-error', message };
}
