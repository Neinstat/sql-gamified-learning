import { beforeAll, describe, expect, it } from 'vitest';
import { createCafeDatabase, runQuery, type CafeDatabase } from './db';
import { checkAnswer } from './checker';
import { allLevels, isCase } from './levels';
import { skillCheckId } from './levels/locales/id/skillCheck';
import { SKILL_CHECK_STATION, SKILL_QUESTIONS, nextQuestion, startingChapter } from './skillCheck';

let db: CafeDatabase;
beforeAll(async () => {
  db = await createCafeDatabase();
});

describe('Skill Check questions', () => {
  for (const q of SKILL_QUESTIONS) {
    it(`${q.id} runs at the cash register, returns rows, and passes its own check`, async () => {
      expect(q.solution.trimEnd()).toMatch(/;$/);
      const res = await runQuery(db, q.solution, SKILL_CHECK_STATION);
      expect(res.ok && res.rows.length).toBeGreaterThan(0);
      expect((await checkAnswer(db, q.solution, q.solution, {}, SKILL_CHECK_STATION)).verdict).toEqual({ correct: true });
    });
  }

  it('are not copies of level answers, and are all translated', () => {
    const levelAnswers = new Set(allLevels.flatMap((l) => (isCase(l) ? [] : [l.solution])));
    for (const q of SKILL_QUESTIONS) {
      expect(levelAnswers.has(q.solution), q.id).toBe(false);
      expect(skillCheckId[q.id]?.trim(), q.id).toBeTruthy();
    }
  });

  it('has two questions for each chapter 0–4', () => {
    for (const chapter of [0, 1, 2, 3, 4]) expect(SKILL_QUESTIONS.filter((q) => q.chapter === chapter)).toHaveLength(2);
  });
});

describe('Skill Check flow', () => {
  const ids = (chapter: number) => SKILL_QUESTIONS.filter((q) => q.chapter === chapter).map((q) => q.id);

  it('asks the questions chapter by chapter', () => {
    expect(nextQuestion(new Map())?.id).toBe('sc0-1');
    expect(nextQuestion(new Map([['sc0-1', true]]))?.id).toBe('sc0-2');
    expect(nextQuestion(new Map([['sc0-1', true], ['sc0-2', true]]))?.id).toBe('sc1-1');
  });

  it('stops at the first missed question, and starts the player in that chapter', () => {
    const answered = new Map([['sc0-1', true], ['sc0-2', true], ['sc1-1', false]]);
    expect(nextQuestion(answered)).toBeNull();
    expect(startingChapter(new Set(['sc0-1', 'sc0-2']))).toBe(1);
  });

  it('starts a beginner at Chapter 0, and someone who knows it all after Chapter 4', () => {
    expect(startingChapter(new Set())).toBe(0);
    expect(startingChapter(new Set([0, 1, 2, 3, 4].flatMap(ids)))).toBe(5);
  });
});
