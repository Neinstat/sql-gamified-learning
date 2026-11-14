import { describe, expect, it } from 'vitest';
import { homeStation, stationTables, tablesInQuery } from './stations';

describe('tablesInQuery', () => {
  it('finds tables after FROM and JOIN, once each', () => {
    expect(tablesInQuery('SELECT * FROM menu_items;')).toEqual(['menu_items']);
    expect(
      tablesInQuery('select s.id from sales s join menu_items m on m.id = s.item_id left JOIN Sales x on true;'),
    ).toEqual(['sales', 'menu_items']);
  });

  it("ignores the FROM inside EXTRACT and friends", () => {
    expect(tablesInQuery('SELECT EXTRACT(DOW FROM sold_at) AS d FROM sales;')).toEqual(['sales']);
  });
});

describe('stationTables', () => {
  const schema = [{ table: 'menu_items' }, { table: 'sales' }];

  it("keeps only the station's tables", () => {
    expect(stationTables('menu-board', schema)).toEqual([{ table: 'menu_items' }]);
  });

  it('skips tables that do not exist yet', () => {
    expect(stationTables('cash-register', schema)).toEqual([{ table: 'menu_items' }, { table: 'sales' }]);
    expect(stationTables('cash-register', [{ table: 'recipes' }])).toEqual([]);
  });
});

describe('homeStation', () => {
  it('finds where a table lives', () => {
    expect(homeStation('menu_items')).toBe('menu-board');
    expect(homeStation('sales')).toBe('cash-register');
    expect(homeStation('nope')).toBeNull();
  });
});
