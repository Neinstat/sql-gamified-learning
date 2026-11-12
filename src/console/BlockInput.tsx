import { useState } from 'react';
import type { UiText } from '../i18n';

type Props = {
  /** Every block offered, in display order (may include distractors). */
  blocks: string[];
  /** Called with the query built so far (blocks joined by spaces). */
  onChange: (sql: string) => void;
  t: UiText;
};

/**
 * Build a query by tapping word blocks (Chapter 0).
 * Tap a block in the tray to add it; tap a placed block to send it back.
 * Clicks instead of drag-and-drop: works the same with mouse, touch and keyboard.
 */
export function BlockInput({ blocks, onChange, t }: Props) {
  // Indexes into `blocks`, in the order the player placed them.
  const [placed, setPlaced] = useState<number[]>([]);

  function update(next: number[]) {
    setPlaced(next);
    onChange(next.map((i) => blocks[i]).join(' '));
  }

  return (
    <div className="blocks">
      <div className="block-answer" aria-label={t.blocksAnswer}>
        {placed.length === 0 && <span className="block-placeholder">{t.blocksEmpty}</span>}
        {placed.map((blockIndex, position) => (
          <button
            key={blockIndex}
            className="block block-placed"
            onClick={() => update(placed.filter((_, p) => p !== position))}
          >
            {blocks[blockIndex]}
          </button>
        ))}
      </div>

      <div className="block-tray" aria-label={t.blocksTray}>
        {blocks.map((block, i) => {
          const used = placed.includes(i);
          return (
            <button
              key={i}
              className="block"
              disabled={used}
              onClick={() => update([...placed, i])}
            >
              {block}
            </button>
          );
        })}
      </div>

      <div className="block-footer">
        <span className="shortcut">{t.blocksHelp}</span>
        {placed.length > 0 && (
          <button className="link-button" onClick={() => update([])}>
            {t.blocksClear}
          </button>
        )}
      </div>
    </div>
  );
}
