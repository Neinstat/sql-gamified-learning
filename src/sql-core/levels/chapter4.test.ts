/** Chapter 4: other correct ways to write a JOIN must be accepted too. */
import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, runQuery, type CafeDatabase } from '../db';
import { checkAnswer, type ResultSet } from '../checker';
import { checkConclusion } from '../cases';
import { findLevel, isCase, type RequestLevel } from './index';

let db: CafeDatabase;
beforeAll(async () => {
  db = await createCafeDatabase();
});

const level = (id: string) => findLevel(id) as RequestLevel;
const verdict = async (id: string, sql: string) =>
  (await checkAnswer(db, sql, level(id).solution, level(id).check, level(id).station)).verdict.correct;

describe('chapter 4', () => {
  it('ch4-1 accepts the tables in the other order, and without aliases', async () => {
    expect(
      await verdict(
        'ch4-1',
        "SELECT menu_items.name, recipes.amount FROM menu_items JOIN recipes ON recipes.item_id = menu_items.item_id WHERE recipes.ingredient = 'milk';",
      ),
    ).toBe(true);
  });

  it('ch4-2 accepts NOT EXISTS, and rejects a plain JOIN', async () => {
    expect(
      await verdict('ch4-2', 'SELECT name FROM menu_items m WHERE NOT EXISTS (SELECT 1 FROM recipes r WHERE r.item_id = m.item_id);'),
    ).toBe(true);
    expect(
      await verdict('ch4-2', 'SELECT m.name FROM menu_items m JOIN recipes r ON r.item_id = m.item_id WHERE r.recipe_id IS NULL;'),
    ).toBe(false);
  });

  it('ch4-7 accepts names found by a HAVING query, and cake units found by customer name', async () => {
    const regulars = findLevel('ch4-7')!;
    if (!isCase(regulars)) throw new Error('not a case');
    const pin = async (sql: string) => (await runQuery(db, sql, 'cash-register')) as ResultSet & { ok: true };
    const gone = await pin(
      "SELECT c.name, MAX(s.sold_at) AS last_visit FROM customers c JOIN sales s USING (customer_id) GROUP BY c.name HAVING COUNT(DISTINCT s.order_id) >= 10 AND MAX(s.sold_at) < '2026-09-01';",
    );
    expect(await checkConclusion(db, regulars.questions[0], '4', gone)).toEqual({ correct: true });
    const ordered = await pin(
      "SELECT m.name, SUM(s.quantity) AS units FROM sales s JOIN menu_items m ON m.item_id = s.item_id JOIN customers c ON c.customer_id = s.customer_id WHERE c.name IN ('Chloe Diaz', 'Grace Hughes', 'Lily Lopez', 'Noah Owens') GROUP BY m.name ORDER BY units DESC;",
    );
    expect(await checkConclusion(db, regulars.questions[1], 1, ordered)).toEqual({ correct: true });
  });
});
