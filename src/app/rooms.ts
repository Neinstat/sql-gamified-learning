import { chapters } from '../sql-core/levels';
import { isDone, type Progress } from './progress';

/**
 * How far the player has come, for opening rooms (GAME_DESIGN.md §3): the chapter they are in,
 * any chapter they have finished a level of, and the one after a fully finished chapter.
 */
export function reachedChapter(progress: Progress, currentChapter: number): number {
  let reached = currentChapter;
  for (const chapter of chapters) {
    if (chapter.levels.some((l) => isDone(progress, l.id))) reached = Math.max(reached, chapter.id);
    if (chapter.levels.every((l) => isDone(progress, l.id))) reached = Math.max(reached, chapter.id + 1);
  }
  return reached;
}
