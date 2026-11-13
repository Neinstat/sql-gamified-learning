import { useEffect, useRef, useState } from 'react';
import type { UiText } from '../i18n';
import type { GameBridge } from '../game/bridge';

/** Holds the Phaser canvas. Phaser is loaded on demand so classic mode never downloads it. */
export function GameView({ t, bridge }: { t: UiText; bridge: GameBridge }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;
    import('../game/createGame').then(({ createGame }) => {
      if (cancelled || !parentRef.current) return;
      game = createGame(parentRef.current, bridge);
      // Development only: lets the browser console inspect the running game.
      if (import.meta.env.DEV) (window as unknown as { __game?: unknown }).__game = game;
      setReady(true);
    });
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [bridge]);

  return (
    <div className="game-view" ref={parentRef}>
      {!ready && (
        <div className="world-loading" role="status">
          <p className="world-loading-title">SQL Valley</p>
          <div className="loading-bar" aria-hidden="true" />
          <p className="world-loading-text">{t.loadingWorld}</p>
        </div>
      )}
    </div>
  );
}
