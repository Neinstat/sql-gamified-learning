/** Chapter 2 teaches traps on purpose: check the checker treats them the way the lessons say. */
import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, type CafeDatabase } from '../db';
import { checkAnswer } from '../checker';
import { findLevel, type RequestLevel } from './index';

let db: CafeDatabase;
beforeAll(async () => {
  db = await createCafeDatabase();
});

const level = (id: string) => findLevel(id) as RequestLevel;
const verdict = async (id: string, sql: string) =>
  (await checkAnswer(db, sql, level(id).solution, level(id).check)).verdict.correct;

describe('chapter 2', () => {
  it('ch2-4 needs the alias margin', async () => {
    expect(await verdict('ch2-4', 'SELECT name, price - cost FROM menu_items;')).toBe(false);
    expect(await verdict('ch2-4', 'SELECT name, price - cost AS margin FROM menu_items;')).toBe(true);
  });

  it('ch2-5 rejects the NULLs sorted first, and accepts NULLS LAST as well as IS NOT NULL', async () => {
    expect(await verdict('ch2-5', 'SELECT name, price - cost AS margin FROM menu_items ORDER BY margin DESC LIMIT 5;')).toBe(
      false,
    );
    expect(
      await verdict('ch2-5', 'SELECT name, price - cost AS margin FROM menu_items ORDER BY margin DESC NULLS LAST LIMIT 5;'),
    ).toBe(true);
  });

  it('ch2-2 needs the cheapest first', async () => {
    expect(
      await verdict('ch2-2', "SELECT name, price FROM menu_items WHERE category = 'dessert' ORDER BY price DESC LIMIT 3;"),
    ).toBe(false);
  });
});
