import type { Lang } from '../feedback';
import { chapter0 } from './chapter0';
import { chapter1 } from './chapter1';
import { chapter2 } from './chapter2';
import { chapter3 } from './chapter3';
import { chapter0Id } from './locales/id/chapter0';
import { chapter1Id } from './locales/id/chapter1';
import { chapter2Id } from './locales/id/chapter2';
import { chapter3Id } from './locales/id/chapter3';
import type { Chapter, ChapterTranslation, Level, LevelText } from './types';

export * from './types';

/** All playable chapters, in order (English, the source language). */
export const chapters: Chapter[] = [chapter0, chapter1, chapter2, chapter3];

/** Every level, in play order. */
export const allLevels: Level[] = chapters.flatMap((c) => c.levels);

/** Translations by language and chapter id. English needs none. */
export const translations: Record<Exclude<Lang, 'en'>, Record<number, ChapterTranslation>> = {
  id: { 0: chapter0Id, 1: chapter1Id, 2: chapter2Id, 3: chapter3Id },
};

export function findLevel(id: string): Level | undefined {
  return allLevels.find((l) => l.id === id);
}

/** Chapters with their text in the given language (falls back to English). */
export function getChapters(lang: Lang): Chapter[] {
  if (lang === 'en') return chapters;
  return chapters.map((chapter) => {
    const t = translations[lang][chapter.id];
    if (!t) return chapter;
    return {
      ...chapter,
      title: t.title,
      summary: t.summary,
      levels: chapter.levels.map((level) => applyText(level, t.levels[level.id])),
    };
  });
}

function applyText(level: Level, text: LevelText | undefined): Level {
  if (!text) return level;
  const translated = {
    ...level,
    title: text.title,
    dialogue: text.dialogue,
    task: text.task,
    hints: text.hints,
    success: text.success,
    // Keep the English example: it is SQL.
    lesson: level.lesson && text.lesson ? { ...level.lesson, ...text.lesson } : level.lesson,
    soWhat: level.soWhat && text.soWhat ? { ...level.soWhat, ...text.soWhat } : level.soWhat,
  } as Level;
  if (translated.kind !== 'case' || !text.questions) return translated;
  return {
    ...translated,
    questions: translated.questions.map((q, i) => {
      const qt = text.questions?.[i];
      if (!qt) return q;
      const answer = q.answer.kind === 'choice' && qt.choices ? { ...q.answer, choices: qt.choices } : q.answer;
      return { ...q, prompt: qt.prompt, answer };
    }),
  };
}
