import { useMemo, useState, type ReactNode } from 'react';
import type { CafeDatabase } from '../sql-core/db';
import { checkAnswer, type CheckOutcome } from '../sql-core/checker';
import { formatFeedback, type Lang } from '../sql-core/feedback';
import type { RequestLevel } from '../sql-core/levels';
import type { UiText } from '../i18n';
import { ResultTable } from './ResultTable';
import { WithCode } from './WithCode';
import { SchemaPanel, type Table } from './SchemaPanel';
import { SqlEditor } from './SqlEditor';
import { BlockInput } from './BlockInput';
import { FillBlankInput } from './FillBlankInput';

type Props = {
  db: CafeDatabase;
  schema: Table[];
  level: RequestLevel;
  lang: Lang;
  t: UiText;
  /** Called once each time the player's answer is correct, with the wrong runs before it (for stars). */
  onCorrect: (mistakes: number) => void;
  /** Shown right under "Correct!" (above the result table), e.g. the next-level button. */
  solvedPanel?: ReactNode;
};

/**
 * The SQL console: table list, query input, Run, result and feedback.
 * The input depends on the level: word blocks, fill in the blanks, or the free-typing editor.
 */
export function Console({ db, schema, level, lang, t, onCorrect, solvedPanel }: Props) {
  const starter = level.input.kind === 'free' ? (level.input.starter ?? '') : '';
  const [sql, setSql] = useState(starter);
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const [crash, setCrash] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const completionSchema = useMemo(
    () => Object.fromEntries(schema.map((tbl) => [tbl.table, tbl.columns.map((c) => c.name)])),
    [schema],
  );

  async function run() {
    if (running) return;
    setRunning(true);
    try {
      const next = await checkAnswer(db, sql, level.solution, level.check, level.station);
      setOutcome(next);
      setCrash(null);
      if (next.verdict.correct) onCorrect(mistakes);
      // A query the player stopped isn't a wrong answer.
      else if (next.verdict.feedback.kind !== 'stopped') setMistakes((n) => n + 1);
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
        {level.input.kind === 'blocks' ? (
          <BlockInput blocks={level.input.blocks} onChange={setSql} t={t} />
        ) : level.input.kind === 'fill-blank' ? (
          <FillBlankInput template={level.input.template} onChange={setSql} onRun={run} t={t} />
        ) : (
          <SqlEditor
            initialValue={starter}
            onChange={setSql}
            onRun={run}
            schema={completionSchema}
            label="SQL"
          />
        )}
        <div className="toolbar">
          <button className="run-button" onClick={run} disabled={running}>
            {running ? t.running : t.run}
          </button>
          {running && db.stop && (
            <button className="secondary-button" onClick={() => db.stop?.()}>
              ■ {t.stop}
            </button>
          )}
          {level.input.kind === 'free' && <span className="shortcut">{t.shortcut}</span>}
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
        {result?.ok && <ResultTable columns={result.columns} rows={result.rows} rowsLabel={t.rows} shownLabel={t.rowsShown} />}
      </section>
    </div>
  );
}
