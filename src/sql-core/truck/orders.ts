/**
 * Food truck orders (GAME_DESIGN.md §4–§5). In the Phase 4 prototype they are written by hand:
 * the customer's line is the request, the level holds the SQL (a Chapter 1 level, or one of the
 * truck's own levels in levels.ts). Phase 5 replaces this list with order templates.
 */
import type { Lang } from '../feedback';
import { ORDERS_ID } from './locales/id/orders';

export type CustomerLook = 'student' | 'runner' | 'painter' | 'office' | 'grandpa';

export type TruckOrder = {
  /** Stable id (saved in progress later). */
  id: string;
  /** The level whose task and answer this order uses. */
  levelId: string;
  look: CustomerLook;
  /** What the customer says at the window. */
  line: string;
  /** What they buy once served: menu item ids and quantities (recorded in `sales`). */
  buys: readonly { itemId: number; quantity: number }[];
};

export const PROTOTYPE_ORDERS: readonly TruckOrder[] = [
  {
    id: 'proto-cheap',
    levelId: 'ch1-1',
    look: 'student',
    line: "I've only got three bucks left this week. What can I get for under $3?",
    buys: [{ itemId: 10, quantity: 1 }],
  },
  {
    id: 'proto-coffee',
    levelId: 'ch1-2',
    look: 'office',
    line: 'Coffee. I need coffee. What do you have, and how much?',
    buys: [{ itemId: 2, quantity: 2 }],
  },
  {
    id: 'proto-available',
    levelId: 'ch1-3',
    look: 'runner',
    line: "Which coffees can I actually order today? Not the ones you're out of.",
    buys: [{ itemId: 3, quantity: 1 }],
  },
  {
    id: 'proto-milk-supplier',
    levelId: 'truck-milk-supplier',
    look: 'grandpa',
    line: 'Your milk tastes different lately. Who brings it now, and when?',
    buys: [{ itemId: 11, quantity: 1 }],
  },
  {
    id: 'proto-milk-recipes',
    levelId: 'truck-milk-recipes',
    look: 'painter',
    line: 'My doctor says less milk. How much milk is in each of your drinks?',
    buys: [{ itemId: 6, quantity: 1 }],
  },
  {
    id: 'proto-tea-dessert',
    levelId: 'ch1-4',
    look: 'student',
    line: 'Coffee keeps me up at night. Show me your teas and desserts, please.',
    buys: [{ itemId: 10, quantity: 1 }, { itemId: 27, quantity: 1 }],
  },
  {
    id: 'proto-chocolate',
    levelId: 'ch1-5',
    look: 'office',
    line: 'Anything with chocolate in it? I mean anything at all.',
    buys: [{ itemId: 5, quantity: 1 }, { itemId: 26, quantity: 2 }],
  },
];

/** The customer's line in the player's language (English when no translation exists). */
export function orderLine(order: TruckOrder, lang: Lang): string {
  if (lang === 'id') return ORDERS_ID[order.id] ?? order.line;
  return order.line;
}
