import { BADGES, UPGRADES, canBuy, type BadgeId, type UpgradeId } from './growth';
import type { Progress } from './progress';
import type { UiText } from '../i18n';

/** The upgrade shop (GAME_DESIGN.md §9): opened from the coin counter. */
export function Shop({ progress, t, onBuy }: { progress: Progress; t: UiText; onBuy: (id: UpgradeId) => void }) {
  return (
    <>
      <h2 className="world-modal-title">🛍️ {t.shop}</h2>
      <p className="world-modal-hint">{t.shopHint}</p>
      <p className="shop-balance">🪙 {progress.coins}</p>
      <ul className="shop-list">
        {UPGRADES.map((u) => {
          const owned = progress.upgrades.includes(u.id);
          return (
            <li key={u.id} className={owned ? 'shop-item owned' : 'shop-item'}>
              <span className="shop-icon" aria-hidden="true">
                {u.icon}
              </span>
              <span className="shop-text">
                <strong>{t.upgradeNames[u.id]}</strong>
                <span>{t.upgradeInfo[u.id]}</span>
              </span>
              {owned ? (
                <span className="shop-owned">{t.owned}</span>
              ) : (
                <button className="secondary-button" disabled={!canBuy(progress, u.id)} onClick={() => onBuy(u.id)}>
                  {t.buy(u.cost)}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** All badges in the Journal: earned ones in colour, the rest faded with what earns them. */
export function Badges({ earned, t }: { earned: readonly BadgeId[]; t: UiText }) {
  return (
    <ul className="badge-list">
      {BADGES.map((b) => (
        <li key={b.id} className={earned.includes(b.id) ? 'badge earned' : 'badge'}>
          <span className="badge-icon" aria-hidden="true">
            {b.icon}
          </span>
          <strong>{t.badgeNames[b.id]}</strong>
          <span>{t.badgeInfo[b.id]}</span>
        </li>
      ))}
    </ul>
  );
}

/** A short "Badge earned!" toast at the top of the world. */
export function BadgeToast({ badge, t }: { badge: BadgeId; t: UiText }) {
  const icon = BADGES.find((b) => b.id === badge)?.icon;
  return (
    <div className="badge-toast" role="status">
      <span className="badge-icon" aria-hidden="true">
        {icon}
      </span>
      <span>
        <strong>{t.badgeEarned}</strong> {t.badgeNames[badge]}
      </span>
    </div>
  );
}
