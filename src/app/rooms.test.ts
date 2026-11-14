import { describe, expect, it } from 'vitest';
import { chapters } from '../sql-core/levels';
import { emptyProgress } from './progress';
import { reachedChapter } from './rooms';

const done = (ids: string[]) => ({
  ...emptyProgress,
  completed: Object.fromEntries(ids.map((id) => [id, { hintsUsed: 0, mistakes: 0, stars: 3 as const }])),
});

describe('reachedChapter', () => {
  it('is the current chapter for a new player', () => {
    expect(reachedChapter(emptyProgress, 0)).toBe(0);
  });

  it('moves past a chapter once all its levels are finished', () => {
    const chapter3 = chapters.find((c) => c.id === 3)!;
    expect(reachedChapter(done(chapter3.levels.map((l) => l.id)), 0)).toBe(4);
    expect(reachedChapter(done(chapter3.levels.slice(1).map((l) => l.id)), 0)).toBe(3);
  });

  it('never goes back when the player replays an early level', () => {
    expect(reachedChapter(done(['ch3-1']), 0)).toBe(3);
  });
});
