/** The Analysis Case: realistic investigations must be accepted as evidence. */
import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, runQuery, type CafeDatabase } from '../db';
import type { ResultSet } from '../checker';
import { checkConclusion, isAnswerRight } from '../cases';
import { findLevel, isCase, type CaseLevel } from './index';

let db: CafeDatabase;
let analysis: CaseLevel;
beforeAll(async () => {
  db = await createCafeDatabase();
  const level = findLevel('ch5-3')!;
  if (!isCase(level)) throw new Error('not a case');
  analysis = level;
});

const pin = async (sql: string) => (await runQuery(db, sql, 'back-office')) as ResultSet & { ok: true };
const correct = (i: number) => {
  const a = analysis.questions[i].answer;
  return a.kind === 'choice' ? a.correct : String(a.value);
};

describe('the Analysis Case', () => {
  it('accepts the drop as 18, 18.4 or 18.36%, but not 19', () => {
    const a = analysis.questions[0].answer;
    for (const given of ['18', '18.4', '18.36%', ' 18 % ']) expect(isAnswerRight(a, given), given).toBe(true);
    for (const given of ['19', '17', '-18']) expect(isAnswerRight(a, given), given).toBe(false);
  });

  it('accepts a month-by-month revenue pin for the drop', async () => {
    const p = await pin(
      "SELECT to_char(sold_at, 'YYYY-MM') AS m, SUM(quantity * unit_price) AS revenue FROM sales GROUP BY 1 ORDER BY 1;",
    );
    expect(await checkConclusion(db, analysis.questions[0], '18', p)).toEqual({ correct: true });
  });

  it('accepts a September-vs-October pivot per item for the item question', async () => {
    const p = await pin(
      `SELECT m.name,
              SUM(CASE WHEN s.sold_at >= '2026-10-01' THEN s.quantity * s.unit_price ELSE 0 END)
            - SUM(CASE WHEN s.sold_at < '2026-10-01' THEN s.quantity * s.unit_price ELSE 0 END) AS change
       FROM sales s JOIN menu_items m ON m.item_id = s.item_id
       WHERE s.sold_at >= '2026-09-01'
       GROUP BY m.name ORDER BY change;`,
    );
    expect(await checkConclusion(db, analysis.questions[1], correct(1), p)).toEqual({ correct: true });
  });

  it('accepts an hour-by-hour October pin for the time question', async () => {
    const p = await pin(
      "SELECT EXTRACT(HOUR FROM sold_at) AS hour, SUM(quantity * unit_price) AS revenue FROM sales WHERE sold_at >= '2026-10-01' GROUP BY 1 ORDER BY 1;",
    );
    expect(await checkConclusion(db, analysis.questions[2], correct(2), p)).toEqual({ correct: true });
  });

  it('accepts the stock ledger or the supplier list for the cause and the advice', async () => {
    const ledger = await pin(
      "SELECT day, delivered_at, sold_out_at FROM inventory WHERE ingredient = 'milk' AND sold_out_at IS NOT NULL ORDER BY day;",
    );
    const suppliers = await pin('SELECT * FROM suppliers;');
    expect(await checkConclusion(db, analysis.questions[3], correct(3), ledger)).toEqual({ correct: true });
    expect(await checkConclusion(db, analysis.questions[3], correct(3), suppliers)).toEqual({ correct: true });
    expect(await checkConclusion(db, analysis.questions[4], correct(4), suppliers)).toEqual({ correct: true });
  });
});
