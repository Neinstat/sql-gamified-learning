import { useEffect, useState } from 'react';
import type { SoWhat } from '../sql-core/levels';
import type { UiText } from '../i18n';

type Props = {
  soWhat: SoWhat;
  /** Who asks, e.g. "Grandma". */
  speaker: string;
  t: UiText;
  onDone: () => void;
};

/**
 * "So what?" (GAME_DESIGN.md §5): after reporting, the character asks what the result means.
 * Any choice shows the explanation; it never blocks progress.
 */
export function SoWhatCard({ soWhat, speaker, t, onDone }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  useEffect(() => {
    if (!answered) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === 'Escape') {
        event.preventDefault();
        onDone();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answered, onDone]);

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
              <strong>{picked === soWhat.answer ? t.soWhatRight : t.soWhatWrong}</strong> {soWhat.explanation}
            </p>
            <button className="primary-button" onClick={onDone} autoFocus>
              {t.continue}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
