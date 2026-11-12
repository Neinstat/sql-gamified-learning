import type { CellValue } from '../sql-core/db';

type Props = {
  columns: string[];
  rows: CellValue[][];
};

export function ResultTable({ columns, rows }: Props) {
  return (
    <div className="result">
      <p className="result-count">
        {rows.length} {rows.length === 1 ? 'row' : 'rows'}
      </p>
      <div className="result-scroll">
        <table className="result-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className={cell === null ? 'cell-null' : undefined}>
                    {formatCell(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCell(value: CellValue): string {
  if (value === null || value === undefined) return 'NULL';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
