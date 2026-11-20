import { beforeAll, describe, expect, it } from 'vitest';
import { checkConclusion } from '../cases';
import { createCafeDatabase, type LocalCafeDatabase } from '../db';
import { BLANK } from '../levels';
import { daySalesSql, newDay, OPENING, serveOrder } from './day';
import { buildManagerCase, MANAGER_INTRO, managerCaseFor, managerIntroFor } from './manager';
import { MANAGER_CASE_ID } from './locales/id/manager';

const DATE = '2026-11-01';
/** What a player would type in each starter's blank. */
const FILLS = ["'truck'", `'${DATE}'`, "'2026-11-01'"];

let db: LocalCafeDatabase;
beforeAll(async () => {
  db = await createCafeDatabase();
  // Two orders served: Green Tea ($2.75), then Earl Grey + Apple Pie ($7.50).
  const orders = ['price-under:3', 'two-categories:tea-dessert'];
  let log = newDay(DATE, orders);
  for (const [i, id] of orders.entries()) log = serveOrder(log, { orderId: id, at: OPENING + i * 30, tip: 1, stars: 3 });
  for (const sql of daySalesSql(log)) await db.write(sql);
});

describe("The Manager's case", () => {
  it("works out today's answers from the data", async () => {
    const level = await buildManagerCase(db, DATE);
    expect(level.questions[0].answer).toEqual({ kind: 'number', value: 2 });
    expect(level.questions[1].answer).toEqual({ kind: 'number', value: 10.25, tolerance: 0.01 });
    const channel = level.questions[2].answer;
    expect(channel.kind).toBe('choice');
  });

  it('can be solved by filling each starter, running it as the laptop, and pinning the result', async () => {
    const level = await buildManagerCase(db, DATE);
    for (const [i, question] of level.questions.entries()) {
      const sql = level.starters[i].replace(BLANK, FILLS[i]);
      expect(sql).not.toContain(BLANK);
      const result = await db.run(sql, level.station);
      if (!result.ok) throw new Error(`starter ${i} failed`);
      const answer = question.answer;
      const given = answer.kind === 'number' ? answer.value : answer.correct;
      const verdict = await checkConclusion(db, question, given, { columns: result.columns, rows: result.rows });
      expect(verdict, `question ${i + 1}`).toEqual({ correct: true });
    }
  });

  it('still works on a day with no orders yet (zero orders, $0)', async () => {
    const fresh = await createCafeDatabase();
    const level = await buildManagerCase(fresh, DATE);
    expect(level.questions[0].answer).toEqual({ kind: 'number', value: 0 });
    expect(level.questions[1].answer).toMatchObject({ kind: 'number', value: 0 });
  }, 60_000);

  it('is translated to Indonesian with the same shape, keeping the channel names', async () => {
    expect(MANAGER_CASE_ID.questions).toHaveLength(3);
    const en = await buildManagerCase(db, DATE);
    const id = await managerCaseFor(db, DATE, 'id');
    expect(MANAGER_CASE_ID.dialogue).toHaveLength(en.dialogue.length);
    expect(id.task).toBe(MANAGER_CASE_ID.task);
    if (id.kind !== 'case') throw new Error('expected a case');
    expect(id.questions[2].answer).toEqual(en.questions[2].answer);
  });

  it('refuses a date that is not a date', async () => {
    await expect(buildManagerCase(db, "x'; --")).rejects.toThrow();
  });
});

describe("The Manager's talk at the door", () => {
  it('has lines, a few replies that each get an answer, and a way into the case, in both languages', () => {
    for (const lang of ['en', 'id'] as const) {
      const intro = managerIntroFor(lang);
      expect(intro.lines.length).toBeGreaterThan(0);
      expect(intro.replies.length).toBeGreaterThanOrEqual(2);
      for (const r of intro.replies) {
        expect(r.label.length).toBeGreaterThan(0);
        expect(r.answer.length).toBeGreaterThan(0);
      }
      expect(intro.open.length).toBeGreaterThan(0);
    }
    const id = managerIntroFor('id');
    expect(id.lines).toHaveLength(MANAGER_INTRO.lines.length);
    expect(id.replies).toHaveLength(MANAGER_INTRO.replies.length);
    expect(id.lines[1]).not.toBe(MANAGER_INTRO.lines[1]);
  });
});

