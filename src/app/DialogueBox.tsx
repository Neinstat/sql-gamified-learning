import { useEffect, useMemo, useState } from 'react';
import { placeholderPortrait } from '../game/placeholderPortraits';
import type { UiText } from '../i18n';

type Props = {
  character: string;
  speaker: string;
  lines: string[];
  t: UiText;
  onClose: () => void;
};

/** A character speaking, one line at a time, over the game world. */
export function DialogueBox({ character, speaker, lines, t, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const portrait = useMemo(() => placeholderPortrait(character), [character]);
  const isLast = index >= lines.length - 1;

  const advance = () => (isLast ? onClose() : setIndex((i) => i + 1));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === ' ' || event.key === 'Enter' || event.key.toLowerCase() === 'e') {
        event.preventDefault();
        advance();
      } else if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="dialogue-box" role="dialog" aria-label={speaker} onClick={advance}>
      <img className="dialogue-portrait" src={portrait} alt="" width={64} height={64} />
      <div className="dialogue-body">
        <span className="speaker">{speaker}</span>
        <p className="dialogue-line" aria-live="polite">
          {lines[index]}
        </p>
        <div className="dialogue-footer">
          <span className="dialogue-hint">{t.dialogueHint}</span>
          <button
            className="primary-button dialogue-next"
            onClick={(event) => {
              event.stopPropagation();
              advance();
            }}
          >
            {isLast ? t.dialogueClose : t.dialogueNext}
          </button>
        </div>
      </div>
    </div>
  );
}
