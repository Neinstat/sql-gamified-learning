import { findLevel, isCase } from '../sql-core/levels';
import { coinsFor, rewardFor, type Reward, type Stars } from './rewards';

/**
 * Player progress, saved in this browser (no backend in the MVP).
 * Level ids are the keys, so never rename a released level id.
 */
export type Progress = {
  /** Level the player was last on. */
  currentLevelId: string | null;
  /** Finished levels, with the best result so far. */
  completed: Record<string, LevelRecord>;
  /** Game world only: how far the player is with the current level's request (see quest.ts). */
  quest?: QuestState;
  /** Coin balance (earned from stars and "So what?" answers; spent on upgrades later). */
  coins: number;
  /** Levels whose "So what?" was answered right (the bonus is paid once). */
  soWhatRight: string[];
  /** Levels passed over by the Skill Check: open to play, but no stars or coins until played. */
  skipped: string[];
  /** The Skill Check was offered on the first day (taken or declined), so the welcome card isn't shown again. */
  skillCheckOffered: boolean;
};

/** Best result for a finished level: fewest hints, fewest mistakes, most stars. */
export type LevelRecord = { hintsUsed: number; mistakes: number; stars: Stars };

export type QuestStage = 'talk' | 'solve' | 'report' | 'done';
export type QuestState = { levelId: string; stage: QuestStage };
const STAGES: QuestStage[] = ['talk', 'solve', 'report', 'done'];

const STORAGE_KEY = 'sql-valley.progress.v1';

export const emptyProgress: Progress = {
  currentLevelId: null,
  completed: {},
  coins: 0,
  soWhatRight: [],
  skipped: [],
  skillCheckOffered: false,
};

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseProgress(raw) : emptyProgress;
  } catch {
    return emptyProgress;
  }
}

/** Read a saved progress string, filling in anything older saves didn't have. */
export function parseProgress(raw: string): Progress {
  try {
    const data = JSON.parse(raw) as Partial<Progress>;
    const completed = readCompleted(data.completed);
    return {
      currentLevelId: typeof data.currentLevelId === 'string' ? data.currentLevelId : null,
      completed,
      quest:
        data.quest && typeof data.quest.levelId === 'string' && STAGES.includes(data.quest.stage)
          ? { levelId: data.quest.levelId, stage: data.quest.stage }
          : undefined,
      // Saves from before coins existed get the coins their stars are worth.
      coins: typeof data.coins === 'number' ? data.coins : coinsForAll(completed),
      soWhatRight: Array.isArray(data.soWhatRight) ? data.soWhatRight.filter((id) => typeof id === 'string') : [],
      skipped: Array.isArray(data.skipped) ? data.skipped.filter((id) => typeof id === 'string') : [],
      // Older saves already played on: don't greet them as a new player.
      skillCheckOffered: data.skillCheckOffered === true || Boolean(data.quest) || Object.keys(completed).length > 0,
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

/** Fill in what older saves didn't record: no mistake count (assume some), so at most ⭐⭐. */
function readCompleted(raw: unknown): Record<string, LevelRecord> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, LevelRecord> = {};
  for (const [id, value] of Object.entries(raw as Record<string, Partial<LevelRecord>>)) {
    if (!value || typeof value !== 'object') continue;
    const hintsUsed = typeof value.hintsUsed === 'number' ? value.hintsUsed : 0;
    const mistakes = typeof value.mistakes === 'number' ? value.mistakes : 1;
    const stars = value.stars === 1 || value.stars === 2 || value.stars === 3 ? value.stars : hintsUsed > 0 ? 1 : 2;
    out[id] = { hintsUsed, mistakes, stars };
  }
  return out;
}

export const levelKind = (levelId: string): 'request' | 'case' => {
  const level = findLevel(levelId);
  return level && isCase(level) ? 'case' : 'request';
};

function coinsForAll(completed: Record<string, LevelRecord>): number {
  return Object.entries(completed).reduce((sum, [id, r]) => sum + coinsFor(levelKind(id), r.stars), 0);
}

/** What solving `levelId` now would earn (stars this time, coins above the previous best). */
export function rewardForSolve(progress: Progress, levelId: string, hintsUsed: number, mistakes: number): Reward {
  return rewardFor(levelKind(levelId), progress.completed[levelId]?.stars ?? 0, hintsUsed, mistakes);
}

/** Record a solve: keep the best result and add the coins it earned. */
export function markCompleted(progress: Progress, levelId: string, hintsUsed: number, mistakes = 0): Progress {
  const previous = progress.completed[levelId];
  const reward = rewardForSolve(progress, levelId, hintsUsed, mistakes);
  const record: LevelRecord = {
    hintsUsed: previous ? Math.min(previous.hintsUsed, hintsUsed) : hintsUsed,
    mistakes: previous ? Math.min(previous.mistakes, mistakes) : mistakes,
    stars: reward.best,
  };
  return {
    ...progress,
    completed: { ...progress.completed, [levelId]: record },
    coins: progress.coins + reward.coins,
  };
}

/** A right "So what?" answer: a small bonus, paid once per level. */
export function markSoWhatRight(progress: Progress, levelId: string, bonus: number): Progress {
  if (progress.soWhatRight.includes(levelId)) return progress;
  return { ...progress, coins: progress.coins + bonus, soWhatRight: [...progress.soWhatRight, levelId] };
}

/** A level counts as done for unlocking (Journal, rooms) when it was played or skipped by the Skill Check. */
export const isDone = (progress: Progress, levelId: string) =>
  Boolean(progress.completed[levelId]) || progress.skipped.includes(levelId);

/** A brand-new player, who should be offered the Skill Check. */
export const isNewPlayer = (progress: Progress) =>
  !progress.skillCheckOffered && !progress.quest && Object.keys(progress.completed).length === 0;
