import { chapter0 } from './chapter0';
import type { Chapter, Level } from './types';

export * from './types';

/** All playable chapters, in order. */
export const chapters: Chapter[] = [chapter0];

/** Every level, in play order. */
export const allLevels: Level[] = chapters.flatMap((c) => c.levels);

export function findLevel(id: string): Level | undefined {
  return allLevels.find((l) => l.id === id);
}
