import type { Chapter } from './types';

/**
 * Chapter 1 — Cleaning Up the Menu
 * SQL: WHERE, comparison, text in quotes, AND, IN, LIKE, IS NULL. Input: fill in the blanks.
 * Business skill: filtering data and finding dirty / missing data.
 */
export const chapter1: Chapter = {
  id: 1,
  title: 'Cleaning Up the Menu',
  summary: 'Filter the menu and find what is missing.',
  levels: [
    {
      id: 'ch1-1',
      title: 'Cheap Treats',
      character: 'grandma',
      station: 'menu-board',
      lesson: {
        title: 'Filtering rows with WHERE',
        body: [
          'WHERE keeps only the rows that match a condition. It comes after FROM.',
          'Conditions compare a column with a value: < (less than), > (greater than), = (equal), <= and >=.',
        ],
        example: 'SELECT name FROM menu_items WHERE price > 5;',
      },
      dialogue: [
        'The school children come in every afternoon with a few coins in their pockets.',
        'Which items could they buy for less than three dollars?',
      ],
      task: 'Show the name and price of every item priced under $3.',
      input: {
        kind: 'fill-blank',
        template: 'SELECT name, price FROM menu_items WHERE ___ < 3;',
        answers: ['price'],
      },
      solution: 'SELECT name, price FROM menu_items WHERE price < 3;',
      hints: [
        'You are comparing one column with the number 3.',
        'Which column holds what the customer pays?',
        '… WHERE price < 3;',
      ],
      success: 'Espresso, Green Tea, Earl Grey… Hmm, maybe the children would like a cheap cookie too.',
      soWhat: {
        question: 'Grandma wants the children to buy more. What does this list tell her?',
        choices: [
          "Every item under $3 is a drink — there's no cheap snack for them",
          "The children don't like pastries",
          'The café should raise its prices',
        ],
        answer: 0,
        explanation:
          "Every item under $3 is a drink, so a cheap snack could be an opportunity. But this list can't tell us what the children like — for that we'd need sales data.",
      },
    },
    {
      id: 'ch1-2',
      title: 'Just Coffee',
      character: 'barista',
      station: 'menu-board',
      lesson: {
        title: 'Text needs quotes',
        body: [
          "Numbers are written as they are, but text values go inside single quotes: 'coffee'.",
          "Text must match exactly — 'Coffee' with a capital C is a different value.",
        ],
        example: "SELECT name FROM menu_items WHERE category = 'tea';",
      },
      dialogue: [
        "Hi! I'm the barista. I'm redoing the coffee board above the counter.",
        "Can you pull up every coffee drink with its price? The category is just called coffee.",
      ],
      task: 'Show the name and price of every item in the coffee category.',
      input: {
        kind: 'fill-blank',
        template: 'SELECT name, price FROM menu_items WHERE category = ___;',
        answers: ["'coffee'"],
      },
      solution: "SELECT name, price FROM menu_items WHERE category = 'coffee';",
      hints: [
        'Compare the category column with the word coffee.',
        'coffee is text, so it needs single quotes around it.',
        "… WHERE category = 'coffee';",
      ],
      success: "Perfect! Wait… Pumpkin Spice Latte is on here, but we stopped making it weeks ago.",
    },
    {
      id: 'ch1-3',
      title: 'On the Board Today',
      character: 'barista',
      station: 'menu-board',
      lesson: {
        title: 'Two conditions with AND',
        body: [
          'AND joins two conditions. A row is kept only if both are true.',
          'is_available is a TRUE/FALSE column: it says whether we can make the item today.',
        ],
        example: "SELECT name FROM menu_items WHERE category = 'tea' AND price < 4;",
      },
      dialogue: [
        "Let's leave out what we can't make right now.",
        'I only want coffee drinks that are available today.',
      ],
      task: 'Show the name of every coffee item that is available.',
      input: {
        kind: 'fill-blank',
        template: "SELECT name FROM menu_items WHERE category = 'coffee' ___ is_available = TRUE;",
        answers: ['AND'],
      },
      solution: "SELECT name FROM menu_items WHERE category = 'coffee' AND is_available = TRUE;",
      hints: [
        'Both conditions must be true at the same time.',
        'Which word joins two conditions so that both must hold?',
        "… WHERE category = 'coffee' AND is_available = TRUE;",
      ],
      success: 'Eight drinks. The board is ready — no more disappointed pumpkin fans!',
    },
    {
      id: 'ch1-4',
      title: 'Tea Time',
      character: 'grandma',
      station: 'menu-board',
      lesson: {
        title: 'One of several values: IN',
        body: [
          "To match any value from a list, use IN: category IN ('tea', 'dessert').",
          "It means the same as category = 'tea' OR category = 'dessert', but it is shorter.",
        ],
        example: "SELECT name FROM menu_items WHERE category IN ('pastry', 'sandwich');",
      },
      dialogue: [
        'Mrs. Hill from the book club wants to hold their meetings here on Thursdays!',
        "They like their tea with something sweet. Show me our teas and desserts, so I can plan a set.",
      ],
      task: 'Show the name and category of every item in the tea or dessert category.',
      input: {
        kind: 'fill-blank',
        template: "SELECT name, category FROM menu_items WHERE category ___ ('tea', 'dessert');",
        answers: ['IN'],
      },
      solution: "SELECT name, category FROM menu_items WHERE category IN ('tea', 'dessert');",
      hints: [
        'The category can be one of two values.',
        'Which word checks a value against a list in brackets?',
        "… WHERE category IN ('tea', 'dessert');",
      ],
      success: "Lovely. A pot of Earl Grey and a slice of Apple Pie — the book club will be very happy.",
    },
    {
      id: 'ch1-5',
      title: 'Chocolate Lover',
      character: 'regular',
      station: 'menu-board',
      lesson: {
        title: 'Searching text with LIKE',
        body: [
          "LIKE finds text that matches a pattern. % stands for \"any text\": '%cake%' matches anything containing cake.",
          'LIKE is case-sensitive: %Cake% and %cake% are different patterns.',
        ],
        example: "SELECT name FROM menu_items WHERE name LIKE '%Tea%';",
      },
      dialogue: [
        "Morning! I come here every day, you know. And I have a weakness: chocolate.",
        "Which of your items have chocolate in them? Don't just check the names — some hide it!",
      ],
      task: 'Show the name of every item whose description mentions chocolate.',
      input: {
        kind: 'fill-blank',
        template: 'SELECT name FROM menu_items WHERE ___ LIKE ___;',
        answers: ['description', "'%chocolate%'"],
      },
      solution: "SELECT name FROM menu_items WHERE description LIKE '%chocolate%';",
      hints: [
        'The names are not enough: search the column that describes each item.',
        "Use the description column, and a pattern with % on both sides of the word.",
        "… WHERE description LIKE '%chocolate%';",
      ],
      success: 'A Mocha! I never knew it had chocolate in it. You just made my week.',
    },
    {
      id: 'ch1-6',
      title: 'Missing Pieces',
      character: 'grandma',
      station: 'menu-board',
      lesson: {
        title: 'Empty values: IS NULL',
        body: [
          'NULL means "unknown" — nobody filled the value in. It is not zero and not empty text.',
          'You cannot find it with = NULL. Use IS NULL instead (and IS NOT NULL for the opposite).',
        ],
        example: 'SELECT name FROM menu_items WHERE description IS NULL;',
      },
      dialogue: [
        'Remember Banana Bread, with no cost written down? It got me worried.',
        'If a price or a cost is missing, my numbers are wrong. Find every item with a missing price or a missing cost.',
      ],
      task: 'Show the name, price, and cost of every item whose price or cost is missing.',
      input: {
        kind: 'fill-blank',
        template: 'SELECT name, price, cost FROM menu_items WHERE price ___ OR cost ___;',
        answers: ['IS NULL', 'IS NULL'],
      },
      solution: 'SELECT name, price, cost FROM menu_items WHERE price IS NULL OR cost IS NULL;',
      hints: [
        'Missing values are NULL. Either column may be the empty one.',
        '= NULL never matches anything. There is a special way to test for NULL.',
        '… WHERE price IS NULL OR cost IS NULL;',
      ],
      success:
        "Hot Chocolate with no price, and Banana Bread with no cost. No wonder my sums never added up! I'll ask the supplier tomorrow.",
    },
    {
      id: 'ch1-7',
      kind: 'case',
      title: 'The Menu Audit',
      character: 'grandma',
      station: 'menu-board',
      lesson: {
        title: 'Mini Case: think like an analyst',
        body: [
          'A Mini Case has no single right query. Run as many queries as you like to investigate.',
          'When a result shows something important, pin it 📌 to your notes.',
          'Then answer the questions. Every answer needs a pinned result as proof — analysts back every conclusion with data.',
        ],
      },
      dialogue: [
        'The printer comes tomorrow to print our new menu cards.',
        'Before that, I want to be sure the menu is right. Can you audit it for me?',
        'Look around the data, pin what you find, and tell me what you think.',
      ],
      task: 'Audit the menu before it goes to the printer: investigate, pin your evidence 📌, and answer the questions.',
      starters: [
        'SELECT name, category, price, cost FROM menu_items;',
        'SELECT name, category, price, cost FROM menu_items WHERE ___ IS NULL;',
      ],
      questions: [
        {
          prompt: 'How many menu items have a missing price, cost, or category?',
          answer: { kind: 'number', value: 4 },
          evidence: {
            sql: 'SELECT name FROM menu_items WHERE price IS NULL OR cost IS NULL OR category IS NULL;',
            exact: true,
          },
        },
        {
          prompt: "Which item can't be rung up at the till at all?",
          answer: { kind: 'choice', choices: ['Banana Bread', 'Hot Chocolate', 'Lemonade'], correct: 1 },
          evidence: { sql: 'SELECT name, price FROM menu_items WHERE price IS NULL;' },
        },
        {
          prompt: 'The menu goes to the printer tomorrow. What should we fix first?',
          answer: {
            kind: 'choice',
            choices: [
              "Add Hot Chocolate's price — we can't sell it without one",
              'Fix the spelling of "Iced Capuccino"',
              "Take the items that aren't available off the list",
            ],
            correct: 0,
          },
          evidence: { sql: 'SELECT name, price FROM menu_items WHERE price IS NULL;' },
        },
      ],
      hints: [
        'Missing data shows up as NULL. Start by looking at every item with its category, price, and cost.',
        'Use WHERE … IS NULL, and join several conditions with OR to catch all the gaps at once.',
        'SELECT name, category, price, cost FROM menu_items WHERE category IS NULL OR price IS NULL OR cost IS NULL;',
      ],
      success:
        "Four gaps — and Hot Chocolate with no price at all! You think like a real analyst, dear. I'll ask the printer to wait one more day.",
    },
  ],
};
