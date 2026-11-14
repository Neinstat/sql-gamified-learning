import { describe, expect, it } from 'vitest';
import { emptyProgress, markCompleted, type Progress } from './progress';
import { buyUpgrade, canBuy, currentStreak, earnedBadges, localDay, recordPlay } from './growth';

const rich = (coins: number): Progress => ({ ...emptyProgress, coins });

describe('upgrades', () => {
  it('cost coins and can be bought once', () => {
    let p = buyUpgrade(rich(100), 'more-plants');
    expect(p.coins).toBe(60);
    expect(p.upgrades).toEqual(['more-plants']);
    expect(canBuy(p, 'more-plants')).toBe(false);
    p = buyUpgrade(p, 'more-plants');
    expect(p.coins).toBe(60);
  });

  it("can't be bought without enough coins", () => {
    const p = rich(30);
    expect(canBuy(p, 'more-plants')).toBe(false);
    expect(buyUpgrade(p, 'more-plants')).toBe(p);
  });
});

describe('daily streak', () => {
  it('grows one per day, ignores a second play on the same day, and restarts after a gap', () => {
    let p = recordPlay(emptyProgress, '2026-11-10');
    p = recordPlay(p, '2026-11-10');
    expect(p.streak).toEqual({ count: 1, lastDay: '2026-11-10', best: 1 });
    p = recordPlay(p, '2026-11-11');
    p = recordPlay(p, '2026-11-12');
    expect(p.streak.count).toBe(3);
    p = recordPlay(p, '2026-11-15');
    expect(p.streak).toEqual({ count: 1, lastDay: '2026-11-15', best: 3 });
  });

  it('counts across a month end', () => {
    const p = recordPlay(recordPlay(emptyProgress, '2026-10-31'), '2026-11-01');
    expect(p.streak.count).toBe(2);
  });

  it('shows the streak only while it is alive (played today or yesterday)', () => {
    const p = recordPlay(emptyProgress, '2026-11-10');
    expect(currentStreak(p, '2026-11-10')).toBe(1);
    expect(currentStreak(p, '2026-11-11')).toBe(1);
    expect(currentStreak(p, '2026-11-12')).toBe(0);
  });

  it('uses the local calendar day', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});

describe('badges', () => {
  it('are earned from progress', () => {
    expect(earnedBadges(emptyProgress)).toEqual([]);
    let p = markCompleted(emptyProgress, 'ch0-1', 0, 0);
    expect(earnedBadges(p)).toEqual(['first-query']);
    p = markCompleted(p, 'ch1-7', 1, 0);
    expect(earnedBadges(p)).toContain('first-case');
    p = buyUpgrade({ ...p, coins: 500 }, 'cosy-rug');
    expect(earnedBadges(p)).toContain('shopkeeper');
  });
});
