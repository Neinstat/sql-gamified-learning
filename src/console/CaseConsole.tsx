import { useMemo, useState } from 'react';
import { runQuery, type CafeDatabase, type QueryResult } from '../sql-core/db';
import { checkConclusion, type ConclusionVerdict, type GivenAnswer } from '../sql-core/cases';
import type { ResultSet } from '../sql-core/checker';
import { formatCaseFeedback, formatFeedback, type Lang } from '../sql-core/feedback';
import type { CaseLevel } from '../sql-core/levels';
import type { UiText } from '../i18n';
import { ResultTable } from './ResultTable';
import { WithCode } from './WithCode';
import { SchemaPanel, type Table } from './SchemaPanel';
import { SqlEditor } from './SqlEditor';

type Props = {
  db: CafeDatabase;
  schema: Table[];
  level: CaseLevel;
  lang: Lang;
  t: UiText;
  /** Every conclusion is backed by data. `wrongAnswers` = conclusions the data didn't support (for stars). */
  onSolved: (wrongAnswers: number) => void;
  /** Shown once every conclusion is accepted. */
  solvedPanel?: React.ReactNode;
};

type Pin = { id: number; sql: string; result: ResultSet };

/**
 * A Mini Case (GAME_DESIGN.md §5): run any queries, pin results to the notes,
 * then answer each conclusion with a pinned result as proof.
 */
export function CaseConsole({ db, schema, level, lang, t, onSolved, solvedPanel }: Props) {
  const [sql, setSql] = useState('');
  const [editor, setEditor] = useState({ key: 0, value: '' });
  const [result, setResult] = useState<QueryResult | null>(null);
  const [lastSql, setLastSql] = useState('');
  const [running, setRunning] = useState(false);
  const [pins, setPins] = useState<Pin[]>([]);
  const [nextPinId, setNextPinId] = useState(1);
  const [answers, setAnswers] = useState<GivenAnswer[]>(() => level.questions.map(() => null));
  const [evidence, setEvidence] = useState<(number | null)[]>(() => level.questions.map(() => null));
  const [verdicts, setVerdicts] = useState<(ConclusionVerdict | null)[]>(() => level.questions.map(() => null));
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [checking, setChecking] = useState<number | null>(null);

  const completionSchema = useMemo(
    () => Object.fromEntries(schema.map((tbl) => [tbl.table, tbl.columns.map((c) => c.name)])),
    [schema],
  );
  const solved = verdicts.every((v) => v?.correct);

  async function run() {
    if (running) return;
    setRunning(true);
    try {
      setResult(await runQuery(db, sql, level.station));
      setLastSql(sql);
    } finally {
      setRunning(false);
    }
  }

  function loadStarter(value: string) {
    setSql(value);
    setEditor((e) => ({ key: e.key + 1, value }));
  }

  const alreadyPinned = result?.ok && pins.some((p) => p.sql === lastSql);
  function pin() {
    if (!result?.ok || alreadyPinned) return;
    setPins((list) => [...list, { id: nextPinId, sql: lastSql, result: { columns: result.columns, rows: result.rows } }]);
    setNextPinId((n) => n + 1);
  }

  function unpin(id: number) {
    setPins((list) => list.filter((p) => p.id !== id));
    setEvidence((list) => list.map((e) => (e === id ? null : e)));
  }

  async function check(i: number) {
    if (checking !== null) return;
    setChecking(i);
    try {
      const pinned = pins.find((p) => p.id === evidence[i])?.result ?? null;
      const verdict = await checkConclusion(db, level.questions[i], answers[i], pinned);
      const nextVerdicts = verdicts.map((v, j) => (j === i ? verdict : v));
      setVerdicts(nextVerdicts);
      const wrong = !verdict.correct && verdict.feedback.kind === 'answer-wrong' ? wrongAnswers + 1 : wrongAnswers;
      setWrongAnswers(wrong);
      if (nextVerdicts.every((v) => v?.correct)) onSolved(wrong);
    } finally {
      setChecking(null);
    }
  }

  const setAt = <T,>(list: T[], i: number, value: T) => list.map((v, j) => (j === i ? value : v));

  return (
    <div className="console">
      <SchemaPanel tables={schema} title={t.tables} />
      <section className="workspace">
        <div className="case-starters">
          <span className="case-label">{t.starters}</span>
          {level.starters.map((starter, i) => (
            <button key={i} className="secondary-button" onClick={() => loadStarter(starter)} title={starter}>
              {t.starterLoad(i + 1)}
            </button>
          ))}
          <p className="case-help">{t.starterHelp}</p>
        </div>

        <SqlEditor
          key={editor.key}
          initialValue={editor.value}
          onChange={setSql}
          onRun={run}
          schema={completionSchema}
          label="SQL"
        />
        <div className="toolbar">
          <button className="run-button" onClick={run} disabled={running}>
            {running ? t.running : t.run}
          </button>
          {running && db.stop && (
            <button className="secondary-button" onClick={() => db.stop?.()}>
              ■ {t.stop}
            </button>
          )}
          <span className="shortcut">{t.shortcut}</span>
          {result?.ok && (
            <button className="secondary-button pin-button" onClick={pin} disabled={Boolean(alreadyPinned)}>
              {alreadyPinned ? t.pinned : t.pin}
            </button>
          )}
        </div>

        {result && !result.ok && (
          <p className="feedback feedback-wrong" role="status">
            <WithCode text={formatFeedback(result.error, lang)} />
          </p>
        )}
        {result?.ok && <ResultTable columns={result.columns} rows={result.rows} rowsLabel={t.rows} shownLabel={t.rowsShown} />}

        <section className="case-notes" aria-label={t.notes}>
          <h3 className="case-title">🗒 {t.notes}</h3>
          {pins.length === 0 ? (
            <p className="case-help">{t.notesEmpty}</p>
          ) : (
            <ul className="pin-list">
              {pins.map((p) => (
                <li key={p.id} className="pin">
                  <span className="pin-label">{t.pinLabel(p.id, p.result.rows.length)}</span>
                  <code className="pin-sql">{p.sql.trim()}</code>
                  <button className="pin-remove" onClick={() => unpin(p.id)} aria-label={t.unpin} title={t.unpin}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="case-conclusions" aria-label={t.conclusions}>
          <h3 className="case-title">🔍 {t.conclusions}</h3>
          <p className="case-help">{t.conclusionsHelp}</p>
          {level.questions.map((q, i) => {
            const verdict = verdicts[i];
            const done = verdict?.correct === true;
            return (
              <div key={i} className={done ? 'conclusion done' : 'conclusion'}>
                <p className="conclusion-prompt">
                  {i + 1}. {q.prompt}
                </p>
                {q.answer.kind === 'choice' ? (
                  <div className="conclusion-choices" role="radiogroup" aria-label={q.prompt}>
                    {q.answer.choices.map((choice, c) => (
                      <label key={c} className="conclusion-choice">
                        <input
                          type="radio"
                          name={`${level.id}-q${i}`}
                          checked={answers[i] === c}
                          disabled={done}
                          onChange={() => setAnswers((a) => setAt(a, i, c))}
                        />
                        {choice}
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    className="conclusion-input"
                    inputMode="decimal"
                    placeholder={t.answerPlaceholder}
                    aria-label={q.prompt}
                    value={answers[i] === null ? '' : String(answers[i])}
                    disabled={done}
                    onChange={(e) => setAnswers((a) => setAt(a, i, e.target.value))}
                  />
                )}
                <div className="conclusion-footer">
                  <label className="conclusion-evidence">
                    <span>{t.evidence}</span>
                    <select
                      value={evidence[i] ?? ''}
                      disabled={done}
                      onChange={(e) => setEvidence((list) => setAt(list, i, e.target.value ? Number(e.target.value) : null))}
                    >
                      <option value="">{t.chooseEvidence}</option>
                      {pins.map((p) => (
                        <option key={p.id} value={p.id}>
                          {t.pinLabel(p.id, p.result.rows.length)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {done ? (
                    <span className="conclusion-ok">✓ {t.backedByData}</span>
                  ) : (
                    <button className="secondary-button" onClick={() => check(i)} disabled={checking !== null}>
                      {t.check}
                    </button>
                  )}
                </div>
                {verdict && !verdict.correct && (
                  <p className="feedback feedback-wrong" role="status">
                    <WithCode text={formatCaseFeedback(verdict.feedback, lang)} />
                  </p>
                )}
              </div>
            );
          })}
          {solved && (
            <>
              <p className="feedback feedback-correct" role="status">
                ✓ {t.correct}
              </p>
              {solvedPanel}
            </>
          )}
        </section>
      </section>
    </div>
  );
}
