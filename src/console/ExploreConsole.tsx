import { useMemo, useState } from 'react';
import type { CafeDatabase, QueryResult } from '../sql-core/db';
import { runQuery } from '../sql-core/db';
import { formatFeedback, type Lang } from '../sql-core/feedback';
import type { StationId } from '../sql-core/stations';
import type { UiText } from '../i18n';
import { ResultTable } from './ResultTable';
import { SchemaPanel, type Table } from './SchemaPanel';
import { SqlEditor } from './SqlEditor';
import { WithCode } from './WithCode';

type Props = {
  db: CafeDatabase;
  /** The tables this object can see; queries run as its station, so others are refused. */
  station: StationId;
  schema: Table[];
  lang: Lang;
  t: UiText;
};

/**
 * Looking around with one object in the truck (the fridge, the menu board…): run any query on its
 * tables. Nothing is graded — this is where players check things before answering an order.
 */
export function ExploreConsole({ db, station, schema, lang, t }: Props) {
  const starter = schema[0] ? `SELECT *\nFROM ${schema[0].table}\nLIMIT 10;` : '';
  const [sql, setSql] = useState(starter);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);

  const completionSchema = useMemo(
    () => Object.fromEntries(schema.map((tbl) => [tbl.table, tbl.columns.map((c) => c.name)])),
    [schema],
  );

  async function run() {
    if (running) return;
    setRunning(true);
    try {
      setResult(await runQuery(db, sql, station));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="console">
      <SchemaPanel tables={schema} title={t.tables} />
      <section className="workspace">
        <SqlEditor initialValue={starter} onChange={setSql} onRun={run} schema={completionSchema} label="SQL" />
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
        </div>
        {result && !result.ok && (
          <p className="feedback feedback-wrong" role="status">
            <WithCode text={formatFeedback(result.error, lang)} />
          </p>
        )}
        {result?.ok && <ResultTable columns={result.columns} rows={result.rows} rowsLabel={t.rows} shownLabel={t.rowsShown} />}
      </section>
    </div>
  );
}
