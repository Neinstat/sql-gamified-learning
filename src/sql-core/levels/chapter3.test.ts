/** Chapter 3 answers that players are likely to write differently: check the checker's verdict. */
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

describe('chapter 3', () => {
  it('ch3-3 rejects AVG of the rows as the average order value', async () => {
    expect(
      await verdict('ch3-3', 'SELECT COUNT(DISTINCT order_id) AS orders, ROUND(AVG(quantity * unit_price), 2) FROM sales;'),
    ).toBe(false);
  });

  it('ch3-6 leaves out the item that sold exactly 400 (> not >=)', async () => {
    expect(
      await verdict('ch3-6', 'SELECT item_id, SUM(quantity) AS units FROM sales GROUP BY item_id HAVING SUM(quantity) >= 400;'),
    ).toBe(false);
  });

  it('ch3-7 accepts evidence grouped by weekday name instead of number', async () => {
    const quiet = findLevel('ch3-7')!;
    if (!isCase(quiet)) throw new Error('not a case');
    const pinned = (await runQuery(
      db,
      "SELECT to_char(sold_at, 'Day') AS day, SUM(quantity * unit_price), COUNT(DISTINCT order_id) FROM sales GROUP BY 1;",
      'cash-register',
    )) as ResultSet & { ok: true };
    for (const [i, q] of quiet.questions.entries()) {
      const given = q.answer.kind === 'choice' ? q.answer.correct : null;
      expect(await checkConclusion(db, q, given, pinned), `question ${i + 1}`).toEqual({ correct: true });
    }
  });
});
