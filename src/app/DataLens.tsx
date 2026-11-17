import { useEffect, useState } from 'react';
import type { UiText } from '../i18n';
import { runQuery, type CafeDatabase, type CellValue } from '../sql-core/db';
import type { LensCard } from '../game/truck/bridge';

/** What a card shows about one table. */
type TableSummary = { columns: string[]; rows: CellValue[][]; count: number };

/** Columns and sample rows shown on a card (cards are small). */
const MAX_COLUMNS = 4;
const SAMPLE_ROWS = 2;
const MAX_CELL = 14;

/**
 * Loads a short summary of each table for the Data Lens: its row count and first rows.
 * Runs as the database owner, read-only, like the checker's own reference queries.
 */
export function useTableSummaries(
  db: CafeDatabase | null,
  tables: string[],
  /** Bump to reload (e.g. after a sale changed `sales`). */
  version = 0,
): Record<string, TableSummary> {
  const [summaries, setSummaries] = useState<Record<string, TableSummary>>({});
  const key = tables.join(',');
  useEffect(() => {
    if (!db || !key) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, TableSummary> = {};
      for (const table of key.split(',')) {
        const [sample, count] = await Promise.all([
          runQuery(db, `SELECT * FROM ${table} LIMIT ${SAMPLE_ROWS};`),
          runQuery(db, `SELECT COUNT(*) AS n FROM ${table};`),
        ]);
        if (sample.ok && count.ok) next[table] = { columns: sample.columns, rows: sample.rows, count: Number(count.rows[0][0]) };
      }
      if (!cancelled) setSummaries(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [db, key, version]);
  return summaries;
}

const cell = (value: CellValue) => {
  const text = value === null ? 'NULL' : String(value);
  return text.length > MAX_CELL ? `${text.slice(0, MAX_CELL - 1)}…` : text;
};

/**
 * The Data Lens (GAME_DESIGN.md §7): a card over every object with its tables — names, row counts,
 * and a couple of rows. The tables the current order needs are starred, and their rows are shown.
 */
export function DataLens({
  cards,
  summaries,
  needed,
  t,
}: {
  cards: LensCard[];
  summaries: Record<string, TableSummary>;
  /** Tables the order at the window needs. */
  needed: string[];
  t: UiText;
}) {
  return (
    <div className="lens-layer" aria-label={t.dataLens}>
      {cards.map((card) => {
        // Nearer cards are a little bigger, so the one you look at stands out.
        const scale = Math.max(0.62, Math.min(1, 1.7 / Math.max(card.distance, 0.1)));
        const anyNeeded = card.tables.some((table) => needed.includes(table));
        // Sample rows for the table the order needs, otherwise for the card's first table.
        const focus = card.tables.find((table) => needed.includes(table)) ?? card.tables[0];
        const summary = summaries[focus];
        const columns = summary?.columns ?? [];
        const shown = columns.slice(0, MAX_COLUMNS);
        return (
          <div
            key={card.id}
            className={anyNeeded ? 'lens-card lens-card-needed' : 'lens-card'}
            style={{ left: `${card.x * 100}%`, top: `${card.y * 100}%`, transform: `translate(-50%, -100%) scale(${scale})` }}
          >
            {card.tables.map((table) => (
              <p key={table} className={needed.includes(table) ? 'lens-card-head lens-card-head-needed' : 'lens-card-head'}>
                <code className="lens-card-table">
                  {needed.includes(table) ? '★ ' : ''}
                  {table}
                </code>
                {summaries[table] && <span className="lens-card-count">{t.lensRows(summaries[table].count)}</span>}
              </p>
            ))}
            {anyNeeded && <p className="lens-card-needed-label">{t.lensNeeded}</p>}
            {summary && (
              <table className="lens-card-rows">
                <thead>
                  <tr>
                    {shown.map((c) => (
                      <th key={c}>{c}</th>
                    ))}
                    {columns.length > shown.length && <th>+{columns.length - shown.length}</th>}
                  </tr>
                </thead>
                <tbody>
                  {summary.rows.map((row, i) => (
                    <tr key={i}>
                      {shown.map((c, j) => (
                        <td key={c}>{cell(row[j])}</td>
                      ))}
                      {columns.length > shown.length && <td>…</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
