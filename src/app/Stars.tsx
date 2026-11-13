import type { UiText } from '../i18n';
import type { Reward } from './rewards';

/** ★★☆: filled stars out of three. */
export function Stars({ count, t, small = false }: { count: number; t: UiText; small?: boolean }) {
  return (
    <span className={small ? 'stars stars-small' : 'stars'} role="img" aria-label={t.starsLabel(count)}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= count ? 'star filled' : 'star'} aria-hidden="true">
          {n <= count ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

/** After a correct answer: the stars, the coins earned, and how to get more stars. */
export function RewardLine({ reward, isCase, t }: { reward: Reward; isCase: boolean; t: UiText }) {
  const tip =
    reward.stars === 3
      ? t.starsPerfect
      : reward.stars === 1
        ? t.starsTipHints
        : isCase
          ? t.starsTipConclusions
          : t.starsTipRuns;
  return (
    <div className="reward">
      <Stars count={reward.stars} t={t} />
      {reward.coins > 0 && <span className="reward-coins">+{reward.coins} 🪙</span>}
      <p className="reward-tip">
        {tip}
        {reward.best > reward.stars && ` ${t.starsBest(reward.best)}`}
      </p>
    </div>
  );
}
