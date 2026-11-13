import { useEffect, type ReactNode } from 'react';

type Props = {
  label: string;
  children: ReactNode;
  /** Main button; Enter also presses it. */
  action: string;
  onAction: () => void;
  /** Optional ✕ in the corner (Escape also uses it). */
  onClose?: () => void;
  closeLabel?: string;
};

/** A card in the middle of the screen over the game world (lesson, new chapter, journal). */
export function WorldModal({ label, children, action, onAction, onClose, closeLabel }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        onAction();
      } else if (event.key === 'Escape') {
        (onClose ?? onAction)();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onAction, onClose]);

  return (
    <div className="world-modal-backdrop">
      <section className="world-modal" role="dialog" aria-label={label}>
        {onClose && (
          <button className="close-button world-modal-close" onClick={onClose} aria-label={closeLabel}>
            ✕
          </button>
        )}
        {children}
        <button className="primary-button" onClick={onAction}>
          {action}
        </button>
      </section>
    </div>
  );
}
