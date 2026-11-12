/**
 * Guards for level data: every level must be solvable and well-formed.
 * When you add a level, these tests check it automatically.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, type CafeDatabase } from '../db';
import { checkAnswer } from '../checker';
import { allLevels, chapters, BLANK } from './index';

/** Split SQL into the pieces a block puzzle would use: words, commas, brackets. */
function tokens(sql: string): string[] {
  return sql.replace(/([,;()])/g, ' $1 ').split(/\s+/).filter(Boolean);
}

let db: CafeDatabase;
beforeAll(async () => {
  db = await createCafeDatabase();
});

describe('level data', () => {
  it('has unique ids in the form chN-M', () => {
    const ids = allLevels.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^ch\d+-\d+$/);
  });

  it('numbers chapters 0, 1, 2… in order', () => {
    expect(chapters.map((c) => c.id)).toEqual(chapters.map((_, i) => i));
  });

  for (const level of allLevels) {
    describe(level.id, () => {
      it('has dialogue, a task and three hints', () => {
        expect(level.dialogue.length).toBeGreaterThan(0);
        expect(level.task.trim()).not.toBe('');
        expect(level.hints).toHaveLength(3);
        for (const hint of level.hints) expect(hint.trim()).not.toBe('');
      });

      it('has a solution that runs and returns rows', async () => {
        const { verdict, result } = await checkAnswer(db, level.solution, level.solution, level.check);
        expect(verdict).toEqual({ correct: true });
        expect(result.ok && result.rows.length).toBeGreaterThan(0);
      });

      if (level.input.kind === 'blocks') {
        const blocks = level.input.blocks;
        const needed = tokens(level.solution);

        it('offers every block the solution needs', () => {
          const pool = [...blocks];
          for (const token of needed) {
            const idx = pool.indexOf(token);
            expect(idx, `missing block "${token}"`).not.toBe(-1);
            pool.splice(idx, 1);
          }
        });

        it("doesn't list the blocks in answer order", () => {
          expect(blocks.slice(0, needed.length)).not.toEqual(needed);
        });

        it('is correct when the blocks are joined with spaces', async () => {
          const { verdict } = await checkAnswer(db, needed.join(' '), level.solution, level.check);
          expect(verdict).toEqual({ correct: true });
        });
      }

      if (level.input.kind === 'fill-blank') {
        const { template, answers } = level.input;
        it('has one answer per blank', () => {
          expect(template).toContain(BLANK);
          expect(template.split(BLANK).length - 1).toBe(answers.length);
        });

        it('is correct when the blanks are filled with the answers', async () => {
          let i = 0;
          const filled = template.split(BLANK).reduce((acc, part) => acc + answers[i++] + part);
          const { verdict } = await checkAnswer(db, filled, level.solution, level.check);
          expect(verdict).toEqual({ correct: true });
        });
      }
    });
  }
});
