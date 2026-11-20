/**
 * Order templates (GAME_DESIGN.md §5): one kind of request with parameters, e.g. "anything under
 * {max}?". Each template practises one concept, and each variant is one set of parameters with
 * what the customer buys once served. An order is a template + a variant, so its id
 * (`template:variant`, e.g. `price-under:3.5`) says everything needed to rebuild it, and the
 * purchases recorded in `sales` can be replayed from a saved day.
 *
 * Text is English here; Indonesian lives in locales/id/templates.ts. SQL is never translated.
 */
import type { InputMode } from '../levels';
import type { StationId } from '../stations';
import type { ConceptId } from './concepts';

export type Purchase = { itemId: number; quantity: number };
export type Params = Readonly<Record<string, string | number>>;

/** "$3", "$3.50" */
export const money = (n: number | string) => {
  const v = Number(n);
  return Number.isInteger(v) ? `$${v}` : `$${v.toFixed(2)}`;
};

/** A template's words, built from the variant's parameters. */
export type TemplateText = {
  title: (p: Params) => string;
  /** Ways a customer can say it (one is picked per order). */
  lines: readonly ((p: Params) => string)[];
  task: (p: Params) => string;
  /** General direction → the clause needed → almost the answer. */
  hints: readonly [(p: Params) => string, (p: Params) => string, (p: Params) => string];
  success: (p: Params) => string;
};

export type TemplateVariant = {
  /** Part of the order id, saved in progress: never change a key once released. */
  key: string;
  params: Params;
  buys: readonly Purchase[];
};

export type OrderTemplate = {
  /** Saved in progress: never rename. */
  id: string;
  concept: ConceptId;
  /** Where it is answered: the station's tables must hold everything the solution reads. */
  station: StationId;
  variants: readonly TemplateVariant[];
  solution: (p: Params) => string;
  input: (p: Params) => InputMode;
  text: TemplateText;
};

const buy = (itemId: number, quantity = 1): Purchase => ({ itemId, quantity });

/** How customers say a category in a sentence. */
const CATEGORY_WORDS: Record<string, string> = {
  coffee: 'coffees',
  tea: 'teas',
  pastry: 'pastries',
  sandwich: 'sandwiches',
  dessert: 'desserts',
};
const word = (category: string | number) => CATEGORY_WORDS[String(category)] ?? String(category);

export const TEMPLATES: readonly OrderTemplate[] = [
  {
    id: 'price-under',
    concept: 'where-compare',
    station: 'menu-board',
    // Every limit is also the exact price of some item, so <= instead of < shows extra rows.
    variants: [
      { key: '3', params: { max: 3 }, buys: [buy(10)] },
      { key: '3.5', params: { max: 3.5 }, buys: [buy(19)] },
      { key: '4', params: { max: 4 }, buys: [buy(3)] },
      { key: '4.5', params: { max: 4.5 }, buys: [buy(12)] },
    ],
    solution: (p) => `SELECT name, price FROM menu_items WHERE price < ${p.max};`,
    input: (p) => ({
      kind: 'fill-blank',
      template: `SELECT name, price FROM menu_items WHERE price ___ ${p.max};`,
      answers: ['<'],
    }),
    text: {
      title: (p) => `Under ${money(p.max)}`,
      lines: [
        (p) => `I've only got ${money(p.max)} on me. What can I get for less than that?`,
        (p) => `Payday is still a week away. Anything under ${money(p.max)}?`,
        (p) => `What do you have for less than ${money(p.max)}? Names and prices, please.`,
      ],
      task: (p) => `Show the name and price of every item priced under ${money(p.max)}.`,
      hints: [
        () => 'You are comparing the price column with a number.',
        (p) => `"Under ${money(p.max)}" means less than — an item at exactly ${money(p.max)} doesn't count.`,
        (p) => `… WHERE price < ${p.max};`,
      ],
      success: () => 'That fits my budget. Thanks!',
    },
  },
  {
    id: 'price-at-least',
    concept: 'where-compare',
    station: 'menu-board',
    variants: [
      { key: '4.75', params: { min: 4.75 }, buys: [buy(27)] },
      { key: '5.5', params: { min: 5.5 }, buys: [buy(25)] },
      { key: '6', params: { min: 6 }, buys: [buy(22)] },
    ],
    solution: (p) => `SELECT name, price FROM menu_items WHERE price >= ${p.min};`,
    input: (p) => ({
      kind: 'fill-blank',
      template: `SELECT name, price FROM menu_items WHERE price ___ ${p.min};`,
      answers: ['>='],
    }),
    text: {
      title: (p) => `${money(p.min)} or More`,
      lines: [
        (p) => `It's my birthday. Show me everything that costs ${money(p.min)} or more!`,
        (p) => `I'm starving. What do you have for ${money(p.min)} and up?`,
      ],
      task: (p) => `Show the name and price of every item that costs ${money(p.min)} or more.`,
      hints: [
        () => 'You are comparing the price column with a number.',
        (p) => `"Or more" includes ${money(p.min)} itself: greater than or equal.`,
        (p) => `… WHERE price >= ${p.min};`,
      ],
      success: () => 'Now that is a proper treat.',
    },
  },
  {
    id: 'category',
    concept: 'where-text',
    station: 'menu-board',
    variants: [
      { key: 'coffee', params: { category: 'coffee' }, buys: [buy(4)] },
      { key: 'tea', params: { category: 'tea' }, buys: [buy(11)] },
      { key: 'pastry', params: { category: 'pastry' }, buys: [buy(17)] },
      { key: 'sandwich', params: { category: 'sandwich' }, buys: [buy(24)] },
      { key: 'dessert', params: { category: 'dessert' }, buys: [buy(25)] },
    ],
    solution: (p) => `SELECT name, price FROM menu_items WHERE category = '${p.category}';`,
    input: (p) => ({
      kind: 'fill-blank',
      template: 'SELECT name, price FROM menu_items WHERE category = ___;',
      answers: [`'${p.category}'`],
    }),
    text: {
      title: (p) => `What ${word(p.category)}?`,
      lines: [
        (p) => `What ${word(p.category)} do you have, and how much are they?`,
        (p) => `I'm in the mood for one of your ${word(p.category)}. Show me what you've got, with prices.`,
      ],
      task: (p) => `Show the name and price of every item in the ${p.category} category.`,
      hints: [
        () => 'Compare the category column with a word.',
        (p) => `${p.category} is text, so it goes inside single quotes.`,
        (p) => `… WHERE category = '${p.category}';`,
      ],
      success: () => 'Hard to choose… I will take one.',
    },
  },
  {
    id: 'available',
    concept: 'and',
    station: 'menu-board',
    variants: [
      { key: 'coffee', params: { category: 'coffee' }, buys: [buy(3)] },
      { key: 'dessert', params: { category: 'dessert' }, buys: [buy(26)] },
      { key: 'tea', params: { category: 'tea' }, buys: [buy(13)] },
    ],
    solution: (p) => `SELECT name FROM menu_items WHERE category = '${p.category}' AND is_available = TRUE;`,
    input: (p) => ({
      kind: 'fill-blank',
      template: `SELECT name FROM menu_items WHERE category = '${p.category}' ___ is_available = TRUE;`,
      answers: ['AND'],
    }),
    text: {
      title: (p) => `Available ${word(p.category)}`,
      lines: [
        (p) => `Which ${word(p.category)} can I actually order today? Not the ones you're out of.`,
        (p) => `Don't tell me about ${word(p.category)} you can't make. What's available today?`,
      ],
      task: (p) => `Show the name of every ${p.category} item that is available.`,
      hints: [
        () => 'Both conditions must be true at the same time.',
        () => 'Which word joins two conditions so that both must hold?',
        (p) => `… WHERE category = '${p.category}' AND is_available = TRUE;`,
      ],
      success: () => 'Good, no disappointment today.',
    },
  },
  {
    id: 'category-under',
    concept: 'and',
    station: 'menu-board',
    variants: [
      { key: 'coffee-4', params: { category: 'coffee', max: 4 }, buys: [buy(2)] },
      { key: 'pastry-3.5', params: { category: 'pastry', max: 3.5 }, buys: [buy(17)] },
      { key: 'dessert-5', params: { category: 'dessert', max: 5 }, buys: [buy(26)] },
      { key: 'sandwich-6.5', params: { category: 'sandwich', max: 6.5 }, buys: [buy(24)] },
    ],
    solution: (p) => `SELECT name, price FROM menu_items WHERE category = '${p.category}' AND price < ${p.max};`,
    input: (p) => ({
      kind: 'fill-blank',
      template: `SELECT name, price FROM menu_items WHERE category = '${p.category}' ___ price < ${p.max};`,
      answers: ['AND'],
    }),
    text: {
      title: (p) => `Cheap ${word(p.category)}`,
      lines: [
        (p) => `One of your ${word(p.category)}, but under ${money(p.max)}. What are my options?`,
        (p) => `Any ${word(p.category)} for less than ${money(p.max)}? Prices too, please.`,
      ],
      task: (p) => `Show the name and price of every ${p.category} item priced under ${money(p.max)}.`,
      hints: [
        () => 'Two conditions: the category, and the price. Both must hold.',
        () => 'Which word joins two conditions so that both must be true?',
        (p) => `… WHERE category = '${p.category}' AND price < ${p.max};`,
      ],
      success: () => 'Perfect. Cheap and cheerful.',
    },
  },
  {
    id: 'two-categories',
    concept: 'in',
    station: 'menu-board',
    variants: [
      { key: 'tea-dessert', params: { a: 'tea', b: 'dessert' }, buys: [buy(11), buy(27)] },
      { key: 'pastry-sandwich', params: { a: 'pastry', b: 'sandwich' }, buys: [buy(20), buy(22)] },
      { key: 'coffee-pastry', params: { a: 'coffee', b: 'pastry' }, buys: [buy(1), buy(18)] },
      { key: 'tea-pastry', params: { a: 'tea', b: 'pastry' }, buys: [buy(10), buy(19)] },
    ],
    solution: (p) => `SELECT name, category FROM menu_items WHERE category IN ('${p.a}', '${p.b}');`,
    input: (p) => ({
      kind: 'fill-blank',
      template: `SELECT name, category FROM menu_items WHERE category ___ ('${p.a}', '${p.b}');`,
      answers: ['IN'],
    }),
    text: {
      title: (p) => `${word(p.a)} and ${word(p.b)}`.replace(/^./, (c) => c.toUpperCase()),
      lines: [
        (p) => `I'm buying for my partner too. Show me your ${word(p.a)} and your ${word(p.b)}.`,
        (p) => `Just ${word(p.a)} and ${word(p.b)}, please — what do you have? With the category, so I can tell them apart.`,
      ],
      task: (p) => `Show the name and category of every item in the ${p.a} or ${p.b} category.`,
      hints: [
        () => 'The category can be one of two values.',
        () => 'Which word checks a value against a list in brackets?',
        (p) => `… WHERE category IN ('${p.a}', '${p.b}');`,
      ],
      success: () => 'One of each, then!',
    },
  },
  {
    id: 'name-like',
    concept: 'like',
    station: 'menu-board',
    variants: [
      { key: 'Chocolate', params: { text: 'Chocolate' }, buys: [buy(18)] },
      { key: 'Latte', params: { text: 'Latte' }, buys: [buy(4)] },
      { key: 'Tea', params: { text: 'Tea' }, buys: [buy(14)] },
      { key: 'Croissant', params: { text: 'Croissant' }, buys: [buy(17)] },
    ],
    solution: (p) => `SELECT name FROM menu_items WHERE name LIKE '%${p.text}%';`,
    input: (p) => ({
      kind: 'fill-blank',
      template: `SELECT name FROM menu_items WHERE name ___ '%${p.text}%';`,
      answers: ['LIKE'],
    }),
    text: {
      title: (p) => `Anything "${p.text}"`,
      lines: [
        (p) => `Anything with "${p.text}" in its name? I'll take any of them.`,
        (p) => `I only remember the word "${p.text}". Which items have it in the name?`,
      ],
      task: (p) => `Show the name of every item whose name contains ${p.text}.`,
      hints: [
        () => 'You are not matching a whole name, only a piece of it.',
        () => "Which word compares text with a pattern? % stands for any text.",
        (p) => `… WHERE name LIKE '%${p.text}%';`,
      ],
      success: () => 'That one! That is what I was thinking of.',
    },
  },
  {
    id: 'description-like',
    concept: 'like',
    station: 'menu-board',
    variants: [
      { key: 'chocolate', params: { text: 'chocolate' }, buys: [buy(5)] },
      { key: 'milk', params: { text: 'milk' }, buys: [buy(6)] },
      { key: 'cinnamon', params: { text: 'cinnamon' }, buys: [buy(20)] },
    ],
    solution: (p) => `SELECT name FROM menu_items WHERE description LIKE '%${p.text}%';`,
    input: (p) => ({
      kind: 'fill-blank',
      template: 'SELECT name FROM menu_items WHERE description LIKE ___;',
      answers: [`'%${p.text}%'`],
    }),
    text: {
      title: (p) => `Hidden ${p.text}`,
      lines: [
        (p) => `I love ${p.text}. Which items have it? Read the descriptions — the names don't tell you everything.`,
        (p) => `Is there ${p.text} in anything? Check what each item's description says.`,
      ],
      task: (p) => `Show the name of every item whose description mentions ${p.text}.`,
      hints: [
        () => 'The names are not enough: search the column that describes each item.',
        (p) => `A pattern with % on both sides finds ${p.text} anywhere in the text. Patterns go in quotes.`,
        (p) => `… WHERE description LIKE '%${p.text}%';`,
      ],
      success: () => 'Ooh, I never knew. I will try that.',
    },
  },
  {
    id: 'missing-value',
    concept: 'is-null',
    station: 'menu-board',
    variants: [
      { key: 'description', params: { column: 'description' }, buys: [buy(10)] },
      { key: 'category', params: { column: 'category' }, buys: [buy(15)] },
      { key: 'price', params: { column: 'price' }, buys: [buy(2)] },
    ],
    solution: (p) => `SELECT name FROM menu_items WHERE ${p.column} IS NULL;`,
    input: (p) => ({
      kind: 'fill-blank',
      template: `SELECT name FROM menu_items WHERE ${p.column} ___;`,
      answers: ['IS NULL'],
    }),
    text: {
      title: (p) => `No ${p.column}`,
      lines: [
        (p) =>
          p.column === 'description'
            ? "I have allergies. Which items don't have a description yet? I won't risk those."
            : p.column === 'category'
              ? "Your menu looks a bit messy. Which items don't even have a category?"
              : "I couldn't find a price for something on your board. Which items have no price at all?",
      ],
      task: (p) => `Show the name of every item whose ${p.column} is missing.`,
      hints: [
        () => 'A missing value is NULL: not zero, not empty text.',
        () => '= NULL never matches anything. There is a special way to test for NULL.',
        (p) => `… WHERE ${p.column} IS NULL;`,
      ],
      success: () => 'Thanks. Somebody should fill those in!',
    },
  },
  {
    id: 'supplier-now',
    concept: 'is-null',
    station: 'stock-ledger',
    variants: [
      { key: 'milk', params: { product: 'milk' }, buys: [buy(11)] },
      { key: 'coffee beans', params: { product: 'coffee beans' }, buys: [buy(2)] },
      { key: 'flour', params: { product: 'flour' }, buys: [buy(21)] },
    ],
    solution: (p) => `SELECT name, delivery_time FROM suppliers WHERE product = '${p.product}' AND until IS NULL;`,
    input: (p) => ({
      kind: 'fill-blank',
      template: `SELECT name, delivery_time FROM suppliers WHERE product = '${p.product}' AND ___ IS NULL;`,
      answers: ['until'],
    }),
    text: {
      title: (p) => `Who Brings the ${p.product}?`,
      lines: [
        (p) =>
          p.product === 'milk'
            ? 'Your milk tastes different lately. Who brings it now, and when?'
            : `Who supplies your ${p.product} these days, and what time does it arrive?`,
      ],
      task: (p) => `Show the name and delivery_time of the ${p.product} supplier you use now (its until date is empty).`,
      hints: [
        () => 'A supplier you still use has no end date yet.',
        () => 'Which column says until when a supplier was used?',
        (p) => `… WHERE product = '${p.product}' AND until IS NULL;`,
      ],
      success: (p) => (p.product === 'milk' ? 'Highland Dairy, at noon? No wonder there was no milk this morning.' : 'Good to know who to thank.'),
    },
  },
  {
    id: 'recipe-ingredient',
    concept: 'where-text',
    station: 'recipe-book',
    variants: [
      { key: 'milk', params: { ingredient: 'milk' }, buys: [buy(6)] },
      { key: 'eggs', params: { ingredient: 'eggs' }, buys: [buy(17)] },
      { key: 'butter', params: { ingredient: 'butter' }, buys: [buy(10)] },
      { key: 'sugar', params: { ingredient: 'sugar' }, buys: [buy(11)] },
    ],
    solution: (p) => `SELECT item_id, amount FROM recipes WHERE ingredient = '${p.ingredient}';`,
    input: (p) => ({
      kind: 'fill-blank',
      template: 'SELECT item_id, amount FROM recipes WHERE ingredient = ___;',
      answers: [`'${p.ingredient}'`],
    }),
    text: {
      title: (p) => `How Much ${p.ingredient}?`,
      lines: [
        (p) => `My doctor says less ${p.ingredient}. How much ${p.ingredient} goes into each of your items?`,
        (p) => `I'm counting my ${p.ingredient}. Which recipes use it, and how much?`,
      ],
      task: (p) => `Show the item_id and amount of every recipe line that uses ${p.ingredient}.`,
      hints: [
        () => 'Each row of recipes is one ingredient of one item.',
        () => 'Text values go in single quotes.',
        (p) => `… WHERE ingredient = '${p.ingredient}';`,
      ],
      success: () => 'Useful. I will pick the lightest one.',
    },
  },
];

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);
