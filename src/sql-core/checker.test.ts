import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, type CafeDatabase } from './db';
import { checkAnswer, compareResults, endsWithSemicolon, usesOrderBy, type Verdict } from './checker';
import { formatFeedback } from './feedback';

/** Verdict with the English message, for readable assertions. */
function said(v: Verdict) {
  return v.correct ? v : { correct: false, message: formatFeedback(v.feedback, 'en') };
}

describe('compareResults', () => {
  const expected = {
    columns: ['name', 'price'],
    rows: [
      ['Espresso', '2.50'],
      ['Green Tea', '2.75'],
    ],
  };

  it('accepts an identical result', () => {
    expect(said(compareResults(expected, expected))).toEqual({ correct: true });
  });

  it('ignores row order by default', () => {
    const actual = { columns: ['name', 'price'], rows: [['Green Tea', '2.75'], ['Espresso', '2.50']] };
    expect(said(compareResults(actual, expected))).toEqual({ correct: true });
  });

  it('checks row order when asked', () => {
    const actual = { columns: ['name', 'price'], rows: [['Green Tea', '2.75'], ['Espresso', '2.50']] };
    expect(said(compareResults(actual, expected, { orderMatters: true }))).toEqual({
      correct: false,
      message: 'You have the right rows, but in the wrong order.',
    });
  });

  it('accepts columns in a different order', () => {
    const actual = { columns: ['price', 'name'], rows: [['2.50', 'Espresso'], ['2.75', 'Green Tea']] };
    expect(said(compareResults(actual, expected))).toEqual({ correct: true });
  });

  it('treats 2.5, 2.50 and "2.50" as equal', () => {
    const actual = { columns: ['name', 'price'], rows: [['Espresso', 2.5], ['Green Tea', '2.750']] };
    expect(said(compareResults(actual, expected))).toEqual({ correct: true });
  });

  it('accepts other column names (aliases) by default', () => {
    const actual = { columns: ['item', 'cost_usd'], rows: expected.rows };
    expect(said(compareResults(actual, expected))).toEqual({ correct: true });
  });

  it('rejects other column names when names are checked', () => {
    const actual = { columns: ['name', 'cost_usd'], rows: expected.rows };
    expect(said(compareResults(actual, expected, { checkColumnNames: true }))).toEqual({
      correct: false,
      message: 'Column `cost_usd` should be named `price`.',
    });
  });

  it('names a missing column', () => {
    const actual = { columns: ['name'], rows: [['Espresso'], ['Green Tea']] };
    expect(said(compareResults(actual, expected))).toEqual({ correct: false, message: 'Column `price` is missing.' });
  });

  it('names extra columns', () => {
    const actual = { columns: ['name', 'price', 'cost'], rows: [['Espresso', '2.50', '0.60']] };
    expect(said(compareResults(actual, expected))).toEqual({
      correct: false,
      message: 'Your result has an extra column: `cost`.',
    });
  });

  it('reports a wrong row count', () => {
    const actual = { columns: ['name', 'price'], rows: [['Espresso', '2.50']] };
    expect(said(compareResults(actual, expected))).toEqual({
      correct: false,
      message: 'Your result has 1 row — expected 2.',
    });
  });

  it('explains an empty result', () => {
    const actual = { columns: ['name', 'price'], rows: [] };
    expect(said(compareResults(actual, expected))).toEqual({
      correct: false,
      message:
        'Your query found no rows — expected 2. Check the values in your condition: text must match exactly, including capital letters.',
    });
  });

  it('points at a row that should not be there', () => {
    const actual = { columns: ['name', 'price'], rows: [['Espresso', '2.50'], ['Latte', '4.00']] };
    expect(said(compareResults(actual, expected))).toEqual({
      correct: false,
      message: "This row shouldn't be in the result: Latte, 4.00",
    });
  });

  it('counts duplicate rows', () => {
    const actual = { columns: ['name', 'price'], rows: [['Espresso', '2.50'], ['Espresso', '2.50']] };
    expect(compareResults(actual, expected).correct).toBe(false);
  });

  it('suggests checking columns when a different column was picked', () => {
    const actual = { columns: ['name', 'cost'], rows: [['Espresso', '0.60'], ['Green Tea', '0.50']] };
    expect(said(compareResults(actual, expected))).toEqual({
      correct: false,
      message: 'Check your columns: expected `name`, `price` but got `name`, `cost`.',
    });
  });

  it('treats NULL as a value', () => {
    const exp = { columns: ['cost'], rows: [[null]] };
    expect(said(compareResults({ columns: ['cost'], rows: [[null]] }, exp))).toEqual({ correct: true });
    expect(compareResults({ columns: ['cost'], rows: [['0']] }, exp).correct).toBe(false);
  });
});

describe('endsWithSemicolon', () => {
  it('finds a final semicolon, ignoring spaces and comments', () => {
    expect(endsWithSemicolon('SELECT 1;')).toBe(true);
    expect(endsWithSemicolon('SELECT 1;  \n')).toBe(true);
    expect(endsWithSemicolon('SELECT 1; -- done')).toBe(true);
  });

  it('is false when the semicolon is missing or only inside a string', () => {
    expect(endsWithSemicolon('SELECT 1')).toBe(false);
    expect(endsWithSemicolon("SELECT ';'")).toBe(false);
    expect(endsWithSemicolon('SELECT 1 -- ;')).toBe(false);
  });
});

describe('usesOrderBy', () => {
  it('finds ORDER BY', () => {
    expect(usesOrderBy('SELECT * FROM menu_items ORDER BY price')).toBe(true);
    expect(usesOrderBy('select * from menu_items order\n  by price desc')).toBe(true);
  });

  it('ignores ORDER BY in strings and comments', () => {
    expect(usesOrderBy("SELECT 'order by' AS t")).toBe(false);
    expect(usesOrderBy('SELECT 1 -- order by later')).toBe(false);
    expect(usesOrderBy('SELECT 1 /* order by */')).toBe(false);
  });
});

describe('checkAnswer (on the café database)', () => {
  let db: CafeDatabase;
  beforeAll(async () => {
    db = await createCafeDatabase();
  });

  const cheapItems = 'SELECT name, price FROM menu_items WHERE price < 3';

  it('accepts a differently written but equivalent query', async () => {
    const { verdict } = await checkAnswer(
      db,
      'select price, name from menu_items where not (price >= 3) order by name;',
      cheapItems,
    );
    expect(said(verdict)).toEqual({ correct: true });
  });

  it('accepts IN instead of OR', async () => {
    const { verdict } = await checkAnswer(
      db,
      "SELECT name FROM menu_items WHERE category IN ('tea', 'dessert');",
      "SELECT name FROM menu_items WHERE category = 'tea' OR category = 'dessert'",
    );
    expect(said(verdict)).toEqual({ correct: true });
  });

  it('explains a wrong row count', async () => {
    const { verdict } = await checkAnswer(db, 'SELECT name, price FROM menu_items', cheapItems);
    expect(said(verdict)).toEqual({ correct: false, message: 'Your result has 28 rows — expected 3.' });
  });

  it('requires order when the solution uses ORDER BY', async () => {
    const { verdict } = await checkAnswer(
      db,
      cheapItems + ' ORDER BY price DESC',
      cheapItems + ' ORDER BY price ASC',
    );
    expect(said(verdict)).toEqual({ correct: false, message: 'You have the right rows, but in the wrong order.' });
  });

  it('passes SQL errors through and still returns the result', async () => {
    const { result, verdict } = await checkAnswer(db, 'SELECT nme FROM menu_items', cheapItems);
    expect(result.ok).toBe(false);
    expect(verdict.correct).toBe(false);
    if (!verdict.correct) expect(verdict.feedback).toEqual({ kind: 'unknown-column', name: 'nme' });
  });

  it('handles NULL questions (dirty data)', async () => {
    const { verdict } = await checkAnswer(
      db,
      'SELECT name FROM menu_items WHERE cost IS NULL;',
      "SELECT name FROM menu_items WHERE name = 'Banana Bread'",
    );
    expect(said(verdict)).toEqual({ correct: true });
  });

  it('asks for a semicolon once the result is right', async () => {
    const { verdict } = await checkAnswer(db, 'SELECT name, price FROM menu_items WHERE price < 3', cheapItems);
    expect(said(verdict)).toEqual({
      correct: false,
      message: 'Your result is right — now end the query with a semicolon `;`.',
    });
  });

  it('reports a wrong result before a missing semicolon', async () => {
    const { verdict } = await checkAnswer(db, 'SELECT name, price FROM menu_items', cheapItems);
    expect(said(verdict)).toEqual({ correct: false, message: 'Your result has 28 rows — expected 3.' });
  });

  it('can skip the semicolon rule', async () => {
    const { verdict } = await checkAnswer(db, cheapItems, cheapItems, { requireSemicolon: false });
    expect(verdict).toEqual({ correct: true });
  });

  it('throws when the level solution itself is broken', async () => {
    await expect(checkAnswer(db, 'SELECT 1', 'SELECT * FROM nope')).rejects.toThrow(/Level solution failed/);
  });
});
