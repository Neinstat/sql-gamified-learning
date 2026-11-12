import { PGlite } from '@electric-sql/pglite';
import { CAFE_SCHEMA_SQL, CAFE_SEED_SQL } from './data/cafe';

export type CafeDatabase = PGlite;

/** A single cell value as it comes back from the database. */
export type CellValue = string | number | boolean | Date | null | unknown;

export type QueryResult =
  | { ok: true; columns: string[]; rows: CellValue[][] }
  | { ok: false; error: string };

/** Create a fresh in-memory database filled with Grandma's café data. */
export async function createCafeDatabase(): Promise<CafeDatabase> {
  const db = new PGlite();
  await db.exec(CAFE_SCHEMA_SQL);
  await db.exec(CAFE_SEED_SQL);
  return db;
}

const TRANSACTION_CONTROL =
  /^\s*(begin|commit|rollback|end|abort|savepoint|release|start\s+transaction|set\s+transaction)\b/i;

/**
 * Run a player's SQL safely.
 *
 * - Runs inside a READ ONLY transaction that is always rolled back,
 *   so the café data can never be changed or deleted.
 * - Transaction commands (BEGIN/COMMIT/...) are refused, so the player
 *   cannot escape that transaction.
 * - If the SQL has several statements, the result of the last one is shown.
 *
 * Note: PGlite runs on a single thread, so `statement_timeout` does not
 * interrupt a slow query. A runaway query is only a risk for the player's
 * own tab; moving PGlite into a Web Worker (later) will let us cancel it.
 */
export async function runQuery(db: CafeDatabase, sql: string): Promise<QueryResult> {
  const statements = splitStatements(sql);
  if (statements.length === 0) {
    return { ok: false, error: 'Type a query first, e.g. SELECT * FROM menu_items;' };
  }
  if (statements.some((s) => TRANSACTION_CONTROL.test(s))) {
    return { ok: false, error: 'Transaction commands (BEGIN, COMMIT, ROLLBACK…) are not needed here.' };
  }

  await db.exec('BEGIN READ ONLY');
  try {
    const results = await db.exec(sql, { rowMode: 'array' });
    const last = results.at(-1);
    if (!last) {
      return { ok: false, error: 'Type a query first, e.g. SELECT * FROM menu_items;' };
    }
    return {
      ok: true,
      columns: last.fields.map((f) => f.name),
      rows: last.rows as unknown as CellValue[][],
    };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  } finally {
    await db.exec('ROLLBACK');
  }
}

/** List tables and their columns (for the schema browser). */
export async function getSchema(
  db: CafeDatabase,
): Promise<{ table: string; columns: { name: string; type: string }[] }[]> {
  const res = await db.query<{ table_name: string; column_name: string; data_type: string }>(`
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

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/read-only transaction/i.test(message)) {
    return "This console is read-only: you can look at the data, but not change it.";
  }
  return message;
}
