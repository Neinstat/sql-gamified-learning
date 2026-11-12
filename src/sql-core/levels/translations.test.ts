/**
 * Guards for translations: every level is translated, and each translation
 * has the same shape as the English text (same number of dialogue lines,
 * a lesson only where English has one).
 */
import { describe, expect, it } from 'vitest';
import { allLevels, chapters, getChapters, translations } from './index';

for (const [lang, byChapter] of Object.entries(translations)) {
  describe(`translations: ${lang}`, () => {
    it('covers every chapter and level, with no unknown level ids', () => {
      for (const chapter of chapters) {
        const t = byChapter[chapter.id];
        expect(t, `chapter ${chapter.id} is not translated`).toBeDefined();
        expect(Object.keys(t.levels).sort()).toEqual(chapter.levels.map((l) => l.id).sort());
      }
    });

    for (const level of allLevels) {
      const chapter = chapters.find((c) => c.levels.includes(level))!;
      const text = byChapter[chapter.id]?.levels[level.id];
      if (!text) continue;

      it(`${level.id} matches the English structure`, () => {
        expect(text.dialogue).toHaveLength(level.dialogue.length);
        expect(Boolean(text.lesson)).toBe(Boolean(level.lesson));
        if (text.lesson && level.lesson) expect(text.lesson.body).toHaveLength(level.lesson.body.length);
        for (const s of [text.title, text.task, text.success, ...text.dialogue, ...text.hints]) {
          expect(s.trim()).not.toBe('');
        }
      });
    }
  });
}

describe('getChapters', () => {
  it('returns English text for en', () => {
    expect(getChapters('en')[0].levels[0].title).toBe('The Menu Book');
  });

  it('returns Indonesian text but keeps SQL and solution in English', () => {
    const level = getChapters('id')[0].levels[0];
    expect(level.title).toBe('Buku Menu');
    expect(level.solution).toBe('SELECT * FROM menu_items');
    expect(level.lesson?.example).toBe('SELECT * FROM table_name');
    expect(level.input).toEqual(allLevels[0].input);
  });
});
