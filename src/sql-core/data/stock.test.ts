/** The stock ledger must tell the same story as the till (GAME_DESIGN.md §11, Chapter 5). */
import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, type LocalCafeDatabase } from '../db';
import { generateSalesData, MILK_DRINKS } from './sales';

let db: LocalCafeDatabase;
beforeAll(async () => {
  db = await createCafeDatabase();
});

const rows = async <T,>(sql: string) => (await db.raw.query<T>(sql)).rows;

describe('stock ledger', () => {
  it('runs out of milk only in October, on the same days the till shows no morning milk drinks', async () => {
    const soldOut = await rows<{ day: string }>(
      "SELECT day FROM inventory WHERE ingredient = 'milk' AND sold_out_at IS NOT NULL ORDER BY day;",
    );
    const { shortMilkDays, sales } = generateSalesData();
    expect(soldOut.map((r) => r.day)).toEqual(shortMilkDays);
    expect(shortMilkDays.every((d) => d.startsWith('2026-10'))).toBe(true);
    const morningMilk = sales.filter(
      (s) => shortMilkDays.includes(s.sold_at.slice(0, 10)) && Number(s.sold_at.slice(11, 13)) < 12 && MILK_DRINKS.includes(s.item_id),
    );
    expect(morningMilk).toEqual([]);
  });

  it('switched milk to Highland Dairy (noon delivery) on 1 October', async () => {
    const milk = await rows<{ name: string; delivery_time: string; since: string }>(
      "SELECT name, delivery_time, since FROM suppliers WHERE product = 'milk' ORDER BY since;",
    );
    expect(milk).toEqual([
      { name: 'Valley Dairy', delivery_time: '06:00:00', since: '2019-03-01' },
      { name: 'Highland Dairy', delivery_time: '12:00:00', since: '2026-10-01' },
    ]);
    const late = await rows<{ n: number }>(
      "SELECT COUNT(*) AS n FROM inventory WHERE ingredient = 'milk' AND day >= '2026-10-01' AND delivered_at <> '12:00';",
    );
    expect(Number(late[0].n)).toBe(0);
  });
});
