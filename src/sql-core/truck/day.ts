/**
 * A working day in the food truck (GAME_DESIGN.md §4, §8): which orders have been served, and
 * the sales they become. The game, never the player, writes these sales to the database, with
 * `channel = 'truck'`. Progress only stores the day log; on load the database is rebuilt from its
 * seed and the log is replayed, so the data is exactly the same every time.
 */
import { PROTOTYPE_ORDERS, type TruckOrder } from './orders';

/** The first play day: the truck's history (Aug–Oct 2026) ends the day before. */
export const FIRST_PLAY_DATE = '2026-11-01';
export const OPENING_TIME = '10:00';

/** One served order: which order, and when (HH:MM, the truck's clock). */
export type ServedOrder = { orderId: string; at: string };

export type DayLog = { date: string; served: ServedOrder[] };

export const emptyDay = (): DayLog => ({ date: FIRST_PLAY_DATE, served: [] });

/**
 * When the next order is served. Until the clock arrives (Phase 4.10) a day simply advances
 * 12 minutes per order from opening time.
 */
export function nextServeTime(log: DayLog): string {
  const [h, m] = OPENING_TIME.split(':').map(Number);
  const minutes = h * 60 + m + log.served.length * 12;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function serveOrder(log: DayLog, orderId: string): DayLog {
  if (log.served.some((s) => s.orderId === orderId)) return log;
  return { ...log, served: [...log.served, { orderId, at: nextServeTime(log) }] };
}

/** Read a saved day; anything broken or unknown falls back to a fresh day. */
export function parseDayLog(raw: string | null): DayLog {
  if (!raw) return emptyDay();
  try {
    const data = JSON.parse(raw) as Partial<DayLog>;
    if (typeof data.date !== 'string' || !Array.isArray(data.served)) return emptyDay();
    const known = new Set(PROTOTYPE_ORDERS.map((o) => o.id));
    const served = data.served.filter(
      (s): s is ServedOrder =>
        !!s && typeof s.orderId === 'string' && known.has(s.orderId) && typeof s.at === 'string' && /^\d\d:\d\d$/.test(s.at),
    );
    return { date: /^\d{4}-\d\d-\d\d$/.test(data.date) ? data.date : FIRST_PLAY_DATE, served };
  } catch {
    return emptyDay();
  }
}

/**
 * The INSERT that records one served order: one `sales` row per item bought, at the menu price,
 * with the next free `sale_id`s and one new `order_id`. Built only from our own order data
 * (numbers and a checked timestamp), never from player input.
 */
export function saleSql(order: TruckOrder, date: string, at: string): string {
  if (!/^\d{4}-\d\d-\d\d$/.test(date) || !/^\d\d:\d\d$/.test(at)) throw new Error(`Bad sale time: ${date} ${at}`);
  const lines = order.buys
    .map((b, i) => {
      if (!Number.isInteger(b.itemId) || !Number.isInteger(b.quantity) || b.quantity < 1) {
        throw new Error(`Bad purchase in ${order.id}`);
      }
      return `(${i + 1}, ${b.itemId}, ${b.quantity})`;
    })
    .join(', ');
  return `INSERT INTO sales (sale_id, order_id, sold_at, item_id, quantity, unit_price, channel, customer_id)
SELECT (SELECT COALESCE(MAX(sale_id), 0) FROM sales) + line.n,
       (SELECT COALESCE(MAX(order_id), 0) FROM sales) + 1,
       TIMESTAMP '${date} ${at}:00',
       m.item_id, line.quantity, m.price, 'truck', NULL
FROM (VALUES ${lines}) AS line (n, item_id, quantity)
JOIN menu_items m ON m.item_id = line.item_id
ORDER BY line.n;`;
}

/** Every INSERT for a day log, in the order the orders were served. */
export function daySalesSql(log: DayLog): string[] {
  return log.served.flatMap((s) => {
    const order = PROTOTYPE_ORDERS.find((o) => o.id === s.orderId);
    return order ? [saleSql(order, log.date, s.at)] : [];
  });
}
