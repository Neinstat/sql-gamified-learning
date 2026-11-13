/**
 * Stars and coins (GAME_DESIGN.md §8). Pure functions, tested without a browser.
 *
 *   ⭐       solved
 *   ⭐⭐     solved without hints
 *   ⭐⭐⭐   solved without hints and without a mistake
 *            (request: no wrong run · Mini Case: no conclusion the data didn't support)
 *
 * Coins per star: 10 for a request, 20 for a Mini Case. Replaying only pays the difference
 * to your best result, so coins can't be farmed. A right "So what?" answer pays a small bonus once.
 */
export type Stars = 1 | 2 | 3;

export const COINS_PER_STAR = { request: 10, case: 20 } as const;
export const SO_WHAT_BONUS = 5;

export function starsFor(hintsUsed: number, mistakes: number): Stars {
  if (hintsUsed > 0) return 1;
  return mistakes > 0 ? 2 : 3;
}

export function coinsFor(kind: 'request' | 'case', stars: number): number {
  return COINS_PER_STAR[kind] * stars;
}

/** What one solve earned: stars this time, coins added (only above the previous best). */
export type Reward = { stars: Stars; coins: number; best: Stars };

export function rewardFor(kind: 'request' | 'case', previousBest: number, hintsUsed: number, mistakes: number): Reward {
  const stars = starsFor(hintsUsed, mistakes);
  const best = Math.max(stars, previousBest) as Stars;
  return { stars, best, coins: coinsFor(kind, best) - coinsFor(kind, previousBest) };
}
