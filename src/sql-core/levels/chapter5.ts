import type { Chapter } from './types';

/**
 * Chapter 5 — The Analysis Case (storeroom and back office)
 * SQL: everything so far, many queries in a row. Business skill: "Sales dropped — why?"
 * The story is in the data (GAME_DESIGN.md §11): from 1 October the milk comes at noon from a cheaper
 * supplier, so on most October mornings there is no milk — and the lattes, cappuccinos and their
 * customers are gone.
 */
export const chapter5: Chapter = {
  id: 5,
  title: 'The Analysis Case',
  summary: 'October sales dropped. Every room of the café holds a clue.',
  levels: [
    {
      id: 'ch5-1',
      title: 'Who Delivers What',
      character: 'supplier',
      station: 'stock-ledger',
      lesson: {
        title: 'The storeroom: suppliers and inventory',
        body: [
          'suppliers lists who delivers what, at what time and price. inventory has one row per day and ingredient: how much came in, and when it ran out (sold_out_at, NULL if it never did).',
          'Times sort like a clock: ORDER BY delivery_time puts the earliest delivery first.',
        ],
        example: "SELECT day, delivered, sold_out_at FROM inventory WHERE ingredient = 'flour';",
      },
      dialogue: [
        "Morning! I'm the one who keeps this storeroom full. Welcome to my kingdom of crates.",
        'Grandma wants to know who delivers what, and when. Can you list the suppliers, earliest delivery first?',
      ],
      task: 'Show the name, product and delivery_time of every supplier, earliest delivery first.',
      input: { kind: 'free' },
      solution: 'SELECT name, product, delivery_time FROM suppliers ORDER BY delivery_time;',
      hints: [
        'One row per supplier, with three columns, sorted by the delivery time.',
        'ORDER BY delivery_time (small to big = early to late).',
        'SELECT name, product, delivery_time FROM suppliers ORDER BY delivery_time;',
      ],
      success:
        "Valley Dairy at six, the roasters at seven… and the new milk people, Highland Dairy, at noon. Cheaper, Grandma said. We'll see.",
    },
    {
      id: 'ch5-2',
      title: 'The Monthly Board',
      character: 'grandma',
      station: 'back-office',
      lesson: {
        title: "Grandma's computer",
        body: [
          'The computer in the back office can see every table in the café: the menu, the till, the kitchen and the storeroom.',
          'A good analysis starts with the big picture: the main numbers per month.',
        ],
      },
      dialogue: [
        "This is my office, dear. Grandpa's old computer still works — and it can see everything.",
        'Before we dig in, show me the big picture: revenue and number of orders for every month.',
      ],
      task: "Show each month (DATE_TRUNC('month', sold_at), named month) with its revenue and its number of orders (named orders), in date order.",
      input: { kind: 'free' },
      solution:
        "SELECT DATE_TRUNC('month', sold_at) AS month, SUM(quantity * unit_price) AS revenue, COUNT(DISTINCT order_id) AS orders FROM sales GROUP BY month ORDER BY month;",
      hints: [
        'Group by month, then two numbers per month: the revenue and the orders.',
        'SUM(quantity * unit_price) for revenue, COUNT(DISTINCT order_id) for orders, GROUP BY month, ORDER BY month.',
        "SELECT DATE_TRUNC('month', sold_at) AS month, SUM(quantity * unit_price) AS revenue, COUNT(DISTINCT order_id) AS orders FROM sales GROUP BY month ORDER BY month;",
      ],
      success: 'There it is, in black and white. October is far below September. Now we find out why.',
      soWhat: {
        question: 'Compare October with September. What changed most?',
        choices: [
          'Fewer orders — the orders themselves got only a little smaller',
          'Smaller orders — the same people spent less',
          'Nothing important: one bad month is normal',
        ],
        answer: 0,
        explanation:
          "Orders fell by about 15% (1,547 → 1,311), while the average order dropped only from $6.83 to $6.58. People stopped coming — or stopped buying something. That's the trail to follow.",
      },
    },
    {
      id: 'ch5-3',
      kind: 'case',
      title: 'October Sales Dropped',
      character: 'grandma',
      station: 'back-office',
      lesson: {
        title: 'The Analysis Case: drill down',
        body: [
          'A real question, no single right query. Work from the big picture down: how much? → what? → when? → why?',
          'Pin a result for every answer. The computer sees every table — the cause may be in another room of the café.',
          'Useful tools: DATE_TRUNC and EXTRACT(HOUR FROM sold_at), JOIN with menu_items, and the storeroom tables inventory and suppliers.',
        ],
      },
      dialogue: [
        "October sales dropped, and I can't sleep for it. The café has been here forty years.",
        'Nothing changed, I thought. Same menu, same prices, same smiles.',
        'You have become a real analyst, dear. Find out what happened — and show me the proof.',
      ],
      task: 'Find out how much October revenue fell, what fell, when, and why. Pin your evidence 📌 for each answer.',
      starters: [
        "SELECT DATE_TRUNC('month', sold_at) AS month, SUM(quantity * unit_price) AS revenue FROM sales GROUP BY month ORDER BY month;",
      ],
      questions: [
        {
          prompt: 'By what percentage did revenue fall from September to October?',
          answer: { kind: 'number', value: 18.36, tolerance: 0.6 },
          evidence: {
            sql: "SELECT SUM(quantity * unit_price) AS revenue FROM sales WHERE sold_at >= '2026-09-01' GROUP BY DATE_TRUNC('month', sold_at);",
            maxRows: 12,
          },
        },
        {
          prompt: 'Which item lost the most revenue?',
          answer: { kind: 'choice', choices: ['Avocado Toast', 'Latte', "Grandma's Secret Cake"], correct: 1 },
          evidence: [
            {
              sql: "SELECT SUM(s.quantity * s.unit_price) AS revenue FROM sales s JOIN menu_items m ON m.item_id = s.item_id WHERE m.name = 'Latte' AND s.sold_at >= '2026-09-01' GROUP BY DATE_TRUNC('month', s.sold_at);",
              maxRows: 60,
            },
            { sql: "SELECT 'Latte' AS name, -488.00 AS change;", maxRows: 30 },
            { sql: "SELECT 'Latte' AS name, 488.00 AS change;", maxRows: 30 },
          ],
        },
        {
          prompt: 'When during the day did October sales fall?',
          answer: {
            kind: 'choice',
            choices: ['In the morning, before noon', 'Around lunch', 'In the afternoon'],
            correct: 0,
          },
          evidence: [
            {
              sql: "SELECT SUM(quantity * unit_price) AS revenue FROM sales WHERE sold_at >= '2026-09-01' AND EXTRACT(HOUR FROM sold_at) < 12 GROUP BY DATE_TRUNC('month', sold_at);",
              maxRows: 12,
            },
            {
              sql: "SELECT SUM(quantity * unit_price) AS revenue FROM sales WHERE sold_at >= '2026-10-01' AND EXTRACT(HOUR FROM sold_at) < 12 GROUP BY EXTRACT(HOUR FROM sold_at);",
              maxRows: 40,
            },
          ],
        },
        {
          prompt: 'What is the most likely cause?',
          answer: {
            kind: 'choice',
            choices: [
              'Customers got tired of coffee',
              'The milk ran out in the mornings: the new supplier only delivers at noon',
              'Grandma raised the prices in October',
            ],
            correct: 1,
          },
          evidence: [
            {
              sql: "SELECT COUNT(*) AS days FROM inventory WHERE ingredient = 'milk' AND sold_out_at IS NOT NULL;",
              maxRows: 10,
            },
            { sql: "SELECT name, delivery_time FROM suppliers WHERE product = 'milk';", maxRows: 10 },
            {
              sql: "SELECT day, sold_out_at FROM inventory WHERE ingredient = 'milk' AND sold_out_at IS NOT NULL;",
              maxRows: 40,
            },
          ],
        },
        {
          prompt: 'What should Grandma do?',
          answer: {
            kind: 'choice',
            choices: [
              'Take milk drinks off the menu',
              'Lower the price of lattes',
              'Get milk delivered early in the morning again, even if it costs a little more',
            ],
            correct: 2,
          },
          evidence: [
            { sql: "SELECT name, delivery_time FROM suppliers WHERE product = 'milk';", maxRows: 10 },
            {
              sql: "SELECT COUNT(*) AS days FROM inventory WHERE ingredient = 'milk' AND sold_out_at IS NOT NULL;",
              maxRows: 10,
            },
          ],
        },
      ],
      hints: [
        'Compare September and October step by step: per item (JOIN menu_items), then per hour (EXTRACT(HOUR FROM sold_at)). Then visit the storeroom tables.',
        "The drop is in the morning and in milk drinks. Look at inventory for milk: is sold_out_at filled in? And who delivers milk, at what time?",
        "SELECT day, delivered_at, sold_out_at FROM inventory WHERE ingredient = 'milk' AND day >= '2026-09-25' ORDER BY day;",
      ],
      success:
        "The milk! Saving a few cents a litre cost me a fifth of my sales. I'm calling Valley Dairy first thing tomorrow. Thank you, dear — Grandpa would be so proud of you.",
    },
  ],
};
