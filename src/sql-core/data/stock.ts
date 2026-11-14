/**
 * The storeroom's stock ledger (GAME_DESIGN.md §11): `suppliers` and `inventory`.
 * Made from the same seed as the sales, so the two always agree.
 *
 * The Chapter 5 story: on 1 October Grandma switched milk to Highland Dairy — cheaper, but it
 * delivers at noon instead of 6 in the morning. On many October days yesterday's milk was gone
 * soon after opening, so no milk drinks until the delivery: exactly the mornings when the sales
 * of lattes and cappuccinos collapse (see sales.ts).
 */
import { generateSalesData } from './sales';

export const STOCK_SCHEMA_SQL = `
CREATE TABLE suppliers (
  supplier_id    INTEGER PRIMARY KEY,
  name           TEXT NOT NULL,
  product        TEXT NOT NULL,
  delivery_time  TIME NOT NULL,
  price_per_unit NUMERIC(5, 2) NOT NULL,
  unit           TEXT NOT NULL,
  since          DATE NOT NULL,
  until          DATE
);

CREATE TABLE inventory (
  stock_id     INTEGER PRIMARY KEY,
  day          DATE NOT NULL,
  ingredient   TEXT NOT NULL,
  supplier_id  INTEGER NOT NULL REFERENCES suppliers (supplier_id),
  delivered    NUMERIC(6, 1) NOT NULL,
  unit         TEXT NOT NULL,
  delivered_at TIME NOT NULL,
  sold_out_at  TIME
);
`;

const SUPPLIERS = [
  [1, 'Valley Dairy', 'milk', '06:00', 1.1, 'L', '2019-03-01', '2026-09-30'],
  [2, 'Highland Dairy', 'milk', '12:00', 0.85, 'L', '2026-10-01', null],
  [3, 'Hillside Roasters', 'coffee beans', '07:00', 18.5, 'kg', '2020-05-01', null],
  [4, 'Mill & Grain', 'flour', '08:00', 1.2, 'kg', '2018-01-15', null],
  [5, 'Orchard Farm', 'fruit', '09:00', 2.4, 'kg', '2021-06-01', null],
] as const;

/** Same mulberry32 as sales.ts, with its own seed: minutes for the sold-out times. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n: number) => String(n).padStart(2, '0');
const sql = (v: string | number | null) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${v}'`);

export function stockSeedSql(): string {
  const { shortMilkDays } = generateSalesData();
  const rand = random(612);
  const rows: string[] = [];
  let id = 0;
  for (let t = Date.UTC(2026, 7, 1); t <= Date.UTC(2026, 9, 31); t += 86400000) {
    const d = new Date(t);
    const day = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    const october = d.getUTCMonth() === 9;
    // Milk: Valley Dairy at 6:00 until September; Highland Dairy at noon from October.
    const soldOut = shortMilkDays.includes(day) ? `07:${pad(5 + Math.floor(rand() * 50))}` : null;
    rows.push(
      [++id, sql(day), "'milk'", october ? 2 : 1, 40, "'L'", october ? "'12:00'" : "'06:00'", sql(soldOut)].join(', '),
      [++id, sql(day), "'coffee beans'", 3, 3, "'kg'", "'07:00'", 'NULL'].join(', '),
      [++id, sql(day), "'flour'", 4, 5, "'kg'", "'08:00'", 'NULL'].join(', '),
    );
  }
  const suppliers = SUPPLIERS.map((s) => `(${s.map(sql).join(', ')})`).join(',\n');
  return [
    `INSERT INTO suppliers (supplier_id, name, product, delivery_time, price_per_unit, unit, since, until) VALUES\n${suppliers};`,
    `INSERT INTO inventory (stock_id, day, ingredient, supplier_id, delivered, unit, delivered_at, sold_out_at) VALUES\n${rows
      .map((r) => `(${r})`)
      .join(',\n')};`,
  ].join('\n');
}
