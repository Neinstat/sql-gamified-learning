import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, runQuery, type LocalCafeDatabase } from '../db';
import {
  arrivalTime,
  CLOSING,
  daySalesSql,
  emptyDay,
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
import { PROTOTYPE_ORDERS } from './orders';

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
    for (let i = 0; i < PROTOTYPE_ORDERS.length; i++) {
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
    log = serveOrder(log, served('proto-cheap'));
    log = serveOrder(log, served('proto-cheap', 700));
    log = missOrder(log, 'proto-cheap');
    log = missOrder(log, 'proto-coffee');
    expect(log.served).toEqual([served('proto-cheap')]);
    expect(log.missed).toEqual(['proto-coffee']);
  });

  it('is over at closing time, or once every customer was handled', () => {
    expect(isDayOver(emptyDay())).toBe(false);
    expect(isDayOver({ ...emptyDay(), clock: CLOSING })).toBe(true);
    let log = emptyDay();
    for (const o of PROTOTYPE_ORDERS) log = o.id === 'proto-coffee' ? missOrder(log, o.id) : serveOrder(log, served(o.id));
    expect(isDayOver(log)).toBe(true);
  });

  it('reads saved days back, dropping anything broken or unknown', () => {
    const log = missOrder(serveOrder({ ...emptyDay(), clock: 655 }, served('proto-cheap', 610)), 'proto-coffee');
    expect(parseDayLog(JSON.stringify(log))).toEqual(log);
    expect(parseDayLog(null)).toEqual(emptyDay());
    expect(parseDayLog('not json')).toEqual(emptyDay());
    const broken = { date: '2026-11-01', clock: 'noon', served: [{ orderId: 'nope', at: 600 }, { orderId: 'proto-cheap', at: '10:00' }], missed: [42] };
    expect(parseDayLog(JSON.stringify(broken))).toEqual(emptyDay());
  });

  it('reads a day saved by 4.9 (times as text, no tips) as a fresh day without crashing', () => {
    const old = { date: '2026-11-01', served: [{ orderId: 'proto-cheap', at: '10:00' }] };
    expect(parseDayLog(JSON.stringify(old)).served).toEqual([]);
  });
});

describe('recording sales', () => {
  it('buys only items that are on sale (available, with a price)', async () => {
    const r = await runQuery(db, 'SELECT item_id FROM menu_items WHERE is_available AND price IS NOT NULL;');
    if (!r.ok) throw new Error('query failed');
    const onSale = new Set(r.rows.map((row) => Number(row[0])));
    for (const order of PROTOTYPE_ORDERS) {
      expect(order.buys.length, order.id).toBeGreaterThan(0);
      for (const b of order.buys) expect(onSale.has(b.itemId), `${order.id}: item ${b.itemId}`).toBe(true);
    }
  });

  it('turns a served order into sales rows at menu prices, with new ids, on the truck channel', async () => {
    const fresh = await createCafeDatabase();
    const before = await runQuery(fresh, 'SELECT MAX(sale_id), MAX(order_id) FROM sales;');
    if (!before.ok) throw new Error('query failed');
    const [maxSale, maxOrder] = before.rows[0].map(Number);
    const order = PROTOTYPE_ORDERS.find((o) => o.id === 'proto-chocolate')!;
    await fresh.write(saleSql(order, '2026-11-01', 10 * 60 + 24));
    const rows = await truckSales(fresh);
    expect(rows).toEqual([
      [maxSale + 1, maxOrder + 1, '2026-11-01 10:24:00', 5, 1, '4.50'],
      [maxSale + 2, maxOrder + 1, '2026-11-01 10:24:00', 26, 2, '3.50'],
    ]);
  }, 60_000);

  it('replays a day exactly the same way every time', async () => {
    let log = emptyDay();
    for (const [i, o] of PROTOTYPE_ORDERS.slice(0, 4).entries()) log = serveOrder(log, served(o.id, OPENING + i * 20));
    const a = await createCafeDatabase();
    const b = await createCafeDatabase();
    for (const sql of daySalesSql(log)) {
      await a.write(sql);
      await b.write(sql);
    }
    const rowsA = await truckSales(a);
    expect(rowsA.length).toBe(PROTOTYPE_ORDERS.slice(0, 4).reduce((n, o) => n + o.buys.length, 0));
    expect(await truckSales(b)).toEqual(rowsA);
  }, 60_000);

  it('still never lets a player write', async () => {
    const r = await runQuery(db, "INSERT INTO sales (sale_id, order_id, sold_at, item_id, quantity, unit_price, channel) VALUES (999999, 1, NOW(), 1, 1, 1, 'x');");
    expect(r.ok).toBe(false);
  });

  it('refuses sale times that are not a date and HH:MM', () => {
    expect(() => saleSql(PROTOTYPE_ORDERS[0], "2026-11-01'; DROP TABLE sales; --", OPENING)).toThrow();
    expect(() => saleSql(PROTOTYPE_ORDERS[0], '2026-11-01', 1.5)).toThrow();
    expect(() => revenueSql("x'; --")).toThrow();
  });
});

describe('the end-of-day summary', () => {
  it("counts today's truck orders and revenue with a query players can read", async () => {
    const fresh = await createCafeDatabase();
    let log = emptyDay();
    for (const [i, o] of PROTOTYPE_ORDERS.slice(0, 2).entries()) log = serveOrder(log, served(o.id, OPENING + i * 30));
    for (const sql of daySalesSql(log)) await fresh.write(sql);
    const r = await runQuery(fresh, revenueSql(log.date), 'cash-register');
    expect(r.ok).toBe(true);
    // Green Tea 2.75 + 2 × Americano 3.00
    if (r.ok) expect(r.rows[0].map(String)).toEqual(['2', '8.75']);
  }, 60_000);
});

