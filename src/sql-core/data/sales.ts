/**
 * Grandma's till records: `customers` and `sales`, made by a generator with a fixed seed,
 * so the data is realistic in size but always exactly the same (level answers stay stable
 * and testable). GAME_DESIGN.md §11.
 *
 * Period: 1 August – 31 October 2026. Hidden patterns, each found later with SQL:
 * - Tuesdays are quiet: it's market day in the valley, so fewer orders (but normal-sized ones).
 *   → Chapter 3 Mini Case "The Quiet Day".
 * - Four regulars came for Grandma's Secret Cake. It was taken off the menu after August,
 *   and those four never came back. → Chapter 4 Mini Case "Where Did the Regulars Go?".
 * - In October the milk often ran out in the morning (the cause shows in the stock ledger,
 *   added with the storeroom). Milk drinks fall, some customers switch to black coffee,
 *   others leave. October revenue ends up about 18% below September. → Chapter 5 Analysis Case.
 * - Hot Chocolate has no price, so it is never rung up. The Pumpkin Spice Latte is not
 *   available this season, so it is never sold either.
 */

// --- Menu facts the generator needs (must match menu_items in cafe.ts; a test checks it) ---

export const MENU_PRICES: Record<number, number> = {
  1: 2.5, 2: 3.0, 3: 3.75, 4: 4.0, 5: 4.5, 6: 4.0, 7: 4.75, 8: 4.25,
  10: 2.75, 11: 2.75, 12: 4.25, 13: 4.75, 14: 3.0, 15: 3.25,
  17: 3.25, 18: 3.75, 19: 3.0, 20: 3.5, 21: 3.25,
  22: 6.5, 23: 7.25, 24: 6.0,
  25: 5.5, 26: 3.5, 27: 4.75, 28: 6.0,
};

const ESPRESSO = 1;
const AMERICANO = 2;
const SECRET_CAKE = 28;
/** October: share of days the milk runs out before noon; of those who wanted a milk drink, how many
 *  switch to black coffee, and how many leave without buying anything. Tuned for a ~18% drop. */
const MILK_SHORT_DAYS = 0.85;
const MILK_SWITCH = 0.3;
const MILK_LEAVE = 0.55;
/** Drinks made with milk: these run out on short-milk October mornings. */
export const MILK_DRINKS = [3, 4, 5, 6, 7, 8, 12, 13];

type Weighted = [itemId: number, weight: number][];
const COFFEE: Weighted = [[1, 8], [2, 10], [3, 14], [4, 18], [5, 8], [6, 10], [7, 7], [8, 5]];
const TEA_AND_COLD: Weighted = [[10, 6], [11, 6], [12, 8], [13, 6], [14, 4], [15, 5]];
const PASTRY: Weighted = [[17, 10], [18, 8], [19, 7], [20, 8], [21, 5]];
const SANDWICH: Weighted = [[22, 10], [23, 7], [24, 6]];
const DESSERT: Weighted = [[25, 6], [26, 9], [27, 7]];

// --- People -------------------------------------------------------------------------------------

const NAMES = [
  'Ava Brooks', 'Ben Carter', 'Chloe Diaz', 'Daniel Evans', 'Ella Foster', 'Finn Garcia', 'Grace Hughes',
  'Henry Irwin', 'Isla Jensen', 'Jack Kim', 'Lily Lopez', 'Leo Martin', 'Mia Novak', 'Noah Owens',
  'Olivia Park', 'Oscar Quinn', 'Ruby Reed', 'Sam Silva', 'Sophie Turner', 'Theo Usman', 'Zoe Vargas',
  'Adam Walsh', 'Bella Young', 'Caleb Zhang', 'Daisy Abbott', 'Ethan Bell', 'Freya Cole', 'Gabriel Dunn',
  'Hannah Ellis', 'Isaac Ford', 'Jade Grant', 'Kai Hart', 'Luna Ingram', 'Max Jordan', 'Nora Kelly',
  'Owen Lane', 'Piper Moss', 'Quentin Nash', 'Rose Ortiz', 'Seth Price', 'Tara Ross', 'Uma Shah',
  'Victor Stone', 'Willow Tate', 'Xavier Vance', 'Yara West', 'Zack Wood', 'Amelia Cruz', 'Ben Ito',
  'Clara Lund', 'David Moreau', 'Emma Rossi', 'Felix Sato', 'Gemma Hale', 'Hugo Berg', 'Ivy Chen',
  'James Okafor', 'Kira Mehta', 'Liam Doyle', 'Maya Patel',
];
/** Customers 1–16 come several times a week. */
const REGULARS = Array.from({ length: 16 }, (_, i) => i + 1);
/** Regulars who came for the Secret Cake, and stopped after August. */
export const CAKE_LOVERS = [3, 7, 11, 14];
/** Customers 17–55 drop in now and then; 56–60 signed up but never ordered. */
const OCCASIONAL = Array.from({ length: 39 }, (_, i) => i + 17);

// --- Seeded randomness (mulberry32): same numbers on every machine -------------------------------

function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Customer = { customer_id: number; name: string; joined_on: string };
export type Sale = {
  sale_id: number;
  order_id: number;
  sold_at: string;
  item_id: number;
  quantity: number;
  unit_price: number;
  channel: 'dine-in' | 'takeaway' | 'delivery';
  customer_id: number | null;
};

/** Orders per weekday (0 = Sunday … 6 = Saturday). Tuesday is market day. */
const ORDERS_BY_WEEKDAY = [56, 46, 27, 46, 48, 54, 62];
/** Opening hours 7:00–17:59, weight per hour. */
const HOURS: Weighted = [[7, 6], [8, 10], [9, 9], [10, 6], [11, 5], [12, 9], [13, 8], [14, 5], [15, 6], [16, 5], [17, 3]];

const pad = (n: number) => String(n).padStart(2, '0');
const dateOf = (day: Date) => `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`;

export function generateSalesData(): { customers: Customer[]; sales: Sale[] } {
  const rand = random(20261031);
  const pick = (list: Weighted): number => {
    const total = list.reduce((s, [, w]) => s + w, 0);
    let r = rand() * total;
    for (const [id, w] of list) if ((r -= w) < 0) return id;
    return list[list.length - 1][0];
  };
  const chance = (p: number) => rand() < p;
  const between = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
  // The October milk story has its own random stream, so tuning it never reshuffles the rest of the data.
  const milkRand = random(1031);
  const milkChance = (p: number) => milkRand() < p;

  const customers: Customer[] = NAMES.map((name, i) => {
    const id = i + 1;
    // Regulars joined long ago; a few customers joined only in October.
    const year = id <= 16 ? 2025 : 2026;
    const month = id <= 16 ? between(1, 12) : id >= 50 && id <= 55 ? 10 : between(1, 7);
    return { customer_id: id, name, joined_on: `${year}-${pad(month)}-${pad(between(1, 28))}` };
  });

  const sales: Sale[] = [];
  let orderId = 0;

  const addOrder = (day: Date, hour: number, items: number[], customerId: number | null) => {
    if (items.length === 0) return;
    orderId++;
    const minute = between(0, 59);
    const second = between(0, 59);
    const date = dateOf(day);
    const lunch = hour >= 12 && hour <= 13;
    const r = rand();
    const channel = r < (lunch ? 0.25 : 0.08) ? 'delivery' : r < 0.45 ? 'takeaway' : 'dine-in';
    // The same item twice in one order becomes one line with quantity 2.
    const counts = new Map<number, number>();
    for (const id of items) counts.set(id, (counts.get(id) ?? 0) + 1);
    for (const [itemId, quantity] of counts) {
      sales.push({
        sale_id: sales.length + 1,
        order_id: orderId,
        sold_at: `${date} ${pad(hour)}:${pad(minute)}:${pad(second)}`,
        item_id: itemId,
        quantity,
        unit_price: MENU_PRICES[itemId],
        channel,
        customer_id: customerId,
      });
    }
  };

  /** What someone orders at this hour. */
  const basket = (hour: number, august: boolean): number[] => {
    const items: number[] = [];
    const desserts: Weighted = august ? [...DESSERT, [SECRET_CAKE, 4]] : DESSERT;
    if (hour <= 11) {
      items.push(pick(chance(0.82) ? COFFEE : TEA_AND_COLD));
      if (chance(0.4)) items.push(pick(PASTRY));
      if (chance(0.12)) items.push(pick(COFFEE));
    } else if (hour <= 14) {
      if (chance(0.55)) items.push(pick(SANDWICH));
      items.push(pick(chance(0.6) ? COFFEE : TEA_AND_COLD));
      if (chance(0.2)) items.push(pick(desserts));
    } else {
      items.push(pick(chance(0.55) ? COFFEE : TEA_AND_COLD));
      items.push(pick(chance(0.5) ? desserts : PASTRY));
      if (chance(0.15)) items.push(pick(PASTRY));
    }
    return items;
  };

  /** Short-milk October mornings: milk drinks are out; some switch to black coffee, others go. */
  const withoutMilk = (items: number[]): number[] =>
    items.flatMap((id) => {
      if (!MILK_DRINKS.includes(id)) return [id];
      return milkChance(MILK_SWITCH) ? [milkChance(0.5) ? AMERICANO : ESPRESSO] : [];
    });

  for (let t = Date.UTC(2026, 7, 1); t <= Date.UTC(2026, 9, 31); t += 86400000) {
    const day = new Date(t);
    const weekday = day.getUTCDay();
    const august = day.getUTCMonth() === 7;
    const october = day.getUTCMonth() === 9;
    const shortMilk = october && milkChance(MILK_SHORT_DAYS);

    const orders = Math.round(ORDERS_BY_WEEKDAY[weekday] * (0.88 + rand() * 0.24));
    for (let i = 0; i < orders; i++) {
      const hour = pick(HOURS);
      let items = basket(hour, august);
      if (shortMilk && hour <= 11 && items.some((id) => MILK_DRINKS.includes(id))) {
        items = withoutMilk(items);
        // A morning without a latte keeps some people away altogether.
        if (milkChance(MILK_LEAVE)) items = [];
      }
      // Occasional customers can only order once they have joined.
      const joined = OCCASIONAL.filter((id) => customers[id - 1].joined_on <= dateOf(day));
      addOrder(day, hour, items, chance(0.22) ? joined[between(0, joined.length - 1)] : null);
    }

    // Regulars, mostly in the morning. The cake lovers stop coming once the cake is gone.
    for (const id of REGULARS) {
      const cakeLover = CAKE_LOVERS.includes(id);
      if (cakeLover && !august) continue;
      if (!chance(cakeLover ? 0.45 : 0.32)) continue;
      const hour = cakeLover ? between(14, 16) : between(7, 10);
      let items = cakeLover ? [pick(COFFEE), ...(chance(0.75) ? [SECRET_CAKE] : [pick(DESSERT)])] : basket(hour, august);
      if (shortMilk && hour <= 11) items = withoutMilk(items);
      addOrder(day, hour, items, id);
    }
  }

  // Order lines in time order, numbered again so sale_id follows sold_at.
  sales.sort((a, b) => (a.sold_at < b.sold_at ? -1 : a.sold_at > b.sold_at ? 1 : a.sale_id - b.sale_id));
  const orderOrder = new Map<number, number>();
  for (const s of sales) if (!orderOrder.has(s.order_id)) orderOrder.set(s.order_id, orderOrder.size + 1);
  sales.forEach((s, i) => {
    s.sale_id = i + 1;
    s.order_id = orderOrder.get(s.order_id)!;
  });
  return { customers, sales };
}

export const SALES_SCHEMA_SQL = `
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  joined_on   DATE NOT NULL
);

CREATE TABLE sales (
  sale_id     INTEGER PRIMARY KEY,
  order_id    INTEGER NOT NULL,
  sold_at     TIMESTAMP NOT NULL,
  item_id     INTEGER NOT NULL REFERENCES menu_items (item_id),
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC(5, 2) NOT NULL,
  channel     TEXT NOT NULL,
  customer_id INTEGER REFERENCES customers (customer_id)
);
`;

const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** INSERT statements for the generated rows, in chunks so no statement is huge. */
export function salesSeedSql(): string {
  const { customers, sales } = generateSalesData();
  const parts = [
    `INSERT INTO customers (customer_id, name, joined_on) VALUES\n${customers
      .map((c) => `(${c.customer_id}, ${quote(c.name)}, '${c.joined_on}')`)
      .join(',\n')};`,
  ];
  for (let i = 0; i < sales.length; i += 1000) {
    const rows = sales
      .slice(i, i + 1000)
      .map(
        (s) =>
          `(${s.sale_id}, ${s.order_id}, '${s.sold_at}', ${s.item_id}, ${s.quantity}, ${s.unit_price.toFixed(2)}, '${s.channel}', ${s.customer_id ?? 'NULL'})`,
      )
      .join(',\n');
    parts.push(
      `INSERT INTO sales (sale_id, order_id, sold_at, item_id, quantity, unit_price, channel, customer_id) VALUES\n${rows};`,
    );
  }
  return parts.join('\n');
}
