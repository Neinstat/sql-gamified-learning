import { describe, expect, it } from 'vitest';
import { CONCEPTS, type ConceptId } from './concepts';
import { missOrder, newDay, serveOrder, type DayLog } from './day';
import { parseOrderId } from './orders';
import {
  addDays,
  dayProgress,
  masteryFrom,
  MAX_PER_CONCEPT,
  missed,
  NEW_PER_DAY,
  ORDERS_PER_DAY,
  nextDay,
  parsePastDays,
  planDay,
  practise,
  type Mastery,
} from './repetition';

const conceptOf = (id: string) => parseOrderId(id)!.template.concept;
const concepts = (ids: string[]) => ids.map(conceptOf);

describe('dates', () => {
  it('adds days across months', () => {
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 7)).toBe('2027-01-07');
  });
});

describe('mastery', () => {
  it('goes up with ⭐⭐⭐ and comes back less and less often', () => {
    let m: Mastery = {};
    const dues: string[] = [];
    let date = '2026-11-01';
    for (let i = 0; i < 6; i++) {
      m = practise(m, 'in', date, 3);
      dues.push(m.in!.due);
      date = m.in!.due;
    }
    expect(m.in!.level).toBe(5);
    expect(m.in!.practised).toBe(6);
    // 1 → 1 → 2 → 4 → 7 → 14 days after each practice.
    expect(dues).toEqual(['2026-11-02', '2026-11-04', '2026-11-08', '2026-11-15', '2026-11-29', '2026-12-13']);
  });

  it('goes down with hints or wrong runs, and comes back tomorrow', () => {
    let m = practise(practise({}, 'like', '2026-11-01', 3), 'like', '2026-11-02', 3);
    expect(m.like!.level).toBe(2);
    m = practise(m, 'like', '2026-11-04', 2);
    expect(m.like).toEqual({ level: 1, due: '2026-11-05', practised: 3 });
    m = practise(practise(m, 'like', '2026-11-05', 1), 'like', '2026-11-06', 1);
    expect(m.like!.level).toBe(0);
  });

  it('keeps the level when a customer gave up, but brings the concept back tomorrow', () => {
    const m = missed(practise({}, 'and', '2026-11-01', 3), 'and', '2026-11-03');
    expect(m.and).toEqual({ level: 1, due: '2026-11-04', practised: 1 });
    expect(missed({}, 'and', '2026-11-03').and).toEqual({ level: 0, due: '2026-11-04', practised: 0 });
  });

  it('is worked out from the saved days, so playing a day again never counts twice', () => {
    const day: DayLog = missOrder(
      serveOrder(serveOrder(newDay('2026-11-01', ['price-under:3', 'category:tea', 'available:tea']), { orderId: 'price-under:3', at: 600, tip: 1, stars: 3 }), {
        orderId: 'category:tea',
        at: 640,
        tip: 1,
        stars: 1,
      }),
      'available:tea',
    );
    const m = masteryFrom([day]);
    expect(m['where-compare']).toEqual({ level: 1, due: '2026-11-02', practised: 1 });
    expect(m['where-text']).toEqual({ level: 0, due: '2026-11-02', practised: 1 });
    expect(m.and).toEqual({ level: 0, due: '2026-11-02', practised: 0 });
    expect(masteryFrom([day])).toEqual(m);
    expect(masteryFrom([])).toEqual({});
  });
});

describe('planning a day', () => {
  it('starts the first day with the first new concepts, in teaching order', () => {
    const ids = planDay('2026-11-01', {});
    const used = new Set(concepts(ids));
    expect([...used].sort()).toEqual(CONCEPTS.slice(0, NEW_PER_DAY).slice().sort());
    expect(ids.length).toBeGreaterThanOrEqual(6);
    expect(ids.length).toBeLessThanOrEqual(ORDERS_PER_DAY);
  });

  it('opens a day that brings new concepts with the first of them', () => {
    for (let d = 0; d < 10; d++) expect(conceptOf(planDay(addDays('2026-11-01', d), {})[0])).toBe('where-compare');
    const m: Mastery = { 'where-compare': { level: 1, due: '2026-11-09', practised: 1 } };
    expect(conceptOf(planDay('2026-11-02', m)[0])).toBe('where-text');
  });

  it('never repeats an order within a day, and never asks for one concept too often', () => {
    for (let d = 0; d < 30; d++) {
      const date = addDays('2026-11-01', d);
      const ids = planDay(date, {});
      expect(new Set(ids).size, date).toBe(ids.length);
      for (const c of CONCEPTS) expect(concepts(ids).filter((x) => x === c).length).toBeLessThanOrEqual(MAX_PER_CONCEPT);
    }
  });

  it('is the same for the same date and mastery, and differs from day to day', () => {
    expect(planDay('2026-11-03', {})).toEqual(planDay('2026-11-03', {}));
    expect(planDay('2026-11-03', {})).not.toEqual(planDay('2026-11-04', {}));
  });

  it('brings back due concepts and introduces the next new ones', () => {
    const m: Mastery = {
      'where-compare': { level: 4, due: '2026-11-20', practised: 5 },
      'where-text': { level: 0, due: '2026-11-04', practised: 3 },
      and: { level: 2, due: '2026-11-04', practised: 2 },
    };
    const used = concepts(planDay('2026-11-04', m));
    expect(used).toContain('where-text');
    expect(used).toContain('and');
    // The next three new concepts come in.
    for (const c of ['in', 'like', 'is-null'] as ConceptId[]) expect(used).toContain(c);
  });

  it('asks weak concepts more often than mastered ones over many days', () => {
    const m: Mastery = Object.fromEntries(
      CONCEPTS.map((c) => [c, { level: c === 'like' ? 0 : 5, due: '2027-01-01', practised: 9 }]),
    );
    let like = 0;
    let other = 0;
    for (let d = 0; d < 40; d++) {
      for (const c of concepts(planDay(addDays('2026-11-01', d), m))) c === 'like' ? like++ : other++;
    }
    // `like` is one concept of six but gets far more than a sixth of the orders.
    expect(like / (like + other)).toBeGreaterThan(0.3);
  });

  it('avoids the orders of recent days when there are others to use', () => {
    const yesterday = planDay('2026-11-01', {});
    const today = planDay('2026-11-02', masteryFrom([]), yesterday);
    const overlap = today.filter((id) => yesterday.includes(id));
    expect(overlap.length).toBeLessThan(today.length);
  });
});

describe('days that follow', () => {
  const play = (day: DayLog, stars: number): DayLog =>
    day.orders.reduce((log, id, i) => serveOrder(log, { orderId: id, at: 600 + i * 30, tip: 1, stars }), day);

  it('starts on the first play day, then plans each next day from what was practised', () => {
    const first = nextDay([]);
    expect(first.date).toBe('2026-11-01');
    expect(first.orders).toEqual(planDay('2026-11-01', {}));
    const day1 = play(first, 3);
    const second = nextDay([day1]);
    expect(second.date).toBe('2026-11-02');
    expect(second.orders).toEqual(planDay('2026-11-02', masteryFrom([day1]), day1.orders));
    expect(second.served).toEqual([]);
    expect(second.clock).toBe(600);
  });

  it('keeps practising what went badly, and moves on when it went well', () => {
    const first = nextDay([]);
    const good = concepts(nextDay([play(first, 3)]).orders);
    const bad = concepts(nextDay([play(first, 1)]).orders);
    // After a bad day all three concepts are due again; after a good one too (1 day), but new ones join.
    for (const c of new Set(concepts(first.orders))) expect(bad).toContain(c);
    expect(good.some((c) => !concepts(first.orders).includes(c))).toBe(true);
  });

  it('reads saved past days back, dropping broken ones and dates that go backwards', () => {
    const day1 = play(nextDay([]), 3);
    const day2 = play(nextDay([day1]), 2);
    expect(parsePastDays(JSON.stringify([day1, day2]))).toEqual([day1, day2]);
    expect(parsePastDays(JSON.stringify([day2, day1, { nope: 1 }]))).toEqual([day2]);
    expect(parsePastDays('nonsense')).toEqual([]);
    expect(parsePastDays(null)).toEqual([]);
  });

  it("says how each of the day's concepts moved", () => {
    const day1 = play(nextDay([]), 3);
    const progress = dayProgress([], day1);
    expect(progress.map((p) => p.concept)).toEqual(CONCEPTS.slice(0, NEW_PER_DAY));
    for (const p of progress) {
      expect(p.before).toBeNull();
      expect(p.after).toBeGreaterThan(0);
      expect(p.due > day1.date).toBe(true);
    }
  });
});
