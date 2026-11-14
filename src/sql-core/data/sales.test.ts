/**
 * The generated till records must keep telling the same stories (GAME_DESIGN.md §11):
 * levels and Mini Cases depend on them. If a change here breaks a test, the data story changed.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, type LocalCafeDatabase } from '../db';
import { CAKE_LOVERS, generateSalesData } from './sales';

let db: LocalCafeDatabase;
beforeAll(async () => {
  db = await createCafeDatabase();
});

async function rows<T>(sql: string): Promise<T[]> {
  return (await db.raw.query<T>(sql)).rows;
}
const num = (v: unknown) => Number(v);

describe('generated sales', () => {
  it('is the same every time (fixed seed)', () => {
    expect(generateSalesData()).toEqual(generateSalesData());
  });

  it('charges the menu price, and never sells Hot Chocolate (no price) or the Pumpkin Spice Latte', async () => {
    const wrong = await rows('SELECT s.sale_id FROM sales s JOIN menu_items m USING (item_id) WHERE s.unit_price <> m.price;');
    expect(wrong).toEqual([]);
    const never = await rows("SELECT DISTINCT m.name FROM sales s JOIN menu_items m USING (item_id) WHERE m.name IN ('Hot Chocolate', 'Pumpkin Spice Latte');");
    expect(never).toEqual([]);
  });

  it('only has sales from August to October, during opening hours (7:00–17:59)', async () => {
    const [r] = await rows<{ first: Date; last: Date; early: number; late: number }>(
      'SELECT min(sold_at) AS first, max(sold_at) AS last, min(extract(hour FROM sold_at)) AS early, max(extract(hour FROM sold_at)) AS late FROM sales;',
    );
    expect(r.first.toISOString() >= '2026-08-01').toBe(true);
    expect(r.last.toISOString() < '2026-11-01').toBe(true);
    expect(num(r.early)).toBe(7);
    expect(num(r.late)).toBe(17);
  });

  it("sold Grandma's Secret Cake only in August", async () => {
    const months = await rows<{ m: string }>(
      "SELECT DISTINCT to_char(sold_at, 'YYYY-MM') AS m FROM sales s JOIN menu_items m USING (item_id) WHERE m.name = 'Grandma''s Secret Cake';",
    );
    expect(months.map((r) => r.m)).toEqual(['2026-08']);
  });

  it('has nobody ordering before they joined, and 5 customers who never ordered', async () => {
    expect(await rows('SELECT s.sale_id FROM sales s JOIN customers c USING (customer_id) WHERE s.sold_at::date < c.joined_on;')).toEqual([]);
    const [r] = await rows<{ n: number }>('SELECT count(*) AS n FROM customers c WHERE NOT EXISTS (SELECT 1 FROM sales s WHERE s.customer_id = c.customer_id);');
    expect(num(r.n)).toBe(5);
  });
});

describe('hidden patterns', () => {
  it('Chapter 3: Tuesday has the lowest revenue, because of fewer orders (normal order size)', async () => {
    const days = await rows<{ dow: number; revenue: string; orders: number }>(
      'SELECT extract(dow FROM sold_at) AS dow, sum(quantity * unit_price) AS revenue, count(DISTINCT order_id) AS orders FROM sales GROUP BY 1 ORDER BY 2;',
    );
    expect(num(days[0].dow)).toBe(2);
    const aov = (d: (typeof days)[number]) => num(d.revenue) / num(d.orders);
    const overall = days.reduce((s, d) => s + num(d.revenue), 0) / days.reduce((s, d) => s + num(d.orders), 0);
    expect(Math.abs(aov(days[0]) / overall - 1)).toBeLessThan(0.05);
    expect(num(days[0].orders)).toBeLessThan(num(days[1].orders) * 0.7);
  });

  it('Chapter 4: exactly the four cake-loving regulars stopped coming after August', async () => {
    const gone = await rows<{ customer_id: number }>(
      "SELECT customer_id FROM sales WHERE customer_id IS NOT NULL GROUP BY customer_id HAVING count(DISTINCT order_id) >= 10 AND max(sold_at) < '2026-09-01' ORDER BY 1;",
    );
    expect(gone.map((r) => r.customer_id)).toEqual(CAKE_LOVERS);
  });

  it('Chapter 5: October revenue is 18% below September, and Latte fell the most', async () => {
    const months = await rows<{ m: string; revenue: string }>(
      "SELECT to_char(sold_at, 'YYYY-MM') AS m, sum(quantity * unit_price) AS revenue FROM sales GROUP BY 1 ORDER BY 1;",
    );
    const [sep, oct] = [num(months[1].revenue), num(months[2].revenue)];
    expect(Math.round((1 - oct / sep) * 100)).toBe(18);
    const [top] = await rows<{ name: string }>(
      `SELECT m.name FROM sales s JOIN menu_items m USING (item_id)
       GROUP BY m.name
       ORDER BY sum(CASE WHEN sold_at >= '2026-10-01' THEN quantity * unit_price ELSE 0 END)
              - sum(CASE WHEN sold_at >= '2026-09-01' AND sold_at < '2026-10-01' THEN quantity * unit_price ELSE 0 END)
       LIMIT 1;`,
    );
    expect(top.name).toBe('Latte');
  });
});
