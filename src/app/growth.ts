/**
 * The café that grows (GAME_DESIGN.md §8–9): upgrades bought with coins, the daily streak, badges.
 * Pure functions over Progress, tested without a browser.
 */
import { allLevels, chapters, isCase } from '../sql-core/levels';
import type { Progress } from './progress';

export type UpgradeId = 'more-plants' | 'cosy-rug' | 'more-tables' | 'fancy-board' | 'busy-cafe';

/** Cheapest first. Costs are tuned so a careful player can buy everything by the end of Chapter 5. */
export const UPGRADES: { id: UpgradeId; cost: number; icon: string }[] = [
  { id: 'more-plants', cost: 40, icon: '🪴' },
  { id: 'cosy-rug', cost: 60, icon: '🧶' },
  { id: 'more-tables', cost: 100, icon: '🪑' },
  { id: 'fancy-board', cost: 120, icon: '🖼️' },
  { id: 'busy-cafe', cost: 200, icon: '🧑‍🤝‍🧑' },
];

export function canBuy(progress: Progress, id: UpgradeId): boolean {
  const upgrade = UPGRADES.find((u) => u.id === id);
  return Boolean(upgrade) && !progress.upgrades.includes(id) && progress.coins >= upgrade!.cost;
}

export function buyUpgrade(progress: Progress, id: UpgradeId): Progress {
  if (!canBuy(progress, id)) return progress;
  const cost = UPGRADES.find((u) => u.id === id)!.cost;
  return { ...progress, coins: progress.coins - cost, upgrades: [...progress.upgrades, id] };
}

/** A date as YYYY-MM-DD in the player's own time zone (a "day" is their day). */
export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dayBefore(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return localDay(new Date(y, m - 1, d - 1));
}

/** Played (solved something) on `today`: the streak grows by one per new day, and restarts after a gap. */
export function recordPlay(progress: Progress, today: string): Progress {
  const { count, lastDay } = progress.streak;
  if (lastDay === today) return progress;
  const next = lastDay === dayBefore(today) ? count + 1 : 1;
  return { ...progress, streak: { count: next, lastDay: today, best: Math.max(progress.streak.best, next) } };
}

/** The streak to show: it is still alive if the player played today or yesterday. */
export function currentStreak(progress: Progress, today: string): number {
  const { count, lastDay } = progress.streak;
  return lastDay === today || lastDay === dayBefore(today) ? count : 0;
}

export type BadgeId =
  | 'first-query'
  | 'clean-menu'
  | 'first-case'
  | 'first-join'
  | 'perfect-chapter'
  | 'streak-3'
  | 'shopkeeper'
  | 'true-analyst';

const chapterOf = (id: number) => chapters.find((c) => c.id === id)?.levels ?? [];

/** Each badge and when it is earned (from progress only, so it never gets out of sync). */
export const BADGES: { id: BadgeId; icon: string; earned: (p: Progress) => boolean }[] = [
  { id: 'first-query', icon: '🔰', earned: (p) => Boolean(p.completed['ch0-1']) },
  { id: 'clean-menu', icon: '🧹', earned: (p) => chapterOf(1).every((l) => p.completed[l.id]) },
  { id: 'first-case', icon: '🔍', earned: (p) => allLevels.some((l) => isCase(l) && p.completed[l.id]) },
  { id: 'first-join', icon: '🔗', earned: (p) => Boolean(p.completed['ch4-1']) },
  {
    id: 'perfect-chapter',
    icon: '⭐',
    earned: (p) => chapters.some((c) => c.levels.every((l) => p.completed[l.id]?.stars === 3)),
  },
  { id: 'streak-3', icon: '🔥', earned: (p) => p.streak.best >= 3 },
  { id: 'shopkeeper', icon: '🛍️', earned: (p) => p.upgrades.length > 0 },
  { id: 'true-analyst', icon: '🎯', earned: (p) => Boolean(p.completed['ch5-3']) },
];

export function earnedBadges(progress: Progress): BadgeId[] {
  return BADGES.filter((b) => b.earned(progress)).map((b) => b.id);
}
