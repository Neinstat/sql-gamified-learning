/**
 * Guards for level data: every level must be solvable and well-formed.
 * When you add a level, these tests check it automatically.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, type CafeDatabase } from '../db';
import { checkAnswer } from '../checker';
import { checkConclusion, checkEvidence } from '../cases';
import { runQuery } from '../db';
import { allLevels, chapters, BLANK, isCase, type CaseLevel, type RequestLevel } from './index';
import { STATIONS, tablesInQuery } from '../stations';

/** Split SQL into the pieces a block puzzle would use: words, commas, brackets. */
function tokens(sql: string): string[] {
  return sql
    .replace(/([,;()])/g, ' $1 ')
    .split(/\s+/)
    .filter(Boolean);
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

      if (level.soWhat) {
        const { choices, answer, explanation } = level.soWhat;
        it('has a "So what?" question with 3 choices and a valid answer', () => {
          expect(choices).toHaveLength(3);
          expect(answer).toBeGreaterThanOrEqual(0);
          expect(answer).toBeLessThan(choices.length);
          expect(explanation.trim()).not.toBe('');
        });
      }

      if (isCase(level)) caseTests(level);
      else requestTests(level);
    });
  }
});

/** Mini Case: starters, questions and evidence are consistent with the data. */
function caseTests(level: CaseLevel) {
  it('offers starter queries that end with a semicolon and use only station tables', () => {
    expect(level.starters.length).toBeGreaterThan(0);
    for (const sql of level.starters) {
      expect(sql.trimEnd()).toMatch(/;$/);
      for (const table of tablesInQuery(sql)) expect(STATIONS[level.station].tables).toContain(table);
    }
  });

  level.questions.forEach((q, i) => {
    describe(`question ${i + 1}`, () => {
      it('has a valid answer', () => {
        if (q.answer.kind === 'choice') {
          expect(q.answer.choices.length).toBeGreaterThanOrEqual(2);
          expect(q.answer.correct).toBeLessThan(q.answer.choices.length);
        }
      });

      it('has evidence that the station can run, and that proves itself', async () => {
        expect((await runQuery(db, q.evidence.sql, level.station)).ok).toBe(true);
        for (const table of tablesInQuery(q.evidence.sql)) expect(STATIONS[level.station].tables).toContain(table);
        const ref = await runQuery(db, q.evidence.sql);
        expect(ref.ok && ref.rows.length).toBeGreaterThan(0);
        if (!ref.ok) return;
        expect(await checkEvidence(db, ref, q.evidence)).toEqual({ correct: true });
        const given = q.answer.kind === 'choice' ? q.answer.correct : String(q.answer.value);
        expect(await checkConclusion(db, q, given, ref)).toEqual({ correct: true });
      });

      if (q.answer.kind === 'number' && q.evidence.exact) {
        const value = q.answer.value;
        it('counts the same rows as its exact evidence', async () => {
          const ref = await runQuery(db, q.evidence.sql);
          expect(ref.ok && ref.rows.length).toBe(value);
        });
      }
    });
  });
}

function requestTests(level: RequestLevel) {
  it("runs at its station's console (the station's role can see every table it needs)", async () => {
    expect((await runQuery(db, level.solution, level.station)).ok).toBe(true);
  });

  it("only uses tables its station's console can see", () => {
    const used = tablesInQuery(level.solution);
    expect(used.length).toBeGreaterThan(0);
    for (const table of used) expect(STATIONS[level.station].tables).toContain(table);
  });

  it('ends its solution (and template) with a semicolon', () => {
    expect(level.solution.trimEnd()).toMatch(/;$/);
    if (level.input.kind === 'fill-blank') expect(level.input.template.trimEnd()).toMatch(/;$/);
    if (level.lesson?.example) expect(level.lesson.example.trimEnd()).toMatch(/;$/);
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
}
