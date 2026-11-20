/**
 * A working day in the food truck (GAME_DESIGN.md §4, §8): the clock, when customers arrive, how
 * patient they are, and the orders served (each becomes `sales` rows). The game, never the
 * player, writes these sales, with `channel = 'truck'`. Progress only stores the day log; on load
 * the database is rebuilt from its seed and the log is replayed, so the data is always the same.
 *
 * Times are minutes since midnight (10:00 = 600).
 */
import { isOrderId, orderFromId, type TruckOrder } from './orders';

/** The first play day: the truck's history (Aug–Oct 2026) ends the day before. */
export const FIRST_PLAY_DATE = '2026-11-01';
export const OPENING = 10 * 60;
export const CLOSING = 17 * 60;

/**
 * The Manager knocks at this time, or earlier if every customer of the day has already been
 * handled (they come for the day's numbers). Once a day.
 */
export const KNOCK_TIME = 13 * 60 + 30;

/** About ten real minutes for a 7-hour day; the clock stops while a console is open. */
export const GAME_MINUTES_PER_SECOND = 0.7;
/** With nobody waiting at the window, time runs this much faster (no idle waiting). */
export const QUIET_SPEEDUP = 4;
/** How long (game minutes) a customer waits in the queue before giving up. */
export const PATIENCE_MINUTES = 60;

/**
 * When each of the day's customers turns up (minutes after opening), spread over the day.
 * One per order, in order.
 */
export const ARRIVALS = [0, 35, 75, 120, 170, 230, 300] as const;

export function arrivalTime(index: number): number {
  return OPENING + (ARRIVALS[index] ?? ARRIVALS[ARRIVALS.length - 1] + 30 * (index - ARRIVALS.length + 1));
}

/** "10:05" */
export function formatClock(minutes: number): string {
  const m = Math.max(0, Math.floor(minutes));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** How a customer feels, from the patience they have left (1 = just arrived, 0 = leaving). */
export type Mood = 'happy' | 'okay' | 'annoyed';

export function moodFor(patienceLeft: number): Mood {
  if (patienceLeft > 2 / 3) return 'happy';
  if (patienceLeft > 1 / 3) return 'okay';
  return 'annoyed';
}

/** The tip for an order, from the customer's mood when it was handed over. */
export const TIPS: Record<Mood, number> = { happy: 1, okay: 0.5, annoyed: 0 };

/** One served order: which, when (minutes since midnight), the tip, and the stars earned. */
export type ServedOrder = { orderId: string; at: number; tip: number; stars: number };

export type DayLog = {
  date: string;
  /** The day's order ids (planned when the day starts), in the order customers arrive. */
  orders: string[];
  /** The truck's clock (minutes since midnight), so a reload carries on from here. */
  clock: number;
  served: ServedOrder[];
  /** Customers who gave up waiting (their order comes back on another day). */
  missed: string[];
  /** The Manager's case, once answered: the stars earned. Not answered yet: null. */
  manager: { stars: number } | null;
};

/** A day that has not started yet: opening time, nothing served. */
export const newDay = (date: string, orders: readonly string[]): DayLog => ({
  date,
  orders: [...orders],
  clock: OPENING,
  served: [],
  missed: [],
  manager: null,
});

export function serveOrder(log: DayLog, served: ServedOrder): DayLog {
  if (isHandled(log, served.orderId)) return log;
  return { ...log, served: [...log.served, served] };
}

export function missOrder(log: DayLog, orderId: string): DayLog {
  if (isHandled(log, orderId)) return log;
  return { ...log, missed: [...log.missed, orderId] };
}

export const isHandled = (log: DayLog, orderId: string) =>
  log.served.some((s) => s.orderId === orderId) || log.missed.includes(orderId);

/** The day is over once it is closing time and every customer has been served or has left. */
export function isDayOver(log: DayLog): boolean {
  return log.clock >= CLOSING || log.served.length + log.missed.length >= log.orders.length;
}

/**
 * Read a saved day. A day that cannot be read (broken, or saved before order templates, with no
 * plan of its own) gives null: the caller starts a fresh day. Unknown entries are dropped.
 */
export function parseDayLog(raw: string | null): DayLog | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<DayLog> & { served?: unknown[]; missed?: unknown[]; orders?: unknown[] };
    if (typeof data.date !== 'string' || !/^\d{4}-\d\d-\d\d$/.test(data.date) || !Array.isArray(data.served)) return null;
    if (!Array.isArray(data.orders)) return null;
    const orders = [...new Set(data.orders.filter((id): id is string => typeof id === 'string' && isOrderId(id)))];
    if (orders.length === 0) return null;
    const known = new Set(orders);
    const minutes = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 24 * 60;
    const served: ServedOrder[] = [];
    for (const s of data.served as Partial<ServedOrder>[]) {
      if (!s || typeof s.orderId !== 'string' || !known.has(s.orderId) || !minutes(s.at)) continue;
      if (served.some((x) => x.orderId === s.orderId)) continue;
      served.push({
        orderId: s.orderId,
        at: Math.floor(s.at as number),
        tip: typeof s.tip === 'number' && s.tip >= 0 ? s.tip : 0,
        stars: s.stars === 1 || s.stars === 2 || s.stars === 3 ? s.stars : 1,
      });
    }
    const missed = (Array.isArray(data.missed) ? data.missed : []).filter(
      (id): id is string => typeof id === 'string' && known.has(id) && !served.some((s) => s.orderId === id),
    );
    return {
      date: data.date,
      orders,
      clock: minutes(data.clock) ? Math.max(OPENING, Math.floor(data.clock as number)) : OPENING,
      served,
      missed: [...new Set(missed)],
      manager:
        data.manager && typeof data.manager === 'object' && [1, 2, 3].includes((data.manager as { stars: number }).stars)
          ? { stars: (data.manager as { stars: number }).stars }
          : null,
    };
  } catch {
    return null;
  }
}

/**
 * The INSERT that records one served order: one `sales` row per item bought, at the menu price,
 * with the next free `sale_id`s and one new `order_id`. Built only from our own order data
 * (numbers and a checked date and time), never from player input.
 */
export function saleSql(order: TruckOrder, date: string, at: number): string {
  if (!/^\d{4}-\d\d-\d\d$/.test(date) || !Number.isInteger(at) || at < 0 || at >= 24 * 60) {
    throw new Error(`Bad sale time: ${date} ${at}`);
  }
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
       TIMESTAMP '${date} ${formatClock(at)}:00',
       m.item_id, line.quantity, m.price, 'truck', NULL
FROM (VALUES ${lines}) AS line (n, item_id, quantity)
JOIN menu_items m ON m.item_id = line.item_id
ORDER BY line.n;`;
}

/** Every INSERT for a day log, in the order the orders were served. */
export function daySalesSql(log: DayLog): string[] {
  return log.served.flatMap((s) => {
    const order = orderFromId(s.orderId);
    return order ? [saleSql(order, log.date, s.at)] : [];
  });
}

/**
 * The query the end-of-day summary runs (and shows) for today's revenue: a small lesson in itself.
 */
export function revenueSql(date: string): string {
  if (!/^\d{4}-\d\d-\d\d$/.test(date)) throw new Error(`Bad date: ${date}`);
  return `SELECT COUNT(DISTINCT order_id) AS orders,
       SUM(quantity * unit_price) AS revenue
FROM sales
WHERE channel = 'truck'
  AND sold_at::date = '${date}';`;
}
