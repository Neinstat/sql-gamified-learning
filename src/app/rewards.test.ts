import { describe, expect, it } from 'vitest';
import { coinsFor, rewardFor, starsFor } from './rewards';

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
