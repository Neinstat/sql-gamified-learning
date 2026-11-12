/**
 * Grandma's café database: schema + seed data.
 *
 * Kept as a TypeScript string (not a .sql file) so it loads the same way
 * in the browser and in Node tests, with no bundler tricks.
 *
 * Dirty data is intentional (used in Chapter 1 "Cleaning Up the Menu"):
 * - "Banana Bread" has no cost (NULL)
 * - "Lemonade" and "Iced Tea" have no category (NULL)
 * - "Hot Chocolate" has no price (NULL)
 * - "Iced Capuccino" is misspelled
 * - some items have no description (NULL)
 */
export const CAFE_SCHEMA_SQL = `
CREATE TABLE menu_items (
  item_id      INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT,
  price        NUMERIC(5, 2),
  cost         NUMERIC(5, 2),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  description  TEXT
);
`;

export const CAFE_SEED_SQL = `
INSERT INTO menu_items (item_id, name, category, price, cost, is_available, description) VALUES
  (1,  'Espresso',              'coffee',   2.50, 0.60, TRUE,  'A short, strong shot of coffee'),
  (2,  'Americano',             'coffee',   3.00, 0.70, TRUE,  'Espresso topped up with hot water'),
  (3,  'Cappuccino',            'coffee',   3.75, 1.10, TRUE,  'Espresso with steamed milk and thick foam'),
  (4,  'Latte',                 'coffee',   4.00, 1.20, TRUE,  'Espresso with lots of steamed milk'),
  (5,  'Mocha',                 'coffee',   4.50, 1.40, TRUE,  'Latte with rich chocolate sauce'),
  (6,  'Flat White',            'coffee',   4.00, 1.15, TRUE,  'Double espresso with velvety milk'),
  (7,  'Caramel Macchiato',     'coffee',   4.75, 1.50, TRUE,  'Vanilla latte marked with caramel'),
  (8,  'Iced Capuccino',        'coffee',   4.25, 1.25, TRUE,  NULL),
  (9,  'Pumpkin Spice Latte',   'coffee',   5.00, 1.70, FALSE, 'Seasonal latte with pumpkin and spices'),
  (10, 'Green Tea',             'tea',      2.75, 0.50, TRUE,  'Light and grassy loose-leaf tea'),
  (11, 'Earl Grey',             'tea',      2.75, 0.55, TRUE,  'Black tea with bergamot'),
  (12, 'Chai Latte',            'tea',      4.25, 1.30, TRUE,  'Spiced black tea with steamed milk'),
  (13, 'Matcha Latte',          'tea',      4.75, 1.60, TRUE,  'Stone-ground green tea with milk'),
  (14, 'Iced Tea',              NULL,       3.00, 0.45, TRUE,  'Black tea over ice with lemon'),
  (15, 'Lemonade',              NULL,       3.25, 0.60, TRUE,  'Freshly squeezed, Grandma''s recipe'),
  (16, 'Hot Chocolate',         'other',    NULL, 0.95, TRUE,  'Thick hot chocolate with whipped cream'),
  (17, 'Croissant',             'pastry',   3.25, 0.90, TRUE,  'Buttery, flaky French pastry'),
  (18, 'Chocolate Croissant',   'pastry',   3.75, 1.10, TRUE,  'Croissant filled with dark chocolate'),
  (19, 'Blueberry Muffin',      'pastry',   3.00, 0.85, TRUE,  'Soft muffin packed with blueberries'),
  (20, 'Cinnamon Roll',         'pastry',   3.50, 0.95, TRUE,  'Sweet roll with cinnamon sugar glaze'),
  (21, 'Banana Bread',          'pastry',   3.25, NULL, TRUE,  NULL),
  (22, 'Ham & Cheese Toastie',  'sandwich', 6.50, 2.40, TRUE,  'Toasted sourdough with ham and cheddar'),
  (23, 'Avocado Toast',         'sandwich', 7.25, 2.80, TRUE,  'Smashed avocado on sourdough'),
  (24, 'Egg Salad Sandwich',    'sandwich', 6.00, 2.10, TRUE,  'Creamy egg salad on soft white bread'),
  (25, 'Cheesecake',            'dessert',  5.50, 1.90, TRUE,  'New York-style baked cheesecake'),
  (26, 'Chocolate Brownie',     'dessert',  3.50, 0.90, TRUE,  'Fudgy chocolate brownie'),
  (27, 'Apple Pie',             'dessert',  4.75, 1.50, TRUE,  'Grandma''s classic apple pie'),
  (28, 'Grandma''s Secret Cake', 'dessert', 6.00, 2.00, FALSE, NULL);
`;
