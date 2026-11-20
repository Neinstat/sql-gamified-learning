import { beforeAll, describe, expect, it } from 'vitest';
import { checkAnswer } from '../checker';
import { createCafeDatabase, runQuery, type CafeDatabase } from '../db';
import { BLANK } from '../levels';
import { STATIONS, tablesInQuery } from '../stations';
import { CONCEPTS, conceptLesson, conceptName } from './concepts';
import { CONCEPT_NAMES_ID } from './locales/id/concepts';
import { TEMPLATES_ID } from './locales/id/templates';
import { OBJECT_STATION, objectForStation } from './objects';
import { dayOrders, inputStage, orderFromId, orderId, orderLevel, orderLine, parseOrderId } from './orders';
import { TEMPLATES } from './templates';

let db: CafeDatabase;
beforeAll(async () => {
  db = await createCafeDatabase();
}, 60_000);

const ALL = TEMPLATES.flatMap((t) => t.variants.map((v) => [orderId(t, v), t, v] as const));

describe('order templates', () => {
  it('have unique ids, and unique variant keys within each template', () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
    for (const t of TEMPLATES) expect(new Set(t.variants.map((v) => v.key)).size, t.id).toBe(t.variants.length);
    expect(new Set(ALL.map(([id]) => id)).size).toBe(ALL.length);
  });

  it('practise every concept, and every concept has a lesson and a name in both languages', () => {
    for (const c of CONCEPTS) {
      expect(TEMPLATES.some((t) => t.concept === c), c).toBe(true);
      expect(conceptLesson(c, 'en')?.title, c).toBeTruthy();
      expect(conceptLesson(c, 'id')?.title).not.toBe(conceptLesson(c, 'en')?.title);
      expect(conceptName(c, 'id')).toBe(CONCEPT_NAMES_ID[c]);
    }
  });

  it('are answered at an object that can see every table their solution reads', () => {
    for (const [id, t, v] of ALL) {
      const station = OBJECT_STATION[objectForStation(t.station)];
      expect(station, id).not.toBeNull();
      for (const table of tablesInQuery(t.solution(v.params))) expect(STATIONS[station!].tables, `${id}: ${table}`).toContain(table);
    }
  });

  it('send some orders to the fridge and the recipe binders, not only the tablet', () => {
    const objects = new Set(TEMPLATES.map((t) => objectForStation(t.station)));
    expect([...objects].sort()).toEqual(['fridge', 'recipe-shelf', 'tablet']);
  });

  it('are translated to Indonesian with the same shape', () => {
    expect(Object.keys(TEMPLATES_ID).sort()).toEqual(TEMPLATES.map((t) => t.id).sort());
    for (const t of TEMPLATES) expect(TEMPLATES_ID[t.id].lines.length, t.id).toBe(t.text.lines.length);
  });
});

describe.each(ALL)('order %s', (id, template, variant) => {
  it('rebuilds from its id', () => {
    expect(parseOrderId(id)).toEqual({ template, variant });
    expect(orderFromId(id)?.buys).toEqual(variant.buys);
  });

  it('has a solution its own station can run, returning rows', async () => {
    const level = orderLevel(orderFromId(id)!, 'en');
    const { verdict, result } = await checkAnswer(db, level.solution, level.solution, level.check, level.station);
    expect(verdict).toEqual({ correct: true });
    expect(result.ok && result.rows.length).toBeGreaterThan(0);
  });

  it('can be solved by filling the blanks with the reference answers', async () => {
    const level = orderLevel(orderFromId(id)!, 'en');
    if (level.input.kind !== 'fill-blank') throw new Error('expected fill-blank');
    const { template: sqlTemplate, answers } = level.input;
    expect(sqlTemplate.split(BLANK).length - 1).toBe(answers.length);
    let sql = sqlTemplate;
    for (const answer of answers) sql = sql.replace(BLANK, answer);
    const { verdict } = await checkAnswer(db, sql, level.solution, level.check, level.station);
    expect(verdict).toEqual({ correct: true });
  });

  it('can be solved at every input stage: the whole condition, then free typing', async () => {
    const order = orderFromId(id)!;
    const condition = orderLevel(order, 'en', 'condition');
    if (condition.input.kind !== 'fill-blank') throw new Error('expected fill-blank');
    expect(condition.input.template).toMatch(/ WHERE ___;$/);
    expect(condition.input.answers).toHaveLength(1);
    const sql = condition.input.template.replace(BLANK, condition.input.answers[0]);
    expect(sql).toBe(condition.solution);
    expect((await checkAnswer(db, sql, condition.solution, condition.check, condition.station)).verdict).toEqual({ correct: true });
    expect(orderLevel(order, 'en', 'free').input).toEqual({ kind: 'free' });
  });

  it('ends its SQL with a semicolon and has three hints and a lesson, in both languages', () => {
    for (const lang of ['en', 'id'] as const) {
      const order = dayOrders('2026-11-01', [id])[0];
      const level = orderLevel(order, lang);
      expect(level.solution.trimEnd()).toMatch(/;$/);
      if (level.input.kind === 'fill-blank') expect(level.input.template.trimEnd()).toMatch(/;$/);
      expect(level.hints.every((h) => h.length > 0)).toBe(true);
      expect(level.lesson).toBeDefined();
      expect(orderLine(order, lang).length).toBeGreaterThan(10);
      for (const line of (lang === 'id' ? TEMPLATES_ID[template.id] : template.text).lines) {
        expect(line(variant.params)).not.toMatch(/undefined|NaN/);
      }
    }
    expect(orderLevel(orderFromId(id)!, 'id').task).not.toBe(orderLevel(orderFromId(id)!, 'en').task);
  });

  it('buys only items that are on sale (available, with a price)', async () => {
    const r = await runQuery(db, 'SELECT item_id FROM menu_items WHERE is_available AND price IS NOT NULL;');
    if (!r.ok) throw new Error('query failed');
    const onSale = new Set(r.rows.map((row) => Number(row[0])));
    expect(variant.buys.length).toBeGreaterThan(0);
    for (const b of variant.buys) expect(onSale.has(b.itemId), `item ${b.itemId}`).toBe(true);
  });
});

describe('input stages', () => {
  it('grow with mastery: one word, then the whole condition, then free typing', () => {
    expect([undefined, 0, 1, 2, 3, 4, 5].map(inputStage)).toEqual([
      'keyword', 'keyword', 'keyword', 'condition', 'condition', 'free', 'free',
    ]);
  });
});

describe('a day of orders', () => {
  it('gives every customer a look that differs from the two before', () => {
    const ids = ALL.map(([id]) => id);
    const orders = dayOrders('2026-11-05', ids);
    expect(orders).toHaveLength(ids.length);
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i].look).not.toBe(orders[i - 1].look);
      if (i > 1) expect(orders[i].look).not.toBe(orders[i - 2].look);
    }
  });

  it('is the same every time for the same date, and skips unknown ids', () => {
    const ids = ALL.slice(0, 5).map(([id]) => id);
    expect(dayOrders('2026-11-02', ids)).toEqual(dayOrders('2026-11-02', ids));
    expect(dayOrders('2026-11-02', ['proto-cheap', ids[0], 'price-under:99'])).toHaveLength(1);
  });
});
