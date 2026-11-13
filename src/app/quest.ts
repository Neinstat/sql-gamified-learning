/**
 * The request loop in the game world, one level at a time (GAME_DESIGN.md §4):
 *
 *   talk   → the character asks for something (dialogue, then the lesson card)
 *   solve  → the player goes to the station and solves it in the console
 *   report → the player tells the character, who thanks them
 *   (next level starts at "talk"; after the last level the stage is "done")
 *
 * Pure functions over Progress, so they are tested without a browser.
 */
import { markCompleted, type Progress, type QuestStage } from './progress';

/** The stage of `levelId`: anything not recorded yet starts at "talk". */
export function questStage(progress: Progress, levelId: string): QuestStage {
  return progress.quest?.levelId === levelId ? progress.quest.stage : 'talk';
}

/** The player heard the request: off to the station. */
export function acceptRequest(progress: Progress, levelId: string): Progress {
  return { ...progress, currentLevelId: levelId, quest: { levelId, stage: 'solve' } };
}

/** Correct answer at the station: saved as completed, then go back and report. */
export function solveRequest(progress: Progress, levelId: string, hintsUsed: number, mistakes = 0): Progress {
  return { ...markCompleted(progress, levelId, hintsUsed, mistakes), quest: { levelId, stage: 'report' } };
}

/** Reported to the character: move on to the next level, or finish if it was the last. */
export function reportDone(progress: Progress, levelIds: readonly string[], levelId: string): Progress {
  const next = levelIds[levelIds.indexOf(levelId) + 1];
  if (!next) return { ...progress, currentLevelId: levelId, quest: { levelId, stage: 'done' } };
  return { ...progress, currentLevelId: next, quest: { levelId: next, stage: 'talk' } };
}

/** Pick a level from the journal (replaying one, or continuing): its request starts again. */
export function startLevel(progress: Progress, levelId: string): Progress {
  return { ...progress, currentLevelId: levelId, quest: { levelId, stage: 'talk' } };
}

/**
 * A player who had finished everything when new levels were added (e.g. the Chapter 1 Mini Case)
 * continues with the first new one instead of staying "done".
 */
export function resumeNewLevels(progress: Progress, levelIds: readonly string[]): Progress {
  if (progress.quest?.stage !== 'done') return progress;
  const next = levelIds[levelIds.indexOf(progress.quest.levelId) + 1];
  return next ? startLevel(progress, next) : progress;
}
