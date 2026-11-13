import { describe, expect, it } from 'vitest';
import { coinsFor, rewardFor, starsFor } from './rewards';
import { emptyProgress, markCompleted, markSoWhatRight, parseProgress } from './progress';

describe('stars', () => {
  it('gives 3 for no hints and no mistakes, 2 for no hints, 1 otherwise', () => {
    expect(starsFor(0, 0)).toBe(3);
    expect(starsFor(0, 2)).toBe(2);
    expect(starsFor(1, 0)).toBe(1);
    expect(starsFor(3, 5)).toBe(1);
  });
});

describe('coins', () => {
  it('pays 10 per star for a request and 20 per star for a Mini Case', () => {
    expect(coinsFor('request', 3)).toBe(30);
    expect(coinsFor('case', 2)).toBe(40);
  });

  it('only pays the difference to the best result on a replay', () => {
    expect(rewardFor('request', 0, 1, 0)).toEqual({ stars: 1, best: 1, coins: 10 });
    expect(rewardFor('request', 1, 0, 0)).toEqual({ stars: 3, best: 3, coins: 20 });
    expect(rewardFor('request', 3, 2, 0)).toEqual({ stars: 1, best: 3, coins: 0 });
  });
});

describe('progress', () => {
  it('keeps the best result and adds coins once', () => {
    let p = markCompleted(emptyProgress, 'ch0-1', 1, 0);
    expect(p.completed['ch0-1']).toEqual({ hintsUsed: 1, mistakes: 0, stars: 1 });
    expect(p.coins).toBe(10);
    p = markCompleted(p, 'ch0-1', 0, 0);
    expect(p.completed['ch0-1'].stars).toBe(3);
    expect(p.coins).toBe(30);
    p = markCompleted(p, 'ch0-1', 3, 4);
    expect(p.completed['ch0-1']).toEqual({ hintsUsed: 0, mistakes: 0, stars: 3 });
    expect(p.coins).toBe(30);
  });

  it('pays a Mini Case double', () => {
    expect(markCompleted(emptyProgress, 'ch1-7', 0, 0).coins).toBe(60);
  });

  it('pays the "So what?" bonus once per level', () => {
    let p = markSoWhatRight(emptyProgress, 'ch1-1', 5);
    p = markSoWhatRight(p, 'ch1-1', 5);
    expect(p.coins).toBe(5);
    expect(p.soWhatRight).toEqual(['ch1-1']);
  });

  it('reads saves from before stars and coins (at most ⭐⭐, coins from stars)', () => {
    const old = JSON.stringify({
      currentLevelId: 'ch0-3',
      completed: { 'ch0-1': { hintsUsed: 0 }, 'ch0-2': { hintsUsed: 2 } },
      quest: { levelId: 'ch0-3', stage: 'talk' },
    });
    const p = parseProgress(old);
    expect(p.completed['ch0-1']).toEqual({ hintsUsed: 0, mistakes: 1, stars: 2 });
    expect(p.completed['ch0-2']).toEqual({ hintsUsed: 2, mistakes: 1, stars: 1 });
    expect(p.coins).toBe(30);
    expect(p.soWhatRight).toEqual([]);
  });

  it('falls back to empty progress for broken saves', () => {
    expect(parseProgress('not json')).toEqual(emptyProgress);
  });
});
