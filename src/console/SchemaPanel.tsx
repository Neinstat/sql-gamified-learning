type Table = { table: string; columns: { name: string; type: string }[] };

export function SchemaPanel({ tables }: { tables: Table[] }) {
  return (
    <aside className="schema">
      <h2 className="schema-title">Tables</h2>
      {tables.map((t) => (
        <div key={t.table} className="schema-table">
          <p className="schema-table-name">{t.table}</p>
          <ul className="schema-columns">
            {t.columns.map((c) => (
              <li key={c.name}>
                <span>{c.name}</span>
                <span className="schema-type">{c.type}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
