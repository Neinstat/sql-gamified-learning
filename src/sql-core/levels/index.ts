import type { Lang } from '../feedback';
import { chapter0 } from './chapter0';
import { chapter0Id } from './locales/id/chapter0';
import type { Chapter, ChapterTranslation, Level, LevelText } from './types';

export * from './types';

/** All playable chapters, in order (English, the source language). */
export const chapters: Chapter[] = [chapter0];

/** Every level, in play order. */
export const allLevels: Level[] = chapters.flatMap((c) => c.levels);

/** Translations by language and chapter id. English needs none. */
export const translations: Record<Exclude<Lang, 'en'>, Record<number, ChapterTranslation>> = {
  id: { 0: chapter0Id },
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
  return {
    ...level,
    title: text.title,
    dialogue: text.dialogue,
    task: text.task,
    hints: text.hints,
    success: text.success,
    // Keep the English example: it is SQL.
    lesson: level.lesson && text.lesson ? { ...level.lesson, ...text.lesson } : level.lesson,
  };
}
