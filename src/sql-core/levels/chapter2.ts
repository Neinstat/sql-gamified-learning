import type { Chapter } from './types';

/**
 * Chapter 2 — First Reports
 * SQL: ORDER BY, LIMIT, DISTINCT, calculated columns, AS (aliases), NULLs when sorting.
 * Input: free typing. Business skill: top-N lists and margin = price − cost.
 */
export const chapter2: Chapter = {
  id: 2,
  title: 'First Reports',
  summary: 'Sort, trim and calculate: your first real reports.',
  levels: [
    {
      id: 'ch2-1',
      title: 'The Sandwich Board',
      character: 'barista',
      station: 'menu-board',
      lesson: {
        title: 'Your own query, and ORDER BY',
        body: [
          'From now on you type the whole query yourself. Autocomplete helps with table and column names.',
          'ORDER BY sorts the rows by a column. ASC (the default) goes from small to big; DESC goes from big to small.',
        ],
        example: 'SELECT name, price FROM menu_items ORDER BY price DESC;',
      },
      dialogue: [
        "Lunch is getting busy, so I'm making a sandwich board for the window.",
        'Can you list our sandwiches with their prices, the most expensive at the top?',
      ],
      task: 'Show the name and price of every sandwich, most expensive first.',
      input: { kind: 'free', starter: "SELECT name, price\nFROM menu_items\nWHERE category = 'sandwich'\n" },
      solution: "SELECT name, price FROM menu_items WHERE category = 'sandwich' ORDER BY price DESC;",
      hints: [
        'The rows are right already — they just need sorting.',
        'Add ORDER BY after the WHERE line. Which way: small to big, or big to small?',
        "… WHERE category = 'sandwich' ORDER BY price DESC;",
      ],
      success: 'Avocado Toast on top, like a headline. People will read this from across the street!',
    },
    {
      id: 'ch2-2',
      title: 'Dessert Sampler',
      character: 'grandma',
      station: 'menu-board',
      lesson: {
        title: 'Top lists with LIMIT',
        body: [
          'LIMIT n keeps only the first n rows. It always comes last, after ORDER BY.',
          'ORDER BY + LIMIT is how analysts make a "top 5" or "bottom 3" list.',
        ],
        example: 'SELECT name, price FROM menu_items ORDER BY price LIMIT 5;',
      },
      dialogue: [
        "I'd like to try a little dessert sampler plate on Sundays.",
        'Find me our three cheapest desserts — those are the ones I can afford to give in small pieces.',
      ],
      task: 'Show the name and price of the 3 cheapest desserts, cheapest first.',
      input: { kind: 'free' },
      solution: "SELECT name, price FROM menu_items WHERE category = 'dessert' ORDER BY price LIMIT 3;",
      hints: [
        'First keep only the desserts, then sort them, then keep the first three.',
        'The order of the clauses is WHERE → ORDER BY → LIMIT.',
        "SELECT name, price FROM menu_items WHERE category = 'dessert' ORDER BY price LIMIT 3;",
      ],
      success: 'Brownie, Apple Pie and Cheesecake. A sampler like that will make people come back for a whole slice.',
    },
    {
      id: 'ch2-3',
      title: 'For the Newsletter',
      character: 'regular',
      station: 'menu-board',
      lesson: {
        title: 'Each value once: DISTINCT',
        body: [
          'SELECT DISTINCT removes duplicate rows, so each value shows up only once.',
          'It answers the question "which different values are there?"',
        ],
        example: 'SELECT DISTINCT is_available FROM menu_items;',
      },
      dialogue: [
        "I'm writing about this café for the valley newsletter. Best coffee in the valley, of course.",
        'What kinds of things do you sell? Just the categories, each one once.',
      ],
      task: 'Show every category on the menu, each one only once.',
      input: { kind: 'free' },
      solution: 'SELECT DISTINCT category FROM menu_items;',
      hints: [
        'You only need one column, but without repeats.',
        'One word after SELECT removes the duplicates.',
        'SELECT DISTINCT category FROM …;',
      ],
      success: 'Coffee, tea, pastries, sandwiches, desserts… and an empty one? I will leave that out of the article.',
      soWhat: {
        question: 'One of the categories came out as NULL. What does that tell you?',
        choices: [
          'Some items were never given a category — the data needs cleaning',
          'There is a secret category called NULL',
          'Those items are sold out',
        ],
        answer: 0,
        explanation:
          'NULL means nobody filled in a category (Iced Tea and Lemonade, remember?). Reports that group by category will have a mystery row until someone fixes the data.',
      },
    },
    {
      id: 'ch2-4',
      title: 'What We Keep',
      character: 'grandma',
      station: 'menu-board',
      lesson: {
        title: 'Calculating columns, and naming them with AS',
        body: [
          'You can calculate in SELECT: price - cost works out the margin for every row.',
          'AS gives the new column a name. Without it, PostgreSQL calls the column ?column?.',
        ],
        example: 'SELECT name, price * 2 AS double_price FROM menu_items;',
      },
      dialogue: [
        'Price is what the customer pays. Cost is what it takes us to make it.',
        'What we keep from each sale is the margin: price minus cost. Can you work it out for every item?',
        'And please call that column margin, so my accountant understands it.',
      ],
      task: 'Show the name and the margin (price − cost) of every item, with the margin column named margin.',
      input: { kind: 'free' },
      solution: 'SELECT name, price - cost AS margin FROM menu_items;',
      check: { checkColumnNames: true },
      hints: [
        'The second column is a calculation, not a column from the table.',
        'Subtract cost from price, then give the result a name with AS.',
        'SELECT name, price - cost AS margin FROM …;',
      ],
      success: 'So a Latte keeps us $2.80, but an Espresso only $1.90. And two items show nothing at all — the missing data again.',
      soWhat: {
        question: 'Avocado Toast keeps $4.45 per sale and an Espresso $1.90. Does Avocado Toast make Grandma more money overall?',
        choices: [
          'Not necessarily — it depends on how many of each are sold',
          'Yes — a bigger margin always means more money',
          'No — cheap items always earn more in total',
        ],
        answer: 0,
        explanation:
          "Total profit is margin × how many were sold. If we sell ten espressos for every avocado toast, the espressos win. To know, we need sales data — that's Chapter 3.",
      },
    },
    {
      id: 'ch2-5',
      title: 'Top Earners',
      character: 'barista',
      station: 'menu-board',
      lesson: {
        title: 'Sorting by a calculation — and where NULLs go',
        body: [
          'You can sort by an alias: ORDER BY margin DESC.',
          'Watch out: when sorting DESC, PostgreSQL puts NULL values first. Leave them out with IS NOT NULL (or write NULLS LAST).',
        ],
        example: 'SELECT name, cost FROM menu_items WHERE cost IS NOT NULL ORDER BY cost DESC;',
      },
      dialogue: [
        "Grandma showed me your margin list. I'd love to know which items really pay the bills.",
        'Give me our top five earners per sale. Leave out anything with a missing price or cost — those numbers lie.',
      ],
      task: 'Show the name and margin of the 5 items with the biggest margin, biggest first, leaving out items with a missing price or cost.',
      input: { kind: 'free' },
      solution:
        'SELECT name, price - cost AS margin FROM menu_items WHERE price IS NOT NULL AND cost IS NOT NULL ORDER BY margin DESC LIMIT 5;',
      hints: [
        'Calculate the margin, sort it from big to small, keep five — and keep the empty prices and costs out.',
        'If Hot Chocolate or Banana Bread appear at the top, their NULL margin was sorted first. Filter them out with WHERE.',
        '… WHERE price IS NOT NULL AND cost IS NOT NULL ORDER BY margin DESC LIMIT 5;',
      ],
      success: 'Sandwiches on top, then the Secret Cake. Hmm, we stopped making that one… that gives me an idea.',
    },
    {
      id: 'ch2-6',
      kind: 'case',
      title: 'What Should We Promote?',
      character: 'barista',
      station: 'menu-board',
      dialogue: [
        'Grandma says I can feature one drink on the big chalkboard next week.',
        "I want to pick one that actually earns us money — not just the one I like making.",
        'Can you dig into the menu, pin your proof, and tell me what you find?',
      ],
      task: 'Find out which items earn the most, then choose the drink to feature. Pin your evidence 📌 for each answer.',
      starters: ['SELECT name, category, price, cost, is_available FROM menu_items;'],
      questions: [
        {
          prompt: 'Which item on the whole menu earns the most per sale?',
          answer: { kind: 'choice', choices: ['Avocado Toast', "Grandma's Secret Cake", 'Cheesecake'], correct: 0 },
          evidence: { sql: "SELECT name, price - cost AS margin FROM menu_items WHERE name = 'Avocado Toast';", maxRows: 10 },
        },
        {
          prompt: 'How many items earn more than $3.50 per sale?',
          answer: { kind: 'number', value: 5 },
          evidence: { sql: 'SELECT name FROM menu_items WHERE price - cost > 3.5;', exact: true },
        },
        {
          prompt: 'Which drink should go on the chalkboard?',
          answer: { kind: 'choice', choices: ['Pumpkin Spice Latte', 'Caramel Macchiato', 'Espresso'], correct: 1 },
          evidence: {
            sql: "SELECT name, price - cost AS margin, is_available FROM menu_items WHERE name IN ('Pumpkin Spice Latte', 'Caramel Macchiato');",
            maxRows: 16,
          },
        },
      ],
      hints: [
        'Work out the margin (price − cost AS margin) and sort it. For the drinks, look at coffee and tea only.',
        "An item that earns a lot is no use if we can't sell it. Which column tells you that?",
        "SELECT name, price - cost AS margin, is_available FROM menu_items WHERE category IN ('coffee', 'tea') ORDER BY margin DESC;",
      ],
      success:
        "Caramel Macchiato it is! The Pumpkin Spice Latte earns a bit more, but it's not even on sale. Good catch — I'd have picked it.",
    },
  ],
};
