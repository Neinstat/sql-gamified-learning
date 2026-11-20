import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, runQuery, type LocalCafeDatabase } from '../db';
import {
  arrivalTime,
  CLOSING,
  daySalesSql,
  newDay,
  formatClock,
  isDayOver,
  missOrder,
  moodFor,
  OPENING,
  parseDayLog,
  revenueSql,
  saleSql,
  serveOrder,
  TIPS,
} from './day';
import { orderFromId } from './orders';

/** A test day: Green Tea ($2.75), Americano ($3.00), Earl Grey + Apple Pie, … */
const ORDERS = [
  'price-under:3',
  'category-under:coffee-4',
  'two-categories:tea-dessert',
  'category:tea',
  'available:dessert',
  'name-like:Tea',
  'supplier-now:milk',
];
const emptyDay = () => newDay('2026-11-01', ORDERS);

let db: LocalCafeDatabase;
beforeAll(async () => {
  db = await createCafeDatabase();
});

const truckSales = async (database: LocalCafeDatabase) => {
  const r = await runQuery(
    database,
    "SELECT sale_id, order_id, sold_at, item_id, quantity, unit_price FROM sales WHERE channel = 'truck' ORDER BY sale_id;",
  );
  if (!r.ok) throw new Error('query failed');
  return r.rows;
};

const served = (orderId: string, at = OPENING) => ({ orderId, at, tip: 1, stars: 3 });

describe('the clock and customers', () => {
  it('formats the clock and spreads arrivals over opening hours', () => {
    expect(formatClock(OPENING)).toBe('10:00');
    expect(formatClock(OPENING + 65.9)).toBe('11:05');
    for (let i = 0; i < ORDERS.length; i++) {
      expect(arrivalTime(i)).toBeGreaterThanOrEqual(OPENING);
      expect(arrivalTime(i)).toBeLessThan(CLOSING - 60);
      if (i > 0) expect(arrivalTime(i)).toBeGreaterThan(arrivalTime(i - 1));
    }
  });

  it('tips more when customers waited less', () => {
    expect(moodFor(1)).toBe('happy');
    expect(moodFor(0.5)).toBe('okay');
    expect(moodFor(0.1)).toBe('annoyed');
    expect(TIPS.happy).toBeGreaterThan(TIPS.okay);
    expect(TIPS.okay).toBeGreaterThan(TIPS.annoyed);
  });
});

describe('the day log', () => {
  it('serves or misses each order once', () => {
    let log = emptyDay();
    log = serveOrder(log, served('price-under:3'));
    log = serveOrder(log, served('price-under:3', 700));
    log = missOrder(log, 'price-under:3');
    log = missOrder(log, 'category-under:coffee-4');
    expect(log.served).toEqual([served('price-under:3')]);
    expect(log.missed).toEqual(['category-under:coffee-4']);
  });

  it('is over at closing time, or once every customer was handled', () => {
    expect(isDayOver(emptyDay())).toBe(false);
    expect(isDayOver({ ...emptyDay(), clock: CLOSING })).toBe(true);
    let log = emptyDay();
    for (const id of ORDERS) log = id === 'category-under:coffee-4' ? missOrder(log, id) : serveOrder(log, served(id));
    expect(isDayOver(log)).toBe(true);
  });

  it('reads saved days back, dropping anything broken or unknown', () => {
    const log = {
      ...missOrder(serveOrder({ ...emptyDay(), clock: 655 }, served('price-under:3', 610)), 'category-under:coffee-4'),
      manager: { stars: 2 },
    };
    expect(parseDayLog(JSON.stringify(log))).toEqual(log);
    expect(parseDayLog(null)).toBeNull();
    expect(parseDayLog('not json')).toBeNull();
    const broken = {
      date: '2026-11-01',
      orders: [...ORDERS, 'nope', 42],
      clock: 'noon',
      served: [{ orderId: 'nope', at: 600 }, { orderId: 'price-under:3', at: '10:00' }],
      missed: [42],
    };
    expect(parseDayLog(JSON.stringify(broken))).toEqual(emptyDay());
  });

  it('starts fresh from a day saved before order templates (no plan, old order ids)', () => {
    const old = { date: '2026-11-01', clock: 700, served: [{ orderId: 'proto-cheap', at: 610, tip: 1, stars: 3 }], missed: [], manager: null };
    expect(parseDayLog(JSON.stringify(old))).toBeNull();
    expect(parseDayLog(JSON.stringify({ ...old, orders: ['proto-cheap'] }))).toBeNull();
  });
});

describe('recording sales', () => {
  it('turns a served order into sales rows at menu prices, with new ids, on the truck channel', async () => {
    const fresh = await createCafeDatabase();
    const before = await runQuery(fresh, 'SELECT MAX(sale_id), MAX(order_id) FROM sales;');
    if (!before.ok) throw new Error('query failed');
    const [maxSale, maxOrder] = before.rows[0].map(Number);
    const order = orderFromId('two-categories:tea-dessert')!;
    await fresh.write(saleSql(order, '2026-11-01', 10 * 60 + 24));
    const rows = await truckSales(fresh);
    expect(rows).toEqual([
      [maxSale + 1, maxOrder + 1, '2026-11-01 10:24:00', 11, 1, '2.75'],
      [maxSale + 2, maxOrder + 1, '2026-11-01 10:24:00', 27, 1, '4.75'],
    ]);
  }, 60_000);

  it('replays a day exactly the same way every time', async () => {
    let log = emptyDay();
    for (const [i, id] of ORDERS.slice(0, 4).entries()) log = serveOrder(log, served(id, OPENING + i * 20));
    const a = await createCafeDatabase();
    const b = await createCafeDatabase();
    for (const sql of daySalesSql(log)) {
      await a.write(sql);
      await b.write(sql);
    }
    const rowsA = await truckSales(a);
    expect(rowsA.length).toBe(ORDERS.slice(0, 4).reduce((n, id) => n + orderFromId(id)!.buys.length, 0));
    expect(await truckSales(b)).toEqual(rowsA);
  }, 60_000);

  it('still never lets a player write', async () => {
    const r = await runQuery(db, "INSERT INTO sales (sale_id, order_id, sold_at, item_id, quantity, unit_price, channel) VALUES (999999, 1, NOW(), 1, 1, 1, 'x');");
    expect(r.ok).toBe(false);
  });

  it('refuses sale times that are not a date and HH:MM', () => {
    expect(() => saleSql(orderFromId(ORDERS[0])!, "2026-11-01'; DROP TABLE sales; --", OPENING)).toThrow();
    expect(() => saleSql(orderFromId(ORDERS[0])!, '2026-11-01', 1.5)).toThrow();
    expect(() => revenueSql("x'; --")).toThrow();
  });
});

describe('the end-of-day summary', () => {
  it("counts today's truck orders and revenue with a query players can read", async () => {
    const fresh = await createCafeDatabase();
    let log = emptyDay();
    for (const [i, id] of ORDERS.slice(0, 2).entries()) log = serveOrder(log, served(id, OPENING + i * 30));
    for (const sql of daySalesSql(log)) await fresh.write(sql);
    const r = await runQuery(fresh, revenueSql(log.date), 'cash-register');
    expect(r.ok).toBe(true);
    // Green Tea 2.75 + Americano 3.00
    if (r.ok) expect(r.rows[0].map(String)).toEqual(['2', '5.75']);
  }, 60_000);
});

