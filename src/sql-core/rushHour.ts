/**
 * Rush Hour (GAME_DESIGN.md §5): a timed round of quick requests, open after Chapter 2.
 * Each request is small and uses skills the player already has. Pure data + logic.
 */
import type { StationId } from './stations';

export type RushRequest = {
  id: string;
  /** The earliest chapter whose skills it needs: it only appears once that chapter is done. */
  chapter: number;
  /** What the customer wants (English; Indonesian in locales/id/rushHour.ts). */
  prompt: string;
  solution: string;
};

/** Rush Hour runs at the cash register: it sees the menu, the sales and the customers. */
export const RUSH_STATION: StationId = 'cash-register';
/** One round, in seconds. */
export const RUSH_SECONDS = 150;

export const RUSH_REQUESTS: RushRequest[] = [
  { id: 'r1', chapter: 0, prompt: 'The name of every menu item.', solution: 'SELECT name FROM menu_items;' },
  { id: 'r2', chapter: 0, prompt: 'Every column of every menu item.', solution: 'SELECT * FROM menu_items;' },
  {
    id: 'r3',
    chapter: 1,
    prompt: 'The name and price of every pastry.',
    solution: "SELECT name, price FROM menu_items WHERE category = 'pastry';",
  },
  {
    id: 'r4',
    chapter: 1,
    prompt: "The name of every item that isn't available.",
    solution: 'SELECT name FROM menu_items WHERE is_available = FALSE;',
  },
  {
    id: 'r5',
    chapter: 1,
    prompt: 'The name of every item with "Latte" in its name.',
    solution: "SELECT name FROM menu_items WHERE name LIKE '%Latte%';",
  },
  {
    id: 'r6',
    chapter: 1,
    prompt: 'The name of every item that costs exactly $3.00.',
    solution: 'SELECT name FROM menu_items WHERE price = 3;',
  },
  {
    id: 'r7',
    chapter: 1,
    prompt: 'The name of every item in the tea or sandwich category.',
    solution: "SELECT name FROM menu_items WHERE category IN ('tea', 'sandwich');",
  },
  {
    id: 'r8',
    chapter: 1,
    prompt: 'The name of every item with no cost written down.',
    solution: 'SELECT name FROM menu_items WHERE cost IS NULL;',
  },
  {
    id: 'r9',
    chapter: 2,
    prompt: 'The name and price of the single most expensive dessert.',
    solution: "SELECT name, price FROM menu_items WHERE category = 'dessert' ORDER BY price DESC LIMIT 1;",
  },
  { id: 'r10', chapter: 2, prompt: 'Every category, each one once.', solution: 'SELECT DISTINCT category FROM menu_items;' },
  {
    id: 'r11',
    chapter: 2,
    prompt: 'The name and price of every sandwich, cheapest first.',
    solution: "SELECT name, price FROM menu_items WHERE category = 'sandwich' ORDER BY price;",
  },
  {
    id: 'r12',
    chapter: 2,
    prompt: 'The name and margin (price − cost, named margin) of every dessert.',
    solution: "SELECT name, price - cost AS margin FROM menu_items WHERE category = 'dessert';",
  },
  {
    id: 'r13',
    chapter: 2,
    prompt: 'The name of the item that costs us the least to make.',
    solution: 'SELECT name FROM menu_items ORDER BY cost LIMIT 1;',
  },
  { id: 'r14', chapter: 3, prompt: 'How many items are on the menu?', solution: 'SELECT COUNT(*) FROM menu_items;' },
  {
    id: 'r15',
    chapter: 3,
    prompt: 'The average price of a coffee drink, rounded to 2 decimals.',
    solution: "SELECT ROUND(AVG(price), 2) FROM menu_items WHERE category = 'coffee';",
  },
  {
    id: 'r16',
    chapter: 3,
    prompt: 'Each category with how many items it has.',
    solution: 'SELECT category, COUNT(*) FROM menu_items GROUP BY category;',
  },
];

/** The requests a player who has finished chapters below `reached` can get. */
export function rushPool(reached: number): RushRequest[] {
  return RUSH_REQUESTS.filter((r) => r.chapter < reached);
}

/** Rush Hour opens once Chapter 2 is finished (the player has reached Chapter 3). */
export const rushUnlocked = (reached: number) => reached >= 3;

/** Points for a correct answer: 100, plus 20 for every correct answer in a row before it. */
export function rushPoints(combo: number): number {
  return 100 + 20 * Math.max(0, combo - 1);
}

/** A shuffled order of the pool (Fisher–Yates with the given random source). */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
