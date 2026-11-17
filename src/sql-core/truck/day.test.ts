import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, runQuery, type LocalCafeDatabase } from '../db';
import { daySalesSql, emptyDay, nextServeTime, parseDayLog, saleSql, serveOrder } from './day';
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

describe('the day log', () => {
  it('serves orders once, 12 minutes apart from opening time', () => {
    let log = emptyDay();
    expect(nextServeTime(log)).toBe('10:00');
    log = serveOrder(log, 'proto-cheap');
    log = serveOrder(log, 'proto-cheap');
    log = serveOrder(log, 'proto-coffee');
    expect(log.served).toEqual([
      { orderId: 'proto-cheap', at: '10:00' },
      { orderId: 'proto-coffee', at: '10:12' },
    ]);
  });

  it('reads saved days back, dropping anything broken or unknown', () => {
    const log = serveOrder(emptyDay(), 'proto-cheap');
    expect(parseDayLog(JSON.stringify(log))).toEqual(log);
    expect(parseDayLog(null)).toEqual(emptyDay());
    expect(parseDayLog('not json')).toEqual(emptyDay());
    expect(parseDayLog(JSON.stringify({ date: '2026-11-01', served: [{ orderId: 'nope', at: '10:00' }, { orderId: 'proto-cheap', at: 'x' }] })).served).toEqual([]);
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
    await fresh.write(saleSql(order, '2026-11-01', '10:24'));
    const rows = await truckSales(fresh);
    expect(rows).toEqual([
      [maxSale + 1, maxOrder + 1, '2026-11-01 10:24:00', 5, 1, '4.50'],
      [maxSale + 2, maxOrder + 1, '2026-11-01 10:24:00', 26, 2, '3.50'],
    ]);
  }, 60_000);

  it('replays a day exactly the same way every time', async () => {
    let log = emptyDay();
    for (const o of PROTOTYPE_ORDERS.slice(0, 4)) log = serveOrder(log, o.id);
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
    expect(() => saleSql(PROTOTYPE_ORDERS[0], "2026-11-01'; DROP TABLE sales; --", '10:00')).toThrow();
    expect(() => saleSql(PROTOTYPE_ORDERS[0], '2026-11-01', '10')).toThrow();
  });
});
