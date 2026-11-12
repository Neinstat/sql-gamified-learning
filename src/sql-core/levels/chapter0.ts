import type { Chapter } from './types';

/**
 * Chapter 0 — First Day
 * SQL: what a table is, SELECT, FROM. Input: blocks.
 * Business skill: getting to know the menu and its prices.
 */
export const chapter0: Chapter = {
  id: 0,
  title: 'First Day',
  summary: "Grandma shows you around the café's records.",
  levels: [
    {
      id: 'ch0-1',
      title: 'The Menu Book',
      character: 'grandma',
      lesson: {
        title: 'Tables',
        body: [
          'A database keeps information in tables, like sheets in a spreadsheet: each row is one thing (one menu item), each column is one detail about it (name, price…).',
          'To look at a table, pick columns with SELECT and name the table with FROM. The star * means "every column". Every query ends with a semicolon ; — it tells the database "my query is finished".',
        ],
        example: 'SELECT * FROM table_name;',
      },
      dialogue: [
        "Oh, you're here! Welcome to the café, dear.",
        'Everything we sell is written down in our records — the menu lives in a table called menu_items.',
        "Why don't you take a look at the whole thing?",
      ],
      task: 'Show every column of every item in the menu_items table.',
      input: { kind: 'blocks', blocks: ['FROM', ';', 'menu_items', '*', 'SELECT'] },
      solution: 'SELECT * FROM menu_items;',
      hints: [
        'You want to see the whole menu_items table, with nothing left out.',
        'Start with SELECT, then * for "every column", then FROM and the table name.',
        'SELECT * FROM … — which table holds the menu?',
      ],
      success: "That's the whole menu! A bit messy, I know. We'll tidy it up together.",
    },
    {
      id: 'ch0-2',
      title: 'Just the Names',
      character: 'grandma',
      lesson: {
        title: 'Picking a column',
        body: [
          'Instead of *, you can write the name of the column you want.',
          'The result then has only that column — easier to read when you need just one detail.',
        ],
        example: 'SELECT column_name FROM table_name;',
      },
      dialogue: [
        "My eyes aren't what they used to be. All those columns make my head spin!",
        'Could you show me just the names of the things we sell?',
      ],
      task: 'List only the name of every menu item.',
      input: { kind: 'blocks', blocks: ['menu_items', 'name', ';', 'FROM', 'price', 'SELECT'] },
      solution: 'SELECT name FROM menu_items;',
      hints: [
        'Grandma only wants one column this time.',
        'Put the column name right after SELECT, instead of *.',
        'SELECT name FROM …;',
      ],
      success: "Much better! Espresso, Latte, Croissant… goodness, we sell a lot of things.",
    },
    {
      id: 'ch0-3',
      title: 'Names and Prices',
      character: 'grandma',
      lesson: {
        title: 'Several columns',
        body: [
          'To get more than one column, list them after SELECT, separated by commas.',
          'The columns appear in the result in the order you write them.',
        ],
        example: 'SELECT column_a, column_b FROM table_name;',
      },
      dialogue: [
        'A customer asked me about prices this morning and I had to guess. How embarrassing!',
        'Let me have each item with its price, so I can write a proper price list.',
      ],
      task: 'Show the name and the price of every menu item.',
      input: { kind: 'blocks', blocks: ['price', 'FROM', ',', 'SELECT', ';', 'menu_items', 'cost', 'name'] },
      solution: 'SELECT name, price FROM menu_items;',
      hints: [
        'This time you need two columns: one for the item, one for what it costs the customer.',
        'Write both column names after SELECT, with a comma between them.',
        'SELECT name, price FROM …;',
      ],
      success: 'A real price list! I can finally stop guessing.',
    },
    {
      id: 'ch0-4',
      title: 'Does It Pay?',
      character: 'grandma',
      lesson: {
        title: 'Price vs. cost',
        body: [
          'Every café has two numbers for each item: the price (what the customer pays) and the cost (what it takes us to make it).',
          'Comparing them shows which items actually earn money. Analysts look at both side by side all the time.',
        ],
      },
      dialogue: [
        'Some days the till is full, but the bank account stays empty. I never understood why.',
        'Show me each item with its price and what it costs us to make. Maybe the answer is in there.',
      ],
      task: 'Show the name, price, and cost of every menu item.',
      input: {
        kind: 'blocks',
        blocks: ['cost', 'menu_items', ',', 'SELECT', 'name', ';', 'FROM', 'price', ',', 'category'],
      },
      solution: 'SELECT name, price, cost FROM menu_items;',
      hints: [
        'You need three columns: the item, what the customer pays, and what it costs to make.',
        'List three columns after SELECT, with commas between them.',
        'SELECT name, price, cost FROM …;',
      ],
      success:
        "Look at that — Avocado Toast costs almost three dollars to make! And Banana Bread has no cost at all? We'll have to look into that.",
    },
  ],
};
