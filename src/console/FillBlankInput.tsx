import { useState } from 'react';
import { BLANK } from '../sql-core/levels';
import type { UiText } from '../i18n';

type Props = {
  /** Query with gaps; each `___` becomes a text box. */
  template: string;
  /** Called with the full query (template with the gaps filled in). */
  onChange: (sql: string) => void;
  /** Enter in a gap runs the query. */
  onRun: () => void;
  t: UiText;
};

/** Fill in the missing parts of a query (Chapter 1). */
export function FillBlankInput({ template, onChange, onRun, t }: Props) {
  const parts = template.split(BLANK);
  const [values, setValues] = useState<string[]>(() => parts.slice(1).map(() => ''));

  function update(index: number, value: string) {
    const next = values.map((v, i) => (i === index ? value : v));
    setValues(next);
    onChange(parts.reduce((acc, part, i) => acc + next[i - 1] + part));
  }

  return (
    <div className="fill-blank">
      <code className="fill-template">
        {parts.map((part, i) => (
          <span key={i}>
            {i > 0 && (
              <input
                className="fill-input"
                value={values[i - 1]}
                size={Math.max(6, values[i - 1].length + 1)}
                onChange={(e) => update(i - 1, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onRun();
                  }
                }}
                aria-label={t.blankLabel(i, parts.length - 1)}
                autoFocus={i === 1}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            )}
            {part}
          </span>
        ))}
      </code>
      <span className="shortcut">{t.fillHelp}</span>
    </div>
  );
}
