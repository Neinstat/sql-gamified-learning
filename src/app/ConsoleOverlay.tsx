import { useEffect, useState } from 'react';
import type { CafeDatabase } from '../sql-core/db';
import type { Lang } from '../sql-core/feedback';
import { isCase, type Level } from '../sql-core/levels';
import type { UiText } from '../i18n';
import { Console } from '../console/Console';
import { CaseConsole } from '../console/CaseConsole';
import type { Table } from '../console/SchemaPanel';
import { Hints, Lesson } from './LevelParts';
import { RewardLine } from './Stars';
import type { Reward } from './rewards';

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
  /** Correct: `mistakes` = wrong runs (request) or wrong conclusions (Mini Case). */
  onCorrect: (mistakes: number) => void;
  /** Shown after a correct answer. */
  solvedMessage: string;
  /** Stars and coins from the last correct answer. */
  reward: Reward | null;
  onClose: () => void;
  /** Text on the button after solving (default: back to the truck). */
  doneLabel?: string;
  /** Who is asking, and what they say, shown above the task (e.g. The Manager). */
  speech?: { speaker: string; lines: string[] };
  /** Start with the lesson card open (a concept the player meets for the first time). */
  lessonOpen?: boolean;
  /** A short note under the task (e.g. why the player writes more of the query this time). */
  note?: string;
};

/** The SQL console (the truck's tablet), over the game world. */
export function ConsoleOverlay(props: Props) {
  const {
    stationName,
    level,
    db,
    dbError,
    schema,
    lang,
    t,
    visible,
    hintsUsed,
    onRevealHint,
    onCorrect,
    solvedMessage,
    reward,
    onClose,
    doneLabel,
    speech,
  } = props;
  const [solved, setSolved] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(props.lessonOpen ?? false);

  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent) => {
      // Let the editor use Escape first (e.g. to close autocomplete).
      if (event.key === 'Escape' && !event.defaultPrevented) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  const solvedPanelContent = (
    <div className="solved">
      {reward && <RewardLine reward={reward} isCase={isCase(level)} t={t} />}
      <p className="solved-message">{solvedMessage}</p>
      <button className="primary-button" onClick={onClose}>
        {doneLabel ?? t.backToTruck}
      </button>
    </div>
  );

  return (
    <div className="console-overlay" hidden={!visible}>
      <section className="console-panel" role="dialog" aria-label={stationName}>
        <header className="console-panel-header">
          <h2 className="console-panel-title">{stationName}</h2>
          <button className="close-button" onClick={onClose} aria-label={t.dialogueClose}>
            ✕
          </button>
        </header>

        {speech && (
          <blockquote className="console-speech">
            <p className="console-speech-who">{speech.speaker}</p>
            {speech.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </blockquote>
        )}

        <div className="task">
          <span className="task-label">{t.task}</span>
          <p className="task-text">{level.task}</p>
          {props.note && <p className="task-note">{props.note}</p>}
          {level.lesson && (
            <button className="link-button" onClick={() => setLessonOpen((o) => !o)}>
              {lessonOpen ? t.hideLesson : t.showLesson}
            </button>
          )}
          {lessonOpen && level.lesson && <Lesson lesson={level.lesson} />}
        </div>

        <Hints hints={level.hints} used={hintsUsed} onReveal={onRevealHint} t={t} />

        {db && isCase(level) ? (
          <CaseConsole
            db={db}
            schema={schema}
            level={level}
            lang={lang}
            t={t}
            onSolved={(wrongConclusions) => {
              setSolved(true);
              onCorrect(wrongConclusions);
            }}
            solvedPanel={solved && solvedPanelContent}
          />
        ) : db && !isCase(level) ? (
          <Console
            db={db}
            schema={schema}
            level={level}
            lang={lang}
            t={t}
            onCorrect={(mistakes) => {
              setSolved(true);
              onCorrect(mistakes);
            }}
            solvedPanel={solved && solvedPanelContent}
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
