import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, getSchema, runQuery, type CafeDatabase } from './db';

let db: CafeDatabase;

beforeAll(async () => {
  db = await createCafeDatabase();
});

describe('runQuery', () => {
  it('returns columns and rows', async () => {
    const res = await runQuery(db, 'SELECT name, price FROM menu_items WHERE item_id = 1;');
    expect(res).toEqual({ ok: true, columns: ['name', 'price'], rows: [['Espresso', expect.anything()]] });
  });

  it('keeps duplicate column names (rows are arrays, not objects)', async () => {
    const res = await runQuery(db, 'SELECT name, name FROM menu_items WHERE item_id = 1');
    expect(res).toEqual({ ok: true, columns: ['name', 'name'], rows: [['Espresso', 'Espresso']] });
  });

  it('shows the result of the last statement', async () => {
    const res = await runQuery(db, 'SELECT 1 AS a; SELECT 2 AS b;');
    expect(res).toEqual({ ok: true, columns: ['b'], rows: [[2]] });
  });

  it('returns NULLs as null', async () => {
    const res = await runQuery(db, "SELECT cost FROM menu_items WHERE name = 'Banana Bread'");
    expect(res).toEqual({ ok: true, columns: ['cost'], rows: [[null]] });
  });

  it('returns a readable error for bad SQL', async () => {
    const res = await runQuery(db, 'SELEKT * FROM menu_items');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toEqual({ kind: 'syntax-error', near: 'SELEKT' });
  });

  it('recognises common beginner mistakes', async () => {
    const errorOf = async (sql: string) => {
      const res = await runQuery(db, sql);
      return res.ok ? null : res.error;
    };
    expect(await errorOf('SELECT * FROM')).toEqual({ kind: 'syntax-error', near: null });
    expect(await errorOf("SELECT nme FROM menu_items")).toEqual({ kind: 'unknown-column', name: 'nme' });
    expect(await errorOf('SELECT * FROM menu WHERE 1 = 1')).toEqual({ kind: 'unknown-table', name: 'menu' });
    expect(await errorOf('SELECT name FROM menu_items WHERE category = coffee')).toEqual({
      kind: 'unknown-column',
      name: 'coffee',
    });
    expect(await errorOf('SELECT 1 / 0')).toEqual({ kind: 'sql-error', message: 'division by zero' });
  });

  it('asks for a query when the input is empty', async () => {
    const res = await runQuery(db, '  -- just a comment\n ; ');
    expect(res.ok).toBe(false);
  });

  it('cannot change data', async () => {
    const res = await runQuery(db, 'DELETE FROM menu_items');
    expect(res).toEqual({ ok: false, error: { kind: 'read-only' } });
    const count = await runQuery(db, 'SELECT COUNT(*) FROM menu_items');
    expect(count.ok && Number(count.rows[0][0])).toBe(28);
  });

  it('cannot escape the transaction with COMMIT', async () => {
    const res = await runQuery(db, 'COMMIT; DROP TABLE menu_items;');
    expect(res.ok).toBe(false);
    const res2 = await runQuery(db, 'SELECT 1; /* sneaky */ COMMIT; DROP TABLE menu_items;');
    expect(res2.ok).toBe(false);
    const count = await runQuery(db, 'SELECT COUNT(*) FROM menu_items');
    expect(count.ok && Number(count.rows[0][0])).toBe(28);
  });

  it('still works after a failed query', async () => {
    await runQuery(db, 'SELECT * FROM no_such_table');
    const res = await runQuery(db, 'SELECT 1 AS ok');
    expect(res).toEqual({ ok: true, columns: ['ok'], rows: [[1]] });
  });

  it('allows semicolons inside strings', async () => {
    const res = await runQuery(db, "SELECT 'a; commit' AS t");
    expect(res).toEqual({ ok: true, columns: ['t'], rows: [['a; commit']] });
  });
});

describe('station consoles', () => {
  it("only see their own tables, with a pointer to the right station", async () => {
    expect(await runQuery(db, 'SELECT COUNT(*) FROM sales;', 'menu-board')).toEqual({
      ok: false,
      error: { kind: 'other-station', table: 'sales', station: 'cash-register' },
    });
    expect((await runQuery(db, 'SELECT COUNT(*) FROM sales;', 'cash-register')).ok).toBe(true);
    expect((await runQuery(db, 'SELECT COUNT(*) FROM menu_items;', 'menu-board')).ok).toBe(true);
  });

  it('lets the cash register join sales with the menu', async () => {
    const res = await runQuery(
      db,
      'SELECT m.name, COUNT(*) FROM sales s JOIN menu_items m ON m.item_id = s.item_id GROUP BY m.name;',
      'cash-register',
    );
    expect(res.ok).toBe(true);
  });

  it("can't switch back to the all-seeing role", async () => {
    const attempts = [
      'RESET ROLE; SELECT * FROM sales;',
      'SELECT 1; SET ROLE postgres; SELECT * FROM sales;',
      '/* hi */ set role postgres; SELECT * FROM sales;',
      "SELECT set_config('role', 'postgres', true); SELECT * FROM sales;",
      "DO $$ BEGIN EXECUTE 'SET ROLE postgres'; END $$; SELECT * FROM sales;",
      "SELECT query_to_xml('SET ROLE postgres', true, true, ''); SELECT * FROM sales;",
    ];
    for (const sql of attempts) expect((await runQuery(db, sql, 'menu-board')).ok, sql).toBe(false);
    // And the next query is still limited.
    expect((await runQuery(db, 'SELECT * FROM sales;', 'menu-board')).ok).toBe(false);
  });

  it('lets the recipe book join recipes with the menu, but not see sales', async () => {
    const join = await runQuery(
      db,
      "SELECT m.name, r.amount FROM recipes r JOIN menu_items m ON m.item_id = r.item_id WHERE r.ingredient = 'milk';",
      'recipe-book',
    );
    expect(join.ok && join.rows.length).toBeGreaterThan(5);
    expect(await runQuery(db, 'SELECT * FROM sales;', 'recipe-book')).toEqual({
      ok: false,
      error: { kind: 'other-station', table: 'sales', station: 'cash-register' },
    });
  });

  it('has a recipe for every menu item except the secret cake', async () => {
    const res = await runQuery(db, 'SELECT m.name FROM menu_items m LEFT JOIN recipes r ON r.item_id = m.item_id WHERE r.recipe_id IS NULL;');
    expect(res.ok && res.rows).toEqual([["Grandma's Secret Cake"]]);
  });

  it('runs without a station for level solutions (everything visible)', async () => {
    expect((await runQuery(db, 'SELECT COUNT(*) FROM sales;')).ok).toBe(true);
  });
});

describe('getSchema', () => {
  it('lists menu_items and its columns', async () => {
    const schema = await getSchema(db);
    const menu = schema.find((t) => t.table === 'menu_items');
    expect(menu?.columns.map((c) => c.name)).toEqual([
      'item_id', 'name', 'category', 'price', 'cost', 'is_available', 'description',
    ]);
  });
});
