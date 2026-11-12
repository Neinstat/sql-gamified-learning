import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { sql, PostgreSQL } from '@codemirror/lang-sql';

type Props = {
  initialValue: string;
  onChange: (value: string) => void;
  onRun: () => void;
  /** Table → column names, for autocomplete. */
  schema: Record<string, string[]>;
  label: string;
};

/** SQL editor with syntax highlighting and table/column autocomplete. */
export function SqlEditor({ initialValue, onChange, onRun, schema, label }: Props) {
  const host = useRef<HTMLDivElement>(null);
  // Keep the latest callbacks without recreating the editor.
  const callbacks = useRef({ onChange, onRun });
  callbacks.current = { onChange, onRun };

  useEffect(() => {
    const view = new EditorView({
      parent: host.current!,
      doc: initialValue,
      extensions: [
        basicSetup,
        EditorView.lineWrapping,
        sql({ dialect: PostgreSQL, schema, upperCaseKeywords: true }),
        Prec.highest(
          keymap.of([
            {
              key: 'Mod-Enter',
              run: () => {
                callbacks.current.onRun();
                return true;
              },
            },
          ]),
        ),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
        }),
        EditorView.contentAttributes.of({ 'aria-label': label }),
      ],
    });
    return () => view.destroy();
    // The editor is created once per mount; the parent remounts it for a new level.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="editor" ref={host} />;
}
