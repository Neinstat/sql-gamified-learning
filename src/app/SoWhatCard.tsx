import { useEffect, useState } from 'react';
import type { SoWhat } from '../sql-core/levels';
import type { UiText } from '../i18n';

type Props = {
  soWhat: SoWhat;
  /** Who asks, e.g. "Grandma". */
  speaker: string;
  t: UiText;
  /** Coins for a right answer (0 once it has been paid). */
  bonus: number;
  onDone: (right: boolean) => void;
};

/**
 * "So what?" (GAME_DESIGN.md §5): after reporting, the character asks what the result means.
 * Any choice shows the explanation; it never blocks progress.
 */
export function SoWhatCard({ soWhat, speaker, t, bonus, onDone }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const right = picked === soWhat.answer;

  useEffect(() => {
    if (!answered) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === 'Escape') {
        event.preventDefault();
        onDone(right);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, right, onDone]);

  return (
    <div className="world-modal-backdrop">
      <section className="world-modal" role="dialog" aria-label={t.soWhat}>
        <span className="case-label">
          💭 {t.soWhat} · {speaker}
        </span>
        <p className="so-what-question">{soWhat.question}</p>
        <div className="so-what-choices">
          {soWhat.choices.map((choice, i) => {
            const state = !answered ? '' : i === soWhat.answer ? ' right' : i === picked ? ' wrong' : '';
            return (
              <button key={i} className={`so-what-choice${state}`} disabled={answered} onClick={() => setPicked(i)}>
                {choice}
              </button>
            );
          })}
        </div>
        {answered && (
          <>
            <p className="so-what-explanation" role="status">
              <strong>{right ? t.soWhatRight : t.soWhatWrong}</strong> {soWhat.explanation}
            </p>
            {right && bonus > 0 && <p className="reward-coins so-what-bonus">{t.coinsBonus(bonus)}</p>}
            <button className="primary-button" onClick={() => onDone(right)} autoFocus>
              {t.continue}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
