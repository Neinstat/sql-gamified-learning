/**
 * Player progress, saved in this browser (no backend in the MVP).
 * Level ids are the keys, so never rename a released level id.
 */
export type Progress = {
  /** Level the player was last on. */
  currentLevelId: string | null;
  /** Finished levels, with the fewest hints used (kept for stars in Phase 3). */
  completed: Record<string, { hintsUsed: number }>;
  /** Game world only: how far the player is with the current level's request (see quest.ts). */
  quest?: QuestState;
};

export type QuestStage = 'talk' | 'solve' | 'report' | 'done';
export type QuestState = { levelId: string; stage: QuestStage };
const STAGES: QuestStage[] = ['talk', 'solve', 'report', 'done'];

const STORAGE_KEY = 'sql-valley.progress.v1';

export const emptyProgress: Progress = { currentLevelId: null, completed: {} };

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress;
    const data = JSON.parse(raw) as Partial<Progress>;
    return {
      currentLevelId: typeof data.currentLevelId === 'string' ? data.currentLevelId : null,
      completed: data.completed && typeof data.completed === 'object' ? data.completed : {},
      quest:
        data.quest && typeof data.quest.levelId === 'string' && STAGES.includes(data.quest.stage)
          ? { levelId: data.quest.levelId, stage: data.quest.stage }
          : undefined,
    };
  } catch {
    return emptyProgress;
  }
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage blocked (e.g. private mode): the game still works, progress just isn't kept.
  }
}

export function markCompleted(progress: Progress, levelId: string, hintsUsed: number): Progress {
  const previous = progress.completed[levelId];
  const best = previous ? Math.min(previous.hintsUsed, hintsUsed) : hintsUsed;
  return { ...progress, completed: { ...progress.completed, [levelId]: { hintsUsed: best } } };
}
