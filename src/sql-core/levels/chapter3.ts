import type { Chapter } from './types';

/**
 * Chapter 3 — Numbers Talk (at the cash register)
 * SQL: COUNT, SUM, COUNT(DISTINCT), ROUND, GROUP BY, DATE_TRUNC, HAVING, EXTRACT(DOW).
 * Input: free typing. Business skill: KPIs — revenue, number of orders, average order value.
 */
export const chapter3: Chapter = {
  id: 3,
  title: 'Numbers Talk',
  summary: "Turn the till's records into the numbers every café owner asks for.",
  levels: [
    {
      id: 'ch3-1',
      title: 'The Delivery App',
      character: 'barista',
      station: 'cash-register',
      lesson: {
        title: 'Counting rows: COUNT(*)',
        body: [
          'The sales table has one row per item sold. COUNT(*) counts rows and returns a single number.',
          'COUNT(*) works together with WHERE: first the rows are filtered, then the ones left are counted.',
        ],
        example: "SELECT COUNT(*) FROM sales WHERE channel = 'takeaway';",
      },
      dialogue: [
        'The delivery app keeps pinging all day. Grandma thinks it barely matters.',
        'How many sales lines came in through delivery? The channel is called delivery.',
      ],
      task: 'Count the rows in sales whose channel is delivery.',
      input: { kind: 'free' },
      solution: "SELECT COUNT(*) FROM sales WHERE channel = 'delivery';",
      hints: [
        'You want one number: how many rows match.',
        "Filter with WHERE channel = 'delivery', and count with COUNT(*).",
        "SELECT COUNT(*) FROM sales WHERE channel = 'delivery';",
      ],
      success: "Almost a thousand! That's not nothing. I'll show Grandma.",
    },
    {
      id: 'ch3-2',
      title: 'All the Money',
      character: 'grandma',
      station: 'cash-register',
      lesson: {
        title: 'Adding up: SUM',
        body: [
          'SUM adds up a column over all the rows. You can sum a calculation too.',
          'Revenue is what customers paid: quantity × unit_price, added up over every sale.',
        ],
        example: 'SELECT SUM(quantity) AS items_sold FROM sales;',
      },
      dialogue: [
        "Here's the till, dear. Three months of sales, August to October.",
        'How much money came in altogether? Call it revenue.',
      ],
      task: 'Show the total revenue (the sum of quantity × unit_price over all sales), named revenue.',
      input: { kind: 'free' },
      solution: 'SELECT SUM(quantity * unit_price) AS revenue FROM sales;',
      hints: [
        'Each row earned quantity × unit_price. Add that up over every row.',
        'Put the calculation inside SUM( … ) and name the result with AS.',
        'SELECT SUM(quantity * unit_price) AS revenue FROM sales;',
      ],
      success: 'Over thirty thousand dollars! Grandpa would never have believed it.',
    },
    {
      id: 'ch3-3',
      title: 'The Average Order',
      character: 'grandma',
      station: 'cash-register',
      lesson: {
        title: 'Counting each order once: COUNT(DISTINCT), and ROUND',
        body: [
          'One order can have several rows (a latte and a croissant). COUNT(DISTINCT order_id) counts each order once.',
          'Average order value = revenue ÷ number of orders. ROUND(x, 2) keeps two decimals, like money.',
        ],
        example: 'SELECT COUNT(DISTINCT customer_id) AS customers FROM sales;',
      },
      dialogue: [
        'My accountant asks two things every time: how many orders, and how much a customer spends per order.',
        'Can you give me both? The second one rounded to cents, please.',
      ],
      task: 'Show the number of orders (orders) and the average order value (revenue ÷ orders, rounded to 2 decimals, avg_order_value).',
      input: { kind: 'free' },
      solution:
        'SELECT COUNT(DISTINCT order_id) AS orders, ROUND(SUM(quantity * unit_price) / COUNT(DISTINCT order_id), 2) AS avg_order_value FROM sales;',
      hints: [
        'Orders: count each order_id once. Average order value: total revenue divided by that count.',
        'COUNT(DISTINCT order_id) for orders; ROUND( SUM(…) / COUNT(DISTINCT order_id), 2 ) for the average.',
        'SELECT COUNT(DISTINCT order_id) AS orders, ROUND(SUM(quantity * unit_price) / COUNT(DISTINCT order_id), 2) AS avg_order_value FROM sales;',
      ],
      success: 'About six seventy-five per order. Now I can answer my accountant without stammering!',
      soWhat: {
        question: 'Why not just use AVG(quantity * unit_price) for the average order value?',
        choices: [
          'It averages the rows (single items), not whole orders — so it comes out too low',
          'AVG only works on whole numbers',
          'It gives exactly the same answer, just slower',
        ],
        answer: 0,
        explanation:
          'Each row is one item, so AVG gives about $4.02 per item. An order often has two or three items, so the real average order is about $6.76. Always ask: an average of what?',
      },
    },
    {
      id: 'ch3-4',
      title: 'Where the Money Comes From',
      character: 'barista',
      station: 'cash-register',
      lesson: {
        title: 'One number per group: GROUP BY',
        body: [
          'GROUP BY puts rows with the same value together; SUM and COUNT then work per group.',
          'Every column in SELECT must be either in GROUP BY or inside SUM, COUNT, AVG, MIN or MAX.',
        ],
        example: 'SELECT channel, COUNT(*) AS lines FROM sales GROUP BY channel;',
      },
      dialogue: [
        'Dine-in, takeaway, delivery… I want to know which one really pays.',
        'Revenue for each channel, the biggest first?',
      ],
      task: 'Show each channel with its revenue (named revenue), biggest revenue first.',
      input: { kind: 'free' },
      solution:
        'SELECT channel, SUM(quantity * unit_price) AS revenue FROM sales GROUP BY channel ORDER BY revenue DESC;',
      hints: [
        'One row per channel, with the revenue added up inside each channel.',
        'GROUP BY channel, then ORDER BY revenue DESC at the end.',
        'SELECT channel, SUM(quantity * unit_price) AS revenue FROM sales GROUP BY channel ORDER BY revenue DESC;',
      ],
      success: "Dine-in is more than half of everything. People still like sitting with Grandma's coffee.",
    },
    {
      id: 'ch3-5',
      title: 'Month by Month',
      character: 'grandma',
      station: 'cash-register',
      lesson: {
        title: 'Dates: DATE_TRUNC',
        body: [
          "DATE_TRUNC('month', sold_at) cuts a date and time down to the first moment of its month.",
          'Group by it to get one row per month — the start of every trend report.',
        ],
        example: "SELECT DATE_TRUNC('day', sold_at) AS day, COUNT(*) FROM sales GROUP BY day ORDER BY day;",
      },
      dialogue: [
        'Something has been bothering me. The till felt lighter lately.',
        "Show me the revenue for each month, in order. Use DATE_TRUNC('month', sold_at) for the month.",
      ],
      task: "Show each month (DATE_TRUNC('month', sold_at), named month) with its revenue (named revenue), in date order.",
      input: { kind: 'free' },
      solution:
        "SELECT DATE_TRUNC('month', sold_at) AS month, SUM(quantity * unit_price) AS revenue FROM sales GROUP BY month ORDER BY month;",
      hints: [
        'Group the sales by month, add up the revenue in each, and sort by the month.',
        "GROUP BY DATE_TRUNC('month', sold_at) — or by its alias month — then ORDER BY month.",
        "SELECT DATE_TRUNC('month', sold_at) AS month, SUM(quantity * unit_price) AS revenue FROM sales GROUP BY month ORDER BY month;",
      ],
      success: 'August, September… and October is the lowest of all. I knew it. Something happened in October.',
      soWhat: {
        question: 'October came in well below September. What should Grandma do first?',
        choices: [
          'Find out where the drop came from — which items, days, hours',
          'Lower all prices to bring customers back',
          'Wait for November: it will probably fix itself',
        ],
        answer: 0,
        explanation:
          "A total only tells you that something changed, not what. Analysts drill down — by item, day, hour, channel — before acting. You'll get your chance in Chapter 5.",
      },
    },
    {
      id: 'ch3-6',
      title: 'The Big Sellers',
      character: 'barista',
      station: 'cash-register',
      lesson: {
        title: 'Filtering groups: HAVING',
        body: [
          'WHERE filters rows before grouping. HAVING filters the groups after, using SUM, COUNT and friends.',
          'Careful with the edge: > 400 means more than 400, so exactly 400 is left out. >= 400 would keep it.',
        ],
        example: 'SELECT channel, COUNT(*) FROM sales GROUP BY channel HAVING COUNT(*) > 1000;',
      },
      dialogue: [
        'I order milk and beans by how much we sell. The till only knows items by number.',
        'Which item numbers sold more than 400 units in total? Those I must never run out of.',
      ],
      task: 'Show the item_id and total units sold (sum of quantity, named units) of every item that sold more than 400 units.',
      input: { kind: 'free' },
      solution: 'SELECT item_id, SUM(quantity) AS units FROM sales GROUP BY item_id HAVING SUM(quantity) > 400;',
      hints: [
        'Add up quantity per item_id, then keep only the groups above 400.',
        'You cannot use SUM in WHERE. Filter the groups with HAVING SUM(quantity) > 400.',
        'SELECT item_id, SUM(quantity) AS units FROM sales GROUP BY item_id HAVING SUM(quantity) > 400;',
      ],
      success: 'Items 1 to 4 — espresso, americano, cappuccino and latte. Coffee keeps this place alive. And item 6 just missed it!',
    },
    {
      id: 'ch3-7',
      kind: 'case',
      title: 'The Quiet Day',
      character: 'grandma',
      station: 'cash-register',
      lesson: {
        title: 'Mini Case tip: the day of the week',
        body: [
          'EXTRACT(DOW FROM sold_at) gives the day of the week as a number: 0 = Sunday, 1 = Monday … 6 = Saturday.',
          'Group by it to compare weekdays. Remember the KPIs: revenue, number of orders, average order value.',
        ],
        example: 'SELECT EXTRACT(DOW FROM sold_at) AS weekday, COUNT(*) FROM sales GROUP BY weekday;',
      },
      dialogue: [
        'Some days the café feels so empty I can hear the clock ticking.',
        'Is it my imagination, or is one day of the week really quieter? And if so — why?',
        'Dig through the till, pin your proof, and tell me what you think we should do.',
      ],
      task: 'Find the quiet day of the week and why it is quiet. Pin your evidence 📌 for each answer.',
      starters: ['SELECT EXTRACT(DOW FROM sold_at) AS weekday, COUNT(*) AS lines FROM sales GROUP BY weekday ORDER BY weekday;'],
      questions: [
        {
          prompt: 'Which day of the week brings in the least revenue?',
          answer: { kind: 'choice', choices: ['Monday', 'Tuesday', 'Sunday'], correct: 1 },
          evidence: {
            sql: 'SELECT SUM(quantity * unit_price) AS revenue FROM sales WHERE EXTRACT(DOW FROM sold_at) = 2;',
            maxRows: 7,
          },
        },
        {
          prompt: 'Why is that day quiet?',
          answer: {
            kind: 'choice',
            choices: [
              'Fewer orders — but each order is about the usual size',
              'Smaller orders — the same number of people spend less',
              'Both fewer and smaller orders',
            ],
            correct: 0,
          },
          evidence: {
            sql: 'SELECT COUNT(DISTINCT order_id) AS orders FROM sales WHERE EXTRACT(DOW FROM sold_at) = 2;',
            maxRows: 7,
          },
        },
        {
          prompt: "The Regular says Tuesday is market day — the whole valley is at the market. What's the best idea?",
          answer: {
            kind: 'choice',
            choices: [
              'A market-day takeaway deal for people on their way to the market',
              'Raise prices on Tuesdays to make up the difference',
              'Close the café on Tuesdays',
            ],
            correct: 0,
          },
          evidence: {
            sql: 'SELECT COUNT(DISTINCT order_id) AS orders FROM sales WHERE EXTRACT(DOW FROM sold_at) = 2;',
            maxRows: 7,
          },
        },
      ],
      hints: [
        'Group by the day of the week and compare revenue. Then compare the number of orders and the average order.',
        'COUNT(DISTINCT order_id) gives the orders per day; revenue ÷ orders gives the average order value.',
        'SELECT EXTRACT(DOW FROM sold_at) AS weekday, SUM(quantity * unit_price) AS revenue, COUNT(DISTINCT order_id) AS orders FROM sales GROUP BY weekday ORDER BY weekday;',
      ],
      success:
        "Fewer people, not smaller spending — of course, they're all at the market! A takeaway deal for market day… I'll paint a sign tonight.",
    },
  ],
};
