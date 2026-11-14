import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, runQuery, type CafeDatabase } from './db';
import { checkConclusion, checkEvidence, isAnswerRight } from './cases';
import type { ResultSet } from './checker';
import type { CaseAnswer, CaseQuestion } from './levels/types';

let db: CafeDatabase;
beforeAll(async () => {
  db = await createCafeDatabase();
});

async function result(sql: string): Promise<ResultSet> {
  const r = await runQuery(db, sql);
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r;
}

describe('isAnswerRight', () => {
  it('accepts numbers written loosely', () => {
    const answer: CaseAnswer = { kind: 'number', value: 4 };
    for (const given of ['4', ' 4 ', '4.0', '$4', 4]) expect(isAnswerRight(answer, given)).toBe(true);
    for (const given of ['5', 'four', '', null]) expect(isAnswerRight(answer, given)).toBe(false);
  });

  it('checks the chosen index for multiple choice', () => {
    const answer: CaseAnswer = { kind: 'choice', choices: ['a', 'b'], correct: 1 };
    expect(isAnswerRight(answer, 1)).toBe(true);
    expect(isAnswerRight(answer, 0)).toBe(false);
  });
});

describe('checkEvidence', () => {
  const noPrice = { sql: 'SELECT name, price FROM menu_items WHERE price IS NULL;' };

  it('accepts a focused result with extra columns, in any column order', async () => {
    const pinned = await result('SELECT price, category, name FROM menu_items WHERE price IS NULL OR cost IS NULL;');
    expect(await checkEvidence(db, pinned, noPrice)).toEqual({ correct: true });
  });

  it('asks for a missing column', async () => {
    const pinned = await result('SELECT name FROM menu_items WHERE price IS NULL;');
    expect(await checkEvidence(db, pinned, noPrice)).toEqual({
      correct: false,
      feedback: { kind: 'evidence-missing-column', column: 'price' },
    });
  });

  it('matches a differently named column by its values', async () => {
    const revenue = { sql: "SELECT SUM(quantity * unit_price) AS revenue FROM sales WHERE channel = 'delivery';" };
    const pinned = await result('SELECT channel, SUM(quantity * unit_price) AS total FROM sales GROUP BY channel;');
    expect(await checkEvidence(db, pinned, revenue)).toEqual({ correct: true });
    const unnamed = await result('SELECT channel, SUM(quantity * unit_price) FROM sales GROUP BY 1;');
    expect(await checkEvidence(db, unnamed, revenue)).toEqual({ correct: true });
    const wrong = await result('SELECT channel, COUNT(*) AS lines FROM sales GROUP BY channel;');
    expect(await checkEvidence(db, wrong, revenue)).toEqual({
      correct: false,
      feedback: { kind: 'evidence-missing-rows', missing: 1 },
    });
  });

  it('notices missing rows', async () => {
    const pinned = await result("SELECT name, price FROM menu_items WHERE category = 'coffee';");
    expect(await checkEvidence(db, pinned, noPrice)).toEqual({
      correct: false,
      feedback: { kind: 'evidence-missing-rows', missing: 1 },
    });
  });

  it('refuses the whole table as evidence', async () => {
    const pinned = await result('SELECT * FROM menu_items;');
    expect(await checkEvidence(db, pinned, noPrice)).toEqual({
      correct: false,
      feedback: { kind: 'evidence-too-broad', actual: 28, max: 6 },
    });
  });

  it('needs exactly the right rows when the evidence is exact', async () => {
    const exact = {
      sql: 'SELECT name FROM menu_items WHERE price IS NULL OR cost IS NULL OR category IS NULL;',
      exact: true,
    };
    const tooMany = await result(
      'SELECT name FROM menu_items WHERE price IS NULL OR cost IS NULL OR category IS NULL OR is_available = FALSE;',
    );
    expect(await checkEvidence(db, tooMany, exact)).toEqual({
      correct: false,
      feedback: { kind: 'evidence-extra-rows', actual: 6, expected: 4 },
    });
  });
});

describe('checkConclusion', () => {
  const question: CaseQuestion = {
    prompt: 'Which item has no price?',
    answer: { kind: 'choice', choices: ['Banana Bread', 'Hot Chocolate'], correct: 1 },
    evidence: { sql: 'SELECT name, price FROM menu_items WHERE price IS NULL;' },
  };

  it('checks the answer first, then asks for evidence', async () => {
    const pinned = await result('SELECT name, price FROM menu_items WHERE price IS NULL;');
    expect(await checkConclusion(db, question, null, pinned)).toEqual({
      correct: false,
      feedback: { kind: 'no-answer' },
    });
    expect(await checkConclusion(db, question, 0, pinned)).toEqual({
      correct: false,
      feedback: { kind: 'answer-wrong' },
    });
    expect(await checkConclusion(db, question, 1, null)).toEqual({ correct: false, feedback: { kind: 'no-evidence' } });
    expect(await checkConclusion(db, question, 1, pinned)).toEqual({ correct: true });
  });
});
