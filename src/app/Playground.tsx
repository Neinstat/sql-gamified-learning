import { useEffect, useState } from 'react';
import { getSchema, runQuery, type CafeDatabase, type QueryResult } from '../sql-core/db';
import { ResultTable } from '../console/ResultTable';
import { SchemaPanel } from '../console/SchemaPanel';
import { getDatabase } from './database';

type Schema = Awaited<ReturnType<typeof getSchema>>;

/** Temporary free-form SQL page (Phase 1, step 2). Becomes the real console later. */
export function Playground() {
  const [db, setDb] = useState<CafeDatabase | null>(null);
  const [schema, setSchema] = useState<Schema>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sql, setSql] = useState('SELECT * FROM menu_items;');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    getDatabase()
      .then(async (database) => {
        setDb(database);
        setSchema(await getSchema(database));
      })
      .catch((err) => setLoadError(String(err)));
  }, []);

  async function run() {
    if (!db || running) return;
    setRunning(true);
    setResult(await runQuery(db, sql));
    setRunning(false);
  }

  if (loadError) return <p className="error">Could not open the café records: {loadError}</p>;
  if (!db) return <p className="loading">Opening Grandma's records…</p>;

  return (
    <div className="playground">
      <SchemaPanel tables={schema} />
      <section className="workspace">
        <textarea
          className="editor"
          value={sql}
          spellCheck={false}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              run();
            }
          }}
          aria-label="SQL query"
        />
        <div className="toolbar">
          <button className="run-button" onClick={run} disabled={running}>
            {running ? 'Running…' : 'Run'}
          </button>
          <span className="shortcut">or press Ctrl/⌘ + Enter</span>
        </div>
        {result && !result.ok && <p className="error">{result.error}</p>}
        {result && result.ok && <ResultTable columns={result.columns} rows={result.rows} />}
      </section>
    </div>
  );
}
