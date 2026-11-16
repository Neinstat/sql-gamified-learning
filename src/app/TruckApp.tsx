import { useEffect, useRef, useState } from 'react';

/** Food truck v2 (GAME_DESIGN.md §14), opened with `?truck` while v1 stays the default. */
export function TruckApp() {
  const parentRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;
    import('../game/truck/createTruckGame').then(({ createTruckGame }) => {
      if (cancelled || !parentRef.current) return;
      game = createTruckGame(parentRef.current);
      if (import.meta.env.DEV) (window as unknown as { __game?: unknown }).__game = game;
      setReady(true);
    });
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);

  return (
    <div className="truck-app">
      <div className="truck-view" ref={parentRef}>
        {!ready && (
          <div className="world-loading" role="status">
            <p className="world-loading-title">SQL Valley</p>
            <div className="loading-bar" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
