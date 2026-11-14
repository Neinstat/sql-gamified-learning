import type { Chapter } from './types';

/**
 * Chapter 4 — Connecting the Dots (kitchen and cash register)
 * SQL: INNER JOIN … ON, table aliases, LEFT JOIN + IS NULL, JOIN with GROUP BY.
 * Input: free typing. Business skill: sales per category, customers who never came back.
 */
export const chapter4: Chapter = {
  id: 4,
  title: 'Connecting the Dots',
  summary: 'The kitchen is open! Join tables together to see the whole picture.',
  levels: [
    {
      id: 'ch4-1',
      title: 'Where the Milk Goes',
      character: 'grandma',
      station: 'recipe-book',
      lesson: {
        title: 'Joining two tables: JOIN … ON',
        body: [
          'recipes only knows item numbers; the names are in menu_items. JOIN puts the two side by side.',
          'ON says which rows belong together: r.item_id = m.item_id. The short names r and m are aliases for the tables.',
        ],
        example: 'SELECT m.name, r.ingredient FROM recipes r JOIN menu_items m ON m.item_id = r.item_id;',
      },
      dialogue: [
        "Welcome to my kitchen, dear! Mind the stove. That's Grandma's recipe book on the stand.",
        'We go through so much milk. Which menu items use milk, and how much does each one take?',
      ],
      task: 'Show the name of every menu item that uses milk, with the amount of milk it takes.',
      input: { kind: 'free', starter: 'SELECT m.name, r.amount\nFROM recipes r\nJOIN menu_items m ON …\n' },
      solution:
        "SELECT m.name, r.amount FROM recipes r JOIN menu_items m ON m.item_id = r.item_id WHERE r.ingredient = 'milk';",
      hints: [
        'Join recipes to menu_items on the item number, then keep only the milk rows.',
        "ON m.item_id = r.item_id, then WHERE r.ingredient = 'milk'.",
        "SELECT m.name, r.amount FROM recipes r JOIN menu_items m ON m.item_id = r.item_id WHERE r.ingredient = 'milk';",
      ],
      success: 'Ten drinks with milk! No wonder the milkman comes every morning.',
    },
    {
      id: 'ch4-2',
      title: 'The Missing Recipe',
      character: 'barista',
      station: 'recipe-book',
      lesson: {
        title: 'Keeping rows without a match: LEFT JOIN',
        body: [
          'JOIN only keeps rows that match on both sides. LEFT JOIN keeps every row of the first table, even with no match.',
          'Where nothing matched, the columns of the second table are NULL — so WHERE … IS NULL finds what is missing.',
        ],
        example: 'SELECT m.name, r.ingredient FROM menu_items m LEFT JOIN recipes r ON r.item_id = m.item_id;',
      },
      dialogue: [
        "I'm writing a training sheet for new staff, straight from the recipe book.",
        'But I think one item on the menu has no recipe at all. Can you find which?',
      ],
      task: 'Show the name of every menu item that has no recipe in the recipes table.',
      input: { kind: 'free' },
      solution:
        'SELECT m.name FROM menu_items m LEFT JOIN recipes r ON r.item_id = m.item_id WHERE r.recipe_id IS NULL;',
      hints: [
        'Start from menu_items so every item stays, then look for items where no recipe matched.',
        'LEFT JOIN recipes, then WHERE r.recipe_id IS NULL.',
        'SELECT m.name FROM menu_items m LEFT JOIN recipes r ON r.item_id = m.item_id WHERE r.recipe_id IS NULL;',
      ],
      success: "Grandma's Secret Cake! Of course — she never wrote it down. It's in her head only.",
    },
    {
      id: 'ch4-3',
      title: 'Sales by Category',
      character: 'barista',
      station: 'cash-register',
      lesson: {
        title: 'JOIN, then GROUP BY',
        body: [
          'sales knows what was sold, menu_items knows its category. Join them first, then group.',
          'Write the columns with their alias (s.quantity, m.category) so it is clear which table they come from.',
        ],
        example: 'SELECT m.name, COUNT(*) FROM sales s JOIN menu_items m ON m.item_id = s.item_id GROUP BY m.name;',
      },
      dialogue: [
        "Coffee, pastries, sandwiches… I want to plan the ordering by category.",
        'How many units did we sell in each category? Biggest first, please.',
      ],
      task: 'Show each category with the total units sold (sum of quantity, named units), biggest first.',
      input: { kind: 'free' },
      solution:
        'SELECT m.category, SUM(s.quantity) AS units FROM sales s JOIN menu_items m ON m.item_id = s.item_id GROUP BY m.category ORDER BY units DESC;',
      hints: [
        'Join sales to menu_items, group by the category, and add up the quantity.',
        'GROUP BY m.category, SUM(s.quantity) AS units, ORDER BY units DESC.',
        'SELECT m.category, SUM(s.quantity) AS units FROM sales s JOIN menu_items m ON m.item_id = s.item_id GROUP BY m.category ORDER BY units DESC;',
      ],
      success: 'Coffee is miles ahead. And that NULL row again — Lemonade and Iced Tea still need a category!',
    },
    {
      id: 'ch4-4',
      title: 'The Money Makers',
      character: 'grandma',
      station: 'cash-register',
      dialogue: [
        'Now I want names, not numbers. Which items bring in the most money?',
        'Show me the top five by revenue.',
      ],
      task: 'Show the name and revenue (named revenue) of the 5 items with the highest revenue, highest first.',
      input: { kind: 'free' },
      solution:
        'SELECT m.name, SUM(s.quantity * s.unit_price) AS revenue FROM sales s JOIN menu_items m ON m.item_id = s.item_id GROUP BY m.name ORDER BY revenue DESC LIMIT 5;',
      hints: [
        'Join sales to menu_items, add up the revenue per item name, sort it and keep five.',
        'GROUP BY m.name, ORDER BY revenue DESC, LIMIT 5.',
        'SELECT m.name, SUM(s.quantity * s.unit_price) AS revenue FROM sales s JOIN menu_items m ON m.item_id = s.item_id GROUP BY m.name ORDER BY revenue DESC LIMIT 5;',
      ],
      success: 'The Latte, ahead of everything. My old Latte, the heart of this café.',
      soWhat: {
        question: 'Avocado Toast earns the most per sale (Chapter 2), yet the Latte brings in far more money. Why?',
        choices: [
          'The Latte sells many more times',
          'The Latte is more expensive',
          'The Avocado Toast data is missing',
        ],
        answer: 0,
        explanation:
          'Revenue is price × units sold. About 700 lattes against about 220 avocado toasts: volume wins. That is why losing Latte sales would hurt more than anything else.',
      },
    },
    {
      id: 'ch4-5',
      title: 'Most Loyal',
      character: 'regular',
      station: 'cash-register',
      dialogue: [
        "Grandma says the till knows its customers by name now. Ha! Then you'll find me at the top.",
        'Who has placed the most orders? Just the one name, with their number of orders.',
      ],
      task: 'Show the name and number of orders (named orders) of the customer with the most orders.',
      input: { kind: 'free' },
      solution:
        'SELECT c.name, COUNT(DISTINCT s.order_id) AS orders FROM sales s JOIN customers c ON c.customer_id = s.customer_id GROUP BY c.name ORDER BY orders DESC LIMIT 1;',
      hints: [
        'Join sales to customers, count each order once per customer, sort and keep the top one.',
        'COUNT(DISTINCT s.order_id) per c.name, ORDER BY orders DESC LIMIT 1.',
        'SELECT c.name, COUNT(DISTINCT s.order_id) AS orders FROM sales s JOIN customers c ON c.customer_id = s.customer_id GROUP BY c.name ORDER BY orders DESC LIMIT 1;',
      ],
      success: "Tara Ross? Thirty-eight orders! Well. I'll have to come in more often.",
    },
    {
      id: 'ch4-6',
      title: 'Signed Up, Never Came',
      character: 'grandma',
      station: 'cash-register',
      dialogue: [
        'Some people filled in the loyalty card at the counter… and then we never saw them again.',
        'Which customers have never ordered anything at all?',
      ],
      task: 'Show the name of every customer who has no sales at all.',
      input: { kind: 'free' },
      solution: 'SELECT c.name FROM customers c LEFT JOIN sales s ON s.customer_id = c.customer_id WHERE s.sale_id IS NULL;',
      hints: [
        'Start from customers, keep them all, and look for the ones with no matching sale.',
        'LEFT JOIN sales, then WHERE s.sale_id IS NULL.',
        'SELECT c.name FROM customers c LEFT JOIN sales s ON s.customer_id = c.customer_id WHERE s.sale_id IS NULL;',
      ],
      success: "Five names. I'll send each of them a card with a free cookie. Maybe they just need a reason.",
    },
    {
      id: 'ch4-7',
      kind: 'case',
      title: 'Where Did the Regulars Go?',
      character: 'regular',
      station: 'cash-register',
      dialogue: [
        'You know, some of my old café friends stopped coming. I used to see them every week.',
        'Lily, Noah… I miss our afternoon chats. Did something happen?',
        "You have the till's memory. Find out who stopped coming, and why — and show me the proof.",
      ],
      task: 'Find the regulars who stopped coming and what they used to order. Pin your evidence 📌 for each answer.',
      starters: [
        'SELECT customer_id, COUNT(DISTINCT order_id) AS orders, MAX(sold_at) AS last_visit FROM sales WHERE customer_id IS NOT NULL GROUP BY customer_id ORDER BY last_visit;',
      ],
      questions: [
        {
          prompt: 'How many regulars (10 or more orders) have not been back since the end of August?',
          answer: { kind: 'number', value: 4 },
          evidence: {
            sql: "SELECT c.name FROM customers c JOIN sales s ON s.customer_id = c.customer_id GROUP BY c.name HAVING COUNT(DISTINCT s.order_id) >= 10 AND MAX(s.sold_at) < '2026-09-01';",
            exact: true,
          },
        },
        {
          prompt: 'What did they order most?',
          answer: { kind: 'choice', choices: ['Latte', "Grandma's Secret Cake", 'Cappuccino'], correct: 1 },
          evidence: {
            sql: "SELECT m.name, SUM(s.quantity) AS units FROM sales s JOIN menu_items m ON m.item_id = s.item_id WHERE s.customer_id IN (3, 7, 11, 14) AND m.name = 'Grandma''s Secret Cake' GROUP BY m.name;",
            maxRows: 20,
          },
        },
        {
          prompt: 'What is the best way to win them back?',
          answer: {
            kind: 'choice',
            choices: [
              "Bring back Grandma's Secret Cake, even as a weekend special",
              'Send them a discount on lattes',
              'Nothing — regulars always drift away in the end',
            ],
            correct: 0,
          },
          evidence: {
            sql: "SELECT name, is_available FROM menu_items WHERE name = 'Grandma''s Secret Cake';",
            maxRows: 10,
          },
        },
      ],
      hints: [
        'First find the customers with many orders whose last visit was in August. Then look at what those customers bought.',
        'Join customers and sales, GROUP BY the customer, and use HAVING with COUNT(DISTINCT order_id) and MAX(sold_at).',
        "SELECT m.name, SUM(s.quantity) AS units FROM sales s JOIN menu_items m ON m.item_id = s.item_id WHERE s.customer_id IN (3, 7, 11, 14) GROUP BY m.name ORDER BY units DESC;",
      ],
      success:
        "The Secret Cake! They came for Grandma's cake, and when it went off the menu, they went too. I'm telling her right now.",
    },
  ],
};
