import { useEffect, useMemo, useState } from 'react';
import type { CafeDatabase } from '../sql-core/db';
import { checkAnswer, type CheckOutcome } from '../sql-core/checker';
import { formatFeedback, type Lang } from '../sql-core/feedback';
import { SKILL_CHECK_STATION, SKILL_CHAPTERS, nextQuestion, startingChapter } from '../sql-core/skillCheck';
import { skillCheckId } from '../sql-core/levels/locales/id/skillCheck';
import type { UiText } from '../i18n';
import { SchemaPanel, type Table } from '../console/SchemaPanel';
import { SqlEditor } from '../console/SqlEditor';
import { ResultTable } from '../console/ResultTable';
import { WithCode } from '../console/WithCode';

type Props = {
  db: CafeDatabase | null;
  /** The tables the Skill Check can use (the cash register's). */
  schema: Table[];
  lang: Lang;
  t: UiText;
  /** Chapter titles by id, in the player's language. */
  chapterTitle: (id: number) => string | null;
  onFinish: (startChapter: number) => void;
  onCancel: () => void;
};

/**
 * The Skill Check (GAME_DESIGN.md §2): two questions per chapter, stopping at the first miss.
 * The result is the chapter the player starts in.
 */
export function SkillCheck({ db, schema, lang, t, chapterTitle, onFinish, onCancel }: Props) {
  const [answered, setAnswered] = useState<Map<string, boolean>>(new Map());
  const [sql, setSql] = useState('');
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const question = nextQuestion(answered);
  const right = useMemo(() => new Set([...answered].filter(([, ok]) => ok).map(([id]) => id)), [answered]);
  const start = startingChapter(right);
  const solved = outcome?.verdict.correct === true;
  const completion = useMemo(
    () => Object.fromEntries(schema.map((tbl) => [tbl.table, tbl.columns.map((c) => c.name)])),
    [schema],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  async function run() {
    if (!db || !question || running || solved) return;
    setRunning(true);
    try {
      setOutcome(await checkAnswer(db, sql, question.solution, {}, SKILL_CHECK_STATION));
    } finally {
      setRunning(false);
    }
  }

  function answer(ok: boolean) {
    if (!question) return;
    setAnswered((map) => new Map(map).set(question.id, ok));
    setOutcome(null);
    setSql('');
  }

  const inChapter = question ? [...answered.keys()].filter((id) => id.startsWith(`sc${question.chapter}-`)).length : 0;
  const prompt = question ? (lang === 'id' ? (skillCheckId[question.id] ?? question.prompt) : question.prompt) : '';
  const startTitle = chapterTitle(start);

  return (
    <div className="console-overlay">
      <section className="console-panel" role="dialog" aria-label={t.skillCheck}>
        <header className="console-panel-header">
          <h2 className="console-panel-title">🎓 {t.skillCheck}</h2>
          <button className="close-button" onClick={onCancel} aria-label={t.dialogueClose}>
            ✕
          </button>
        </header>

        <ol className="skill-steps" aria-hidden="true">
          {SKILL_CHAPTERS.map((chapter) => {
            const ids = [...answered].filter(([id]) => id.startsWith(`sc${chapter}-`));
            const state = ids.some(([, ok]) => !ok)
              ? 'missed'
              : ids.length === 2
                ? 'passed'
                : question?.chapter === chapter
                  ? 'now'
                  : '';
            return (
              <li key={chapter} className={`skill-step ${state}`}>
                {chapter}
              </li>
            );
          })}
        </ol>

        {question ? (
          <>
            <div className="task">
              <span className="task-label">{t.skillQuestion(question.chapter, inChapter + 1)}</span>
              <p className="task-text">{prompt}</p>
              <p className="case-help">{t.skillCheckIntro}</p>
            </div>
            <div className="console">
              <SchemaPanel tables={schema} title={t.tables} />
              <section className="workspace">
                <SqlEditor
                  key={question.id}
                  initialValue=""
                  onChange={setSql}
                  onRun={run}
                  schema={completion}
                  label="SQL"
                />
                <div className="toolbar">
                  <button className="run-button" onClick={run} disabled={!db || running || solved}>
                    {running ? t.running : t.run}
                  </button>
                  {solved ? (
                    <button className="primary-button" onClick={() => answer(true)} autoFocus>
                      {t.skillNext}
                    </button>
                  ) : (
                    <button className="link-button" onClick={() => answer(false)}>
                      {t.skillDontKnow}
                    </button>
                  )}
                </div>
                {!db && <p className="loading">{t.loading}</p>}
                {outcome && !outcome.verdict.correct && (
                  <p className="feedback feedback-wrong" role="status">
                    <WithCode text={formatFeedback(outcome.verdict.feedback, lang)} />
                  </p>
                )}
                {solved && (
                  <p className="feedback feedback-correct" role="status">
                    ✓ {t.correct}
                  </p>
                )}
                {outcome?.result.ok && (
                  <ResultTable
                    columns={outcome.result.columns}
                    rows={outcome.result.rows}
                    rowsLabel={t.rows}
                    shownLabel={t.rowsShown}
                  />
                )}
              </section>
            </div>
          </>
        ) : (
          <div className="skill-result">
            <p className="skill-result-title">{startTitle ? t.skillResult(start, startTitle) : t.skillAllDone}</p>
            {start > 0 && <p>{t.skillSkippedNote}</p>}
            <button className="primary-button" onClick={() => onFinish(start)} autoFocus>
              {t.skillStart}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
