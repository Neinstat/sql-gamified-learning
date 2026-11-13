import { useEffect, useRef, useState } from 'react';
import type { UiText } from '../i18n';

/** Holds the Phaser canvas. Phaser is loaded on demand so classic mode never downloads it. */
export function GameView({ t }: { t: UiText }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;
    import('../game/createGame').then(({ createGame }) => {
      if (cancelled || !parentRef.current) return;
      game = createGame(parentRef.current);
      setReady(true);
    });
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);

  return (
    <div className="game-view" ref={parentRef}>
      {!ready && <p className="game-loading">{t.loadingWorld}</p>}
    </div>
  );
}
