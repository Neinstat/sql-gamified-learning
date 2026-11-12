import { runQuery, type CafeDatabase, type CellValue, type QueryResult } from './db';
import type { Feedback } from './feedback';

/** A successful query result: column names + rows. */
export type ResultSet = { columns: string[]; rows: CellValue[][] };

export type CheckOptions = {
  /**
   * Must the rows be in the same order as the solution?
   * Default: only when the solution uses ORDER BY.
   */
  orderMatters?: boolean;
  /**
   * Must column names match exactly (e.g. a level that teaches aliases)?
   * Default: false — names are only used to line up columns.
   */
  checkColumnNames?: boolean;
};

export type Verdict = { correct: true } | { correct: false; feedback: Feedback };

export type CheckOutcome = {
  /** The player's own result, to show in the console. */
  result: QueryResult;
  verdict: Verdict;
};

/**
 * Run the player's SQL and the level's solution, then compare the results.
 * The query text itself is never graded — only what it returns.
 */
export async function checkAnswer(
  db: CafeDatabase,
  playerSql: string,
  solutionSql: string,
  options: CheckOptions = {},
): Promise<CheckOutcome> {
  const result = await runQuery(db, playerSql);
  if (!result.ok) {
    return { result, verdict: { correct: false, feedback: result.error } };
  }

  const expected = await runQuery(db, solutionSql);
  if (!expected.ok) {
    // A broken solution is a bug in the level data, not the player's fault.
    throw new Error(`Level solution failed: ${JSON.stringify(expected.error)}`);
  }

  const orderMatters = options.orderMatters ?? usesOrderBy(solutionSql);
  const verdict = compareResults(result, expected, { ...options, orderMatters });
  return { result, verdict };
}

/** Compare two result sets and explain the first difference found. */
export function compareResults(
  actual: ResultSet,
  expected: ResultSet,
  options: CheckOptions = {},
): Verdict {
  // 1. Columns
  const columnCheck = alignColumns(actual.columns, expected.columns, options.checkColumnNames ?? false);
  if (!columnCheck.ok) return { correct: false, feedback: columnCheck.feedback };
  const aligned = actual.rows.map((row) => columnCheck.order.map((i) => row[i]));

  // When columns were matched by position (names differ), a wrong value may
  // simply mean a wrong column — say so instead of blaming a row.
  const columnHint: Feedback | null = columnCheck.byName
    ? null
    : { kind: 'check-columns', actual: actual.columns, expected: expected.columns };

  // 2. Row count
  if (aligned.length !== expected.rows.length) {
    return {
      correct: false,
      feedback: { kind: 'row-count', actual: aligned.length, expected: expected.rows.length },
    };
  }

  // 3. Row values (ignoring order)
  const actualKeys = aligned.map(rowKey);
  const expectedKeys = expected.rows.map(rowKey);
  const remaining = countKeys(expectedKeys);
  for (let i = 0; i < actualKeys.length; i++) {
    const left = remaining.get(actualKeys[i]) ?? 0;
    if (left === 0) {
      if (columnHint) return { correct: false, feedback: columnHint };
      return { correct: false, feedback: { kind: 'unexpected-row', row: describeRow(actual.rows[i]) } };
    }
    remaining.set(actualKeys[i], left - 1);
  }

  // 4. Row order
  if (options.orderMatters && actualKeys.some((key, i) => key !== expectedKeys[i])) {
    return { correct: false, feedback: { kind: 'wrong-order' } };
  }

  return { correct: true };
}

/** True if the SQL contains ORDER BY outside of quotes and comments. */
export function usesOrderBy(sql: string): boolean {
  const stripped = sql
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/'(?:[^']|'')*'/g, "''");
  return /\border\s+by\b/i.test(stripped);
}

type ColumnAlignment =
  | { ok: true; order: number[]; byName: boolean }
  | { ok: false; feedback: Feedback };

/**
 * Work out which of the player's columns matches each expected column.
 * - Same names (in any order) → match by name, so `SELECT price, name` is fine.
 * - Otherwise → match by position, so aliases like `price AS cost_usd` are fine.
 */
function alignColumns(actual: string[], expected: string[], checkNames: boolean): ColumnAlignment {
  const norm = (s: string) => s.toLowerCase();
  const actualNames = actual.map(norm);
  const expectedNames = expected.map(norm);

  if (actual.length !== expected.length) {
    const missing = expected.filter((c) => !actualNames.includes(norm(c)));
    const extra = actual.filter((c) => !expectedNames.includes(norm(c)));
    if (actual.length < expected.length && missing.length > 0) {
      return { ok: false, feedback: { kind: 'missing-columns', columns: missing } };
    }
    if (actual.length > expected.length && extra.length > 0) {
      return { ok: false, feedback: { kind: 'extra-columns', columns: extra } };
    }
    return { ok: false, feedback: { kind: 'column-count', actual: actual.length, expected: expected.length } };
  }

  const byName = matchByName(actualNames, expectedNames);
  if (byName) return { ok: true, order: byName, byName: true };

  if (checkNames) {
    const i = expectedNames.findIndex((name, idx) => name !== actualNames[idx]);
    return { ok: false, feedback: { kind: 'column-name', actual: actual[i], expected: expected[i] } };
  }
  return { ok: true, order: actual.map((_, i) => i), byName: false };
}

function matchByName(actual: string[], expected: string[]): number[] | null {
  const used = new Set<number>();
  const order: number[] = [];
  for (const name of expected) {
    const idx = actual.findIndex((a, i) => a === name && !used.has(i));
    if (idx === -1) return null;
    used.add(idx);
    order.push(idx);
  }
  return order;
}

/** Turn a row into a comparable string, treating 4, 4.0 and "4.00" as equal. */
function rowKey(row: CellValue[]): string {
  return JSON.stringify(row.map(normalizeValue));
}

const NUMERIC = /^-?\d+(\.\d+)?$/;

function normalizeValue(value: CellValue): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return roundNumber(value);
  if (typeof value === 'bigint') return roundNumber(Number(value));
  if (typeof value === 'string' && NUMERIC.test(value)) return roundNumber(Number(value));
  if (typeof value === 'boolean' || typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

/** Round to 6 decimals so 0.1 + 0.2 and 0.3 compare equal. */
function roundNumber(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

function countKeys(keys: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  return counts;
}

function describeRow(row: CellValue[]): string {
  return row
    .map((v) => {
      if (v === null || v === undefined) return 'NULL';
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      return String(v);
    })
    .join(', ');
}
