import { useEffect, useState } from 'react';
import type { UiText } from '../i18n';

type Props = {
  speaker: string;
  lines: string[];
  /** The player's possible replies, each with what the speaker answers. */
  replies: { label: string; answer: string }[];
  /** The button after the answer (e.g. "Open the case"). */
  openLabel: string;
  /** The talk is over: go on to what comes next. */
  onDone: () => void;
  /** Walked away (Esc or ✕): the speaker keeps waiting. */
  onClose: () => void;
  t: UiText;
};

/**
 * A short talk at the bottom of the screen (GAME_DESIGN.md §4): the speaker's lines one by one,
 * then the player picks a reply, hears the answer, and moves on.
 * Keys: Space / Enter / E for the next line, 1–3 to pick a reply, Esc to walk away.
 */
export function TalkBox({ speaker, lines, replies, openLabel, onDone, onClose, t }: Props) {
  const [step, setStep] = useState(0);
  const [reply, setReply] = useState<number | null>(null);
  const choosing = step >= lines.length && reply === null;
  const answered = reply !== null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      // A held key (e.g. the E that opened the door) must not skip lines.
      if (event.repeat) return;
      const next = event.key === ' ' || event.key === 'Enter' || event.code === 'KeyE';
      if (choosing) {
        const n = Number(event.key);
        if (n >= 1 && n <= replies.length) setReply(n - 1);
      } else if (answered && next) {
        event.preventDefault();
        onDone();
      } else if (next) {
        event.preventDefault();
        setStep((s) => s + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choosing, answered, replies.length, onDone, onClose]);

  const line = answered ? replies[reply].answer : lines[Math.min(step, lines.length - 1)];

  return (
    <div className="talk-box" role="dialog" aria-label={speaker}>
      <div className="talk-head">
        <p className="talk-speaker">{speaker}</p>
        <button className="close-button" onClick={onClose} aria-label={t.dialogueClose}>
          ✕
        </button>
      </div>
      {answered && <p className="talk-you">“{replies[reply].label}”</p>}
      <p className="talk-line" aria-live="polite">
        {line}
      </p>
      {choosing ? (
        <div className="talk-replies">
          {replies.map((r, i) => (
            <button key={r.label} className="talk-reply" onClick={() => setReply(i)}>
              <kbd>{i + 1}</kbd> {r.label}
            </button>
          ))}
        </div>
      ) : answered ? (
        <button className="primary-button talk-next" onClick={onDone}>
          {openLabel}
        </button>
      ) : (
        <button className="secondary-button talk-next" onClick={() => setStep((s) => s + 1)}>
          {t.talkNext} ▸
        </button>
      )}
    </div>
  );
}
