import { beforeAll, describe, expect, it } from 'vitest';
import { checkAnswer } from '../checker';
import { createCafeDatabase, runQuery, type CafeDatabase } from '../db';
import { BLANK } from '../levels';
import { tablesInQuery, STATIONS } from '../stations';
import { TRUCK_LEVELS_ID } from './locales/id/levels';
import { findOrderLevel, TRUCK_LEVELS } from './levels';
import { PROTOTYPE_ORDERS } from './orders';
import { OBJECT_STATION, objectForStation, TRUCK_OBJECTS } from './objects';

let db: CafeDatabase;
beforeAll(async () => {
  db = await createCafeDatabase();
}, 60_000);

describe.each(TRUCK_LEVELS.map((l) => [l.id, l] as const))('truck level %s', (_id, level) => {
  it('has a solution that its own station can run, returning rows', async () => {
    const { verdict, result } = await checkAnswer(db, level.solution, level.solution, level.check, level.station);
    expect(verdict).toEqual({ correct: true });
    expect(result.ok && result.rows.length).toBeGreaterThan(0);
  });

  it('can be solved by filling the blanks with the reference answers', async () => {
    if (level.input.kind !== 'fill-blank') throw new Error('expected fill-blank');
    const { template, answers } = level.input;
    expect(template.split(BLANK).length - 1).toBe(answers.length);
    let sql = template;
    for (const answer of answers) sql = sql.replace(BLANK, answer);
    const { verdict } = await checkAnswer(db, sql, level.solution, level.check, level.station);
    expect(verdict).toEqual({ correct: true });
  });

  it('ends its SQL with a semicolon and has three hints', () => {
    expect(level.solution.trimEnd()).toMatch(/;$/);
    if (level.input.kind === 'fill-blank') expect(level.input.template.trimEnd()).toMatch(/;$/);
    expect(level.hints).toHaveLength(3);
  });

  it('is translated to Indonesian with the same shape', () => {
    const id = TRUCK_LEVELS_ID[level.id];
    expect(id).toBeDefined();
    expect(id.dialogue).toHaveLength(level.dialogue.length);
    expect(id.hints).toHaveLength(3);
    expect(findOrderLevel(level.id, 'id')?.task).toBe(id.task);
    expect(findOrderLevel(level.id, 'en')?.task).toBe(level.task);
  });
});

describe('truck objects', () => {
  it('answer every order at an object that can see all the tables it needs', () => {
    for (const order of PROTOTYPE_ORDERS) {
      const level = findOrderLevel(order.levelId, 'en');
      if (!level || !('solution' in level)) throw new Error(order.levelId);
      const object = objectForStation(level.station);
      const station = OBJECT_STATION[object];
      expect(station, order.id).not.toBeNull();
      for (const table of tablesInQuery(level.solution)) {
        expect(STATIONS[station!].tables, `${order.id}: ${table}`).toContain(table);
      }
    }
  });

  it('send at least one prototype order to the fridge and one to the recipe binders', () => {
    const objects = PROTOTYPE_ORDERS.map((o) => {
      const level = findOrderLevel(o.levelId, 'en')!;
      return objectForStation(level.station);
    });
    expect(objects).toContain('fridge');
    expect(objects).toContain('recipe-shelf');
  });

  it('let every object with data be looked around, but not read other tables', async () => {
    for (const object of TRUCK_OBJECTS) {
      const station = OBJECT_STATION[object];
      if (!station) continue;
      const own = await runQuery(db, `SELECT * FROM ${STATIONS[station].tables[0]} LIMIT 1;`, station);
      expect(own.ok, object).toBe(true);
    }
    const blocked = await runQuery(db, 'SELECT * FROM sales LIMIT 1;', OBJECT_STATION.fridge!);
    expect(blocked.ok).toBe(false);
  });
});
