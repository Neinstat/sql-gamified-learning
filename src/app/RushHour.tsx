import { useEffect, useMemo, useState } from 'react';
import type { CafeDatabase } from '../sql-core/db';
import { checkAnswer, type CheckOutcome } from '../sql-core/checker';
import { formatFeedback, type Lang } from '../sql-core/feedback';
import { RUSH_SECONDS, RUSH_STATION, rushPoints, rushPool, shuffled, type RushRequest } from '../sql-core/rushHour';
import { rushHourId } from '../sql-core/levels/locales/id/rushHour';
import type { UiText } from '../i18n';
import { SchemaPanel, type Table } from '../console/SchemaPanel';
import { SqlEditor } from '../console/SqlEditor';
import { WithCode } from '../console/WithCode';

type Props = {
  db: CafeDatabase | null;
  schema: Table[];
  lang: Lang;
  t: UiText;
  /** The chapter the player has reached: decides which requests can come up. */
  reached: number;
  best: number;
  /** A round ended with this score (the app keeps the best one). */
  onFinish: (score: number) => void;
  onClose: () => void;
};

type Phase = 'intro' | 'playing' | 'over';

/**
 * Rush Hour (GAME_DESIGN.md §5): quick requests against the clock. Points for each correct answer,
 * more for answers in a row; skipping breaks the run.
 */
export function RushHour({ db, schema, lang, t, reached, best, onFinish, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [queue, setQueue] = useState<RushRequest[]>([]);
  const [served, setServed] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(RUSH_SECONDS);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [sql, setSql] = useState('');
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const [flash, setFlash] = useState<number | null>(null);
  const [finalBest, setFinalBest] = useState(best);
  /** The best score before this round, to tell a new personal best. */
  const [bestBefore, setBestBefore] = useState(best);
  const request = queue[0];
  const completion = useMemo(
    () => Object.fromEntries(schema.map((tbl) => [tbl.table, tbl.columns.map((c) => c.name)])),
    [schema],
  );

  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  function end() {
    setPhase('over');
    setFinalBest(Math.max(best, score));
    onFinish(score);
  }

  useEffect(() => {
    if (phase === 'playing' && secondsLeft <= 0) end();
    // end() only reads the current round's values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && phase !== 'playing') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, onClose]);

  function start() {
    setQueue(shuffled(rushPool(reached)));
    setServed(0);
    setSecondsLeft(RUSH_SECONDS);
    setScore(0);
    setCombo(0);
    setOutcome(null);
    setSql('');
    setBestBefore(best);
    setPhase('playing');
  }

  /** Next customer: the queue refills (reshuffled) when everyone has been served. */
  function next() {
    setQueue((q) => (q.length > 1 ? q.slice(1) : shuffled(rushPool(reached))));
    setServed((n) => n + 1);
    setOutcome(null);
    setSql('');
  }

  async function run() {
    if (!db || !request || running || phase !== 'playing') return;
    setRunning(true);
    try {
      const result = await checkAnswer(db, sql, request.solution, {}, RUSH_STATION);
      setOutcome(result);
      if (result.verdict.correct) {
        const points = rushPoints(combo + 1);
        setScore((s) => s + points);
        setCombo((c) => c + 1);
        setFlash(points);
        setTimeout(() => setFlash(null), 900);
        next();
      }
    } finally {
      setRunning(false);
    }
  }

  function skip() {
    setCombo(0);
    next();
  }

  const prompt = request ? (lang === 'id' ? (rushHourId[request.id] ?? request.prompt) : request.prompt) : '';
  const minutes = Math.floor(Math.max(0, secondsLeft) / 60);
  const seconds = String(Math.max(0, secondsLeft) % 60).padStart(2, '0');

  return (
    <div className="console-overlay">
      <section className="console-panel" role="dialog" aria-label={t.rushHour}>
        <header className="console-panel-header">
          <h2 className="console-panel-title">⏱ {t.rushHour}</h2>
          {/* During a round, ✕ ends it early (the score still counts). */}
          <button className="close-button" onClick={phase === 'playing' ? end : onClose} aria-label={t.dialogueClose}>
            ✕
          </button>
        </header>

        {phase === 'intro' && (
          <div className="skill-result">
            <p>{t.rushIntro(RUSH_SECONDS / 60)}</p>
            <p className="shop-balance">🏆 {t.rushBest(best)}</p>
            <button className="primary-button" onClick={start} disabled={!db} autoFocus>
              {t.rushStart}
            </button>
          </div>
        )}

        {phase === 'playing' && request && (
          <>
            <div className="rush-bar" role="status">
              <span className={secondsLeft <= 15 ? 'rush-time low' : 'rush-time'}>
                ⏱ {minutes}:{seconds}
              </span>
              <span>⭐ {score}</span>
              {combo > 1 && <span className="rush-combo">🔥 ×{combo}</span>}
              {flash && <span className="rush-flash">+{flash}</span>}
            </div>
            <div className="task">
              <span className="task-label">{t.rushCustomer(served + 1)}</span>
              <p className="task-text">{prompt}</p>
            </div>
            <div className="console">
              <SchemaPanel tables={schema} title={t.tables} />
              <section className="workspace">
                <SqlEditor
                  key={`${request.id}-${served}`}
                  initialValue=""
                  onChange={setSql}
                  onRun={run}
                  schema={completion}
                  label="SQL"
                />
                <div className="toolbar">
                  <button className="run-button" onClick={run} disabled={running}>
                    {running ? t.running : t.run}
                  </button>
                  <span className="shortcut">{t.shortcut}</span>
                  <button className="link-button" onClick={skip}>
                    {t.rushSkip}
                  </button>
                </div>
                {outcome && !outcome.verdict.correct && (
                  <p className="feedback feedback-wrong" role="status">
                    <WithCode text={formatFeedback(outcome.verdict.feedback, lang)} />
                  </p>
                )}
              </section>
            </div>
          </>
        )}

        {phase === 'over' && (
          <div className="skill-result">
            <p className="skill-result-title">{t.rushOver(score)}</p>
            <p className="shop-balance">{score > bestBefore ? `🏆 ${t.rushNewBest}` : `🏆 ${t.rushBest(finalBest)}`}</p>
            <div className="welcome-actions">
              <button className="primary-button" onClick={start} autoFocus>
                {t.rushAgain}
              </button>
              <button className="secondary-button" onClick={onClose}>
                {t.backToCafe}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
