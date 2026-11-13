import { useEffect, useState } from 'react';
import type { CafeDatabase } from '../sql-core/db';
import type { Lang } from '../sql-core/feedback';
import type { Level } from '../sql-core/levels';
import type { UiText } from '../i18n';
import { Console } from '../console/Console';
import type { Table } from '../console/SchemaPanel';
import { Hints, Lesson } from './LevelParts';

type Props = {
  stationName: string;
  level: Level;
  db: CafeDatabase | null;
  /** Set when the database could not be opened. */
  dbError: string | null;
  /** Only the tables this station can see. */
  schema: Table[];
  lang: Lang;
  t: UiText;
  /** false = kept mounted but hidden, so the player's query survives closing and reopening. */
  visible: boolean;
  hintsUsed: number;
  onRevealHint: () => void;
  onCorrect: () => void;
  /** Shown after a correct answer, e.g. "Nice work! Go tell Grandma." */
  solvedMessage: string;
  onClose: () => void;
};

/** The SQL console opened at a station, over the game world. */
export function ConsoleOverlay(props: Props) {
  const { stationName, level, db, dbError, schema, lang, t, visible, hintsUsed, onRevealHint, onCorrect, solvedMessage, onClose } =
    props;
  const [solved, setSolved] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      // Let the editor use Escape first (e.g. to close autocomplete).
      if (event.key === 'Escape' && !event.defaultPrevented) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  return (
    <div className="console-overlay" hidden={!visible}>
      <section className="console-panel" role="dialog" aria-label={stationName}>
        <header className="console-panel-header">
          <h2 className="console-panel-title">{stationName}</h2>
          <button className="close-button" onClick={onClose} aria-label={t.dialogueClose}>
            ✕
          </button>
        </header>

        <div className="task">
          <span className="task-label">{t.task}</span>
          <p className="task-text">{level.task}</p>
          {level.lesson && (
            <button className="link-button" onClick={() => setLessonOpen((o) => !o)}>
              {lessonOpen ? t.hideLesson : t.showLesson}
            </button>
          )}
          {lessonOpen && level.lesson && <Lesson lesson={level.lesson} />}
        </div>

        <Hints hints={level.hints} used={hintsUsed} onReveal={onRevealHint} t={t} />

        {db ? (
          <Console
            db={db}
            schema={schema}
            level={level}
            lang={lang}
            t={t}
            onCorrect={() => {
              setSolved(true);
              onCorrect();
            }}
            solvedPanel={
              solved && (
                <div className="solved">
                  <p className="solved-message">{solvedMessage}</p>
                  <button className="primary-button" onClick={onClose}>
                    {t.backToCafe}
                  </button>
                </div>
              )
            }
          />
        ) : dbError ? (
          <div className="feedback feedback-wrong" role="alert">
            <p>
              {t.loadError} {dbError}
            </p>
            <button className="primary-button" onClick={() => window.location.reload()}>
              {t.retry}
            </button>
          </div>
        ) : (
          <div className="db-loading" role="status">
            <div className="loading-bar" aria-hidden="true" />
            <p className="loading">{t.loading}</p>
          </div>
        )}
      </section>
    </div>
  );
}
