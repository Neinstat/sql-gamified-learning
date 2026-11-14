/**
 * Grandma's recipe book: what goes into each menu item (GAME_DESIGN.md §11), for the kitchen
 * station and Chapter 4 (JOIN with menu_items). One row per ingredient.
 *
 * On purpose:
 * - Grandma's Secret Cake has no recipe — it's secret! (LEFT JOIN finds it.)
 * - Milk is in many drinks: the October story (Chapter 5) starts here.
 */
type Line = [ingredient: string, amount: number, unit: string];

const RECIPES: Record<number, Line[]> = {
  1: [['coffee beans', 18, 'g']],
  2: [['coffee beans', 18, 'g'], ['water', 200, 'ml']],
  3: [['coffee beans', 18, 'g'], ['milk', 150, 'ml']],
  4: [['coffee beans', 18, 'g'], ['milk', 250, 'ml']],
  5: [['coffee beans', 18, 'g'], ['milk', 200, 'ml'], ['chocolate sauce', 30, 'ml']],
  6: [['coffee beans', 36, 'g'], ['milk', 120, 'ml']],
  7: [['coffee beans', 18, 'g'], ['milk', 220, 'ml'], ['caramel sauce', 20, 'ml'], ['vanilla syrup', 10, 'ml']],
  8: [['coffee beans', 18, 'g'], ['milk', 150, 'ml'], ['ice', 100, 'g']],
  9: [['coffee beans', 18, 'g'], ['milk', 250, 'ml'], ['pumpkin spice', 15, 'g']],
  10: [['green tea', 3, 'g'], ['water', 250, 'ml']],
  11: [['black tea', 3, 'g'], ['water', 250, 'ml']],
  12: [['black tea', 3, 'g'], ['chai spices', 10, 'g'], ['milk', 200, 'ml']],
  13: [['matcha', 4, 'g'], ['milk', 220, 'ml']],
  14: [['black tea', 4, 'g'], ['lemon', 1, 'pcs'], ['ice', 100, 'g']],
  15: [['lemon', 2, 'pcs'], ['sugar', 20, 'g'], ['water', 250, 'ml']],
  16: [['cocoa', 25, 'g'], ['milk', 250, 'ml'], ['whipped cream', 30, 'g']],
  17: [['flour', 60, 'g'], ['butter', 30, 'g']],
  18: [['flour', 60, 'g'], ['butter', 30, 'g'], ['dark chocolate', 20, 'g']],
  19: [['flour', 70, 'g'], ['sugar', 30, 'g'], ['eggs', 1, 'pcs'], ['blueberries', 30, 'g']],
  20: [['flour', 80, 'g'], ['butter', 20, 'g'], ['sugar', 25, 'g'], ['cinnamon', 3, 'g']],
  21: [['flour', 60, 'g'], ['bananas', 1, 'pcs'], ['sugar', 20, 'g'], ['eggs', 1, 'pcs']],
  22: [['sourdough', 2, 'slices'], ['ham', 50, 'g'], ['cheddar', 30, 'g'], ['butter', 10, 'g']],
  23: [['sourdough', 2, 'slices'], ['avocados', 1, 'pcs'], ['olive oil', 5, 'ml']],
  24: [['white bread', 2, 'slices'], ['eggs', 2, 'pcs'], ['mayonnaise', 20, 'g']],
  25: [['cream cheese', 80, 'g'], ['sugar', 25, 'g'], ['eggs', 1, 'pcs'], ['biscuits', 30, 'g']],
  26: [['dark chocolate', 40, 'g'], ['butter', 25, 'g'], ['sugar', 30, 'g'], ['flour', 20, 'g'], ['eggs', 1, 'pcs']],
  27: [['apples', 1, 'pcs'], ['flour', 50, 'g'], ['butter', 25, 'g'], ['sugar', 20, 'g'], ['cinnamon', 1, 'g']],
  // 28: Grandma's Secret Cake — no recipe written down.
};

export const RECIPES_SCHEMA_SQL = `
CREATE TABLE recipes (
  recipe_id  INTEGER PRIMARY KEY,
  item_id    INTEGER NOT NULL REFERENCES menu_items (item_id),
  ingredient TEXT NOT NULL,
  amount     NUMERIC(6, 1) NOT NULL,
  unit       TEXT NOT NULL
);
`;

export function recipesSeedSql(): string {
  let id = 0;
  const rows = Object.entries(RECIPES).flatMap(([itemId, lines]) =>
    lines.map(([ingredient, amount, unit]) => `(${++id}, ${itemId}, '${ingredient}', ${amount}, '${unit}')`),
  );
  return `INSERT INTO recipes (recipe_id, item_id, ingredient, amount, unit) VALUES\n${rows.join(',\n')};`;
}
