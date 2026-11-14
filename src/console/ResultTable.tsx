import type { CellValue } from '../sql-core/db';

type Props = {
  columns: string[];
  rows: CellValue[][];
  rowsLabel: (n: number) => string;
  /** "Showing the first 200 of 7694 rows" */
  shownLabel?: (shown: number, total: number) => string;
};

/** Big results (the sales table has thousands of rows) only show their first rows, so the page stays quick. */
export const MAX_SHOWN_ROWS = 200;

export function ResultTable({ columns, rows, rowsLabel, shownLabel }: Props) {
  const shown = rows.length > MAX_SHOWN_ROWS ? rows.slice(0, MAX_SHOWN_ROWS) : rows;
  return (
    <div className="result">
      <p className="result-count">
        {rowsLabel(rows.length)}
        {shown.length < rows.length && shownLabel && <span className="result-shown"> · {shownLabel(shown.length, rows.length)}</span>}
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
            {shown.map((row, r) => (
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
