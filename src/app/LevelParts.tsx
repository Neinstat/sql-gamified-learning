import type { Level } from '../sql-core/levels';
import type { UiText } from '../i18n';

/* Pieces of a level shown in the game world's overlays. */

/** Hints are revealed one at a time: general direction → clause → almost the answer. */
export function Hints({ hints, used, onReveal, t }: { hints: string[]; used: number; onReveal: () => void; t: UiText }) {
  return (
    <div className="hints">
      {hints.slice(0, used).map((hint, i) => (
        <p key={i} className="hint">
          <span className="hint-label">💡 {t.hintTitle(i + 1)}</span> {hint}
        </p>
      ))}
      {used < hints.length && (
        <button className="link-button" onClick={onReveal}>
          {t.hintButton(used, hints.length)}
        </button>
      )}
    </div>
  );
}

export function Lesson({ lesson }: { lesson: NonNullable<Level['lesson']> }) {
  return (
    <section className="lesson">
      <h3 className="lesson-title">📘 {lesson.title}</h3>
      {lesson.body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {lesson.example && <pre className="lesson-example">{lesson.example}</pre>}
    </section>
  );
}
