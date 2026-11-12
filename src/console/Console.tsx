import { useMemo, useState, type ReactNode } from 'react';
import type { CafeDatabase } from '../sql-core/db';
import { checkAnswer, type CheckOutcome } from '../sql-core/checker';
import { formatFeedback, type Lang } from '../sql-core/feedback';
import type { Level } from '../sql-core/levels';
import type { UiText } from '../i18n';
import { ResultTable } from './ResultTable';
import { SchemaPanel, type Table } from './SchemaPanel';
import { SqlEditor } from './SqlEditor';

type Props = {
  db: CafeDatabase;
  schema: Table[];
  level: Level;
  lang: Lang;
  t: UiText;
  /** Called once each time the player's answer is correct. */
  onCorrect: () => void;
  /** Shown right under "Correct!" (above the result table), e.g. the next-level button. */
  solvedPanel?: ReactNode;
};

/**
 * The SQL console: table list, editor, Run, result and feedback.
 * For now every level uses the free-typing editor; block and
 * fill-in-the-blank input arrive in the next steps.
 */
export function Console({ db, schema, level, lang, t, onCorrect, solvedPanel }: Props) {
  const starter = level.input.kind === 'free' ? (level.input.starter ?? '') : '';
  const [sql, setSql] = useState(starter);
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const [crash, setCrash] = useState<string | null>(null);

  const completionSchema = useMemo(
    () => Object.fromEntries(schema.map((tbl) => [tbl.table, tbl.columns.map((c) => c.name)])),
    [schema],
  );

  async function run() {
    if (running) return;
    setRunning(true);
    try {
      const next = await checkAnswer(db, sql, level.solution, level.check);
      setOutcome(next);
      setCrash(null);
      if (next.verdict.correct) onCorrect();
    } catch (err) {
      // Only happens when the level's own solution is broken.
      setCrash(String(err));
    } finally {
      setRunning(false);
    }
  }

  const result = outcome?.result;
  const verdict = outcome?.verdict;

  return (
    <div className="console">
      <SchemaPanel tables={schema} title={t.tables} />
      <section className="workspace">
        <SqlEditor
          initialValue={starter}
          onChange={setSql}
          onRun={run}
          schema={completionSchema}
          label="SQL"
        />
        <div className="toolbar">
          <button className="run-button" onClick={run} disabled={running}>
            {running ? t.running : t.run}
          </button>
          <span className="shortcut">{t.shortcut}</span>
        </div>

        {crash && <p className="feedback feedback-wrong">{crash}</p>}
        {verdict && !verdict.correct && (
          <p className="feedback feedback-wrong" role="status">
            <WithCode text={formatFeedback(verdict.feedback, lang)} />
          </p>
        )}
        {verdict?.correct && (
          <>
            <p className="feedback feedback-correct" role="status">
              ✓ {t.correct}
            </p>
            {solvedPanel}
          </>
        )}
        {result?.ok && <ResultTable columns={result.columns} rows={result.rows} rowsLabel={t.rows} />}
      </section>
    </div>
  );
}

/** Show `backtick` parts of a message as code. */
function WithCode({ text }: { text: string }) {
  return (
    <>
      {text.split(/`([^`]+)`/).map((part, i) => (i % 2 === 1 ? <code key={i}>{part}</code> : part))}
    </>
  );
}
