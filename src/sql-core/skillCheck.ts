/**
 * Skill Check (GAME_DESIGN.md §2): for players who already know some SQL.
 * Two questions per chapter, from Chapter 0 up. The first chapter with a missed question is
 * where the player starts. Questions differ from the levels', and are graded by the same checker.
 * Pure data + logic: no React, no game engine.
 */
import type { StationId } from './stations';

export type SkillQuestion = {
  id: string;
  /** The chapter whose skills this question checks. */
  chapter: number;
  /** One clear sentence, like a level's task (English; Indonesian in locales/id/skillCheck.ts). */
  prompt: string;
  /** Reference answer: only its result is compared. */
  solution: string;
};

/** Every Skill Check query runs at the cash register, which sees sales, customers and menu_items. */
export const SKILL_CHECK_STATION: StationId = 'cash-register';

export const SKILL_QUESTIONS: SkillQuestion[] = [
  { id: 'sc0-1', chapter: 0, prompt: 'Show every column of every customer.', solution: 'SELECT * FROM customers;' },
  {
    id: 'sc0-2',
    chapter: 0,
    prompt: 'Show the name and category of every menu item.',
    solution: 'SELECT name, category FROM menu_items;',
  },
  {
    id: 'sc1-1',
    chapter: 1,
    prompt: 'Show the name of every dessert that costs more than $4.',
    solution: "SELECT name FROM menu_items WHERE category = 'dessert' AND price > 4;",
  },
  {
    id: 'sc1-2',
    chapter: 1,
    prompt: 'Show the name of every menu item that has no description.',
    solution: 'SELECT name FROM menu_items WHERE description IS NULL;',
  },
  {
    id: 'sc2-1',
    chapter: 2,
    prompt: 'Show the name and price of the 3 most expensive coffee drinks, most expensive first.',
    solution: "SELECT name, price FROM menu_items WHERE category = 'coffee' ORDER BY price DESC LIMIT 3;",
  },
  {
    id: 'sc2-2',
    chapter: 2,
    prompt: "Show each sandwich's name and its margin (price − cost), with the margin column named margin.",
    solution: "SELECT name, price - cost AS margin FROM menu_items WHERE category = 'sandwich';",
  },
  {
    id: 'sc3-1',
    chapter: 3,
    prompt: 'Show the total number of items sold (the sum of quantity) through the takeaway channel.',
    solution: "SELECT SUM(quantity) FROM sales WHERE channel = 'takeaway';",
  },
  {
    id: 'sc3-2',
    chapter: 3,
    prompt: 'Show each channel with its number of orders (each order counted once), named orders.',
    solution: 'SELECT channel, COUNT(DISTINCT order_id) AS orders FROM sales GROUP BY channel;',
  },
  {
    id: 'sc4-1',
    chapter: 4,
    prompt: 'Show each menu category with its revenue (quantity × unit_price), named revenue.',
    solution:
      'SELECT m.category, SUM(s.quantity * s.unit_price) AS revenue FROM sales s JOIN menu_items m ON m.item_id = s.item_id GROUP BY m.category;',
  },
  {
    id: 'sc4-2',
    chapter: 4,
    prompt: 'Show the name of every customer who ordered through the delivery channel at least once, each name once.',
    solution:
      "SELECT DISTINCT c.name FROM customers c JOIN sales s ON s.customer_id = c.customer_id WHERE s.channel = 'delivery';",
  },
];

/** The chapters the Skill Check covers, in order. */
export const SKILL_CHAPTERS = [...new Set(SKILL_QUESTIONS.map((q) => q.chapter))];

/**
 * Where to start, given which questions were answered right: the first chapter with a miss.
 * When everything is right, the chapter after the last one checked.
 */
export function startingChapter(right: ReadonlySet<string>): number {
  for (const chapter of SKILL_CHAPTERS) {
    if (SKILL_QUESTIONS.some((q) => q.chapter === chapter && !right.has(q.id))) return chapter;
  }
  return SKILL_CHAPTERS[SKILL_CHAPTERS.length - 1] + 1;
}

/** The next question to ask, or null when the check is over (a chapter was missed, or all done). */
export function nextQuestion(answered: ReadonlyMap<string, boolean>): SkillQuestion | null {
  for (const chapter of SKILL_CHAPTERS) {
    const questions = SKILL_QUESTIONS.filter((q) => q.chapter === chapter);
    if (questions.some((q) => answered.get(q.id) === false)) return null;
    const open = questions.find((q) => !answered.has(q.id));
    if (open) return open;
  }
  return null;
}
