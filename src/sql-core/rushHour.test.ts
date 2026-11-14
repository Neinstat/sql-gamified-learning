import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, runQuery, type CafeDatabase } from './db';
import { checkAnswer } from './checker';
import { rushHourId } from './levels/locales/id/rushHour';
import { RUSH_REQUESTS, RUSH_STATION, rushPoints, rushPool, rushUnlocked, shuffled } from './rushHour';

let db: CafeDatabase;
beforeAll(async () => {
  db = await createCafeDatabase();
});

describe('Rush Hour requests', () => {
  for (const r of RUSH_REQUESTS) {
    it(`${r.id} runs at the cash register and passes its own check`, async () => {
      expect(r.solution.trimEnd()).toMatch(/;$/);
      const res = await runQuery(db, r.solution, RUSH_STATION);
      expect(res.ok && res.rows.length).toBeGreaterThan(0);
      expect((await checkAnswer(db, r.solution, r.solution, {}, RUSH_STATION)).verdict).toEqual({ correct: true });
      expect(rushHourId[r.id]?.trim()).toBeTruthy();
    });
  }
});

describe('Rush Hour rules', () => {
  it('opens after Chapter 2 and grows its pool with the chapters', () => {
    expect(rushUnlocked(2)).toBe(false);
    expect(rushUnlocked(3)).toBe(true);
    expect(rushPool(3).every((r) => r.chapter <= 2)).toBe(true);
    expect(rushPool(4).length).toBeGreaterThan(rushPool(3).length);
  });

  it('rewards answers in a row', () => {
    expect(rushPoints(1)).toBe(100);
    expect(rushPoints(3)).toBe(140);
  });

  it('shuffles without losing anything', () => {
    const items = [1, 2, 3, 4, 5];
    expect(shuffled(items).sort()).toEqual(items);
  });
});
