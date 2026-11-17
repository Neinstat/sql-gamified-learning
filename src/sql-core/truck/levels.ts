/**
 * Requests written for the food truck (GAME_DESIGN.md §4–§5), next to the v1 chapters. They need
 * an object other than the tablet: the fridge (stock) or the recipe binders. Same format as the
 * chapter levels; week 2 concepts only (WHERE, AND, IS NULL), with fill-in-the-blank input.
 */
import { allLevels, applyText, getChapters, type Level, type RequestLevel } from '../levels';
import type { Lang } from '../feedback';
import { TRUCK_LEVELS_ID } from './locales/id/levels';

export const TRUCK_LEVELS: readonly RequestLevel[] = [
  {
    id: 'truck-milk-supplier',
    title: 'Who Brings the Milk?',
    character: 'regular',
    station: 'stock-ledger',
    dialogue: ['Your milk tastes different lately.', 'Who supplies it now, and when does it get here?'],
    task: 'Show the name and delivery_time of the milk supplier you use now (its until date is empty).',
    input: {
      kind: 'fill-blank',
      template: "SELECT name, delivery_time FROM suppliers WHERE product = 'milk' AND ___ IS NULL;",
      answers: ['until'],
    },
    solution: "SELECT name, delivery_time FROM suppliers WHERE product = 'milk' AND until IS NULL;",
    hints: [
      'There have been two milk suppliers. The one you use now has no end date yet.',
      'Which column says until when a supplier was used?',
      "… WHERE product = 'milk' AND until IS NULL;",
    ],
    success: 'Highland Dairy, at noon? No wonder there was no milk this morning.',
  },
  {
    id: 'truck-milk-recipes',
    title: 'How Much Milk?',
    character: 'regular',
    station: 'recipe-book',
    dialogue: ["My doctor says I should cut down on milk.", 'How much milk goes into each of your drinks?'],
    task: 'Show the item_id and amount of every recipe line that uses milk.',
    input: {
      kind: 'fill-blank',
      template: 'SELECT item_id, amount FROM recipes WHERE ingredient = ___;',
      answers: ["'milk'"],
    },
    solution: "SELECT item_id, amount FROM recipes WHERE ingredient = 'milk';",
    hints: [
      'Each row of recipes is one ingredient of one item.',
      'Text values go in single quotes.',
      "… WHERE ingredient = 'milk';",
    ],
    success: 'Item 6 only has 120 ml? I will take that one, then.',
  },
];

/**
 * The level an order uses, in the player's language: a chapter level or a truck level.
 * Falls back to English when there is no translation.
 */
export function findOrderLevel(levelId: string, lang: Lang): Level | undefined {
  const chapterLevel = getChapters(lang)
    .flatMap((c) => c.levels)
    .find((l) => l.id === levelId);
  if (chapterLevel) return chapterLevel;
  const truckLevel = TRUCK_LEVELS.find((l) => l.id === levelId);
  if (!truckLevel) return undefined;
  return lang === 'id' ? applyText(truckLevel, TRUCK_LEVELS_ID[levelId]) : truckLevel;
}

/** Every level an order can use, in English (for tests). */
export const ORDER_LEVELS: readonly Level[] = [...allLevels, ...TRUCK_LEVELS];
