import { useEffect, useMemo, useRef, useState } from 'react';
import { ui, useLang } from '../i18n';
import { LANGS } from '../sql-core/feedback';
import { orderLine } from '../sql-core/truck/orders';
import { TruckBridge } from '../game/truck/truckBridge';
import { useTruckShift } from './useTruckShift';

/** The 3D food truck prototype (GAME_DESIGN.md §14.8), opened with `?truck3d`. */
export function Truck3DApp() {
  const [lang, setLang] = useLang();
  const t = ui[lang];
  const bridge = useMemo(() => new TruckBridge(), []);
  const parentRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [aimed, setAimed] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const { front, order, tabletOpen, tablet, toastView } = useTruckShift(bridge, lang, t);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => bridge.on('locked', setLocked), [bridge]);
  useEffect(() => bridge.on('hover', setAimed), [bridge]);
  useEffect(() => bridge.on('anchor', setAnchor), [bridge]);

  useEffect(() => {
    let cancelled = false;
    let game: { destroy: () => void } | null = null;
    import('../game/truck3d/Truck3DGame').then(({ Truck3DGame }) => {
      if (cancelled || !parentRef.current) return;
      game = new Truck3DGame(parentRef.current, bridge);
      if (import.meta.env.DEV) (window as unknown as { __truck3d?: unknown }).__truck3d = game;
      setReady(true);
    });
    return () => {
      cancelled = true;
      game?.destroy();
    };
  }, [bridge]);

  return (
    <div className="truck-app">
      <header className="truck-hud">
        <span className="truck-title">🚚 Rolling Roast · 3D</span>
        <span className="truck-controls">{t.truck3dControls}</span>
        <div className="lang-switch" role="group" aria-label={t.language}>
          {LANGS.map((code) => (
            <button
              key={code}
              className={code === lang ? 'lang-button active' : 'lang-button'}
              aria-pressed={code === lang}
              onClick={() => setLang(code)}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <div className="truck-view truck3d-view" ref={parentRef}>
        {!ready && (
          <div className="world-loading" role="status">
            <p className="world-loading-title">SQL Valley</p>
            <div className="loading-bar" aria-hidden="true" />
          </div>
        )}
        {ready && !tabletOpen && (
          <>
            <div className={aimed ? 'crosshair crosshair-on' : 'crosshair'} aria-hidden="true" />
            {aimed && <p className="aim-label">E · {t.truckThings[aimed]}</p>}
          </>
        )}
        {ready && !tabletOpen && !locked && (
          <div className="truck3d-start" aria-hidden="true">
            <p className="truck3d-start-title">🖱 {t.truck3dStart}</p>
            <p className="truck3d-start-hint">{t.truck3dStartHint}</p>
          </div>
        )}
        {front && order && anchor && !tabletOpen && (
          <div
            className="order-bubble"
            role="status"
            aria-label={t.truckOrder}
            style={{ left: `${anchor.x * 100}%`, bottom: `${(1 - anchor.y) * 100}%` }}
          >
            <p className="order-bubble-text">{orderLine(order, lang)}</p>
            <p className="order-bubble-hint">📱 {t.truck3dAnswer}</p>
          </div>
        )}
        {toastView}
        {tablet}
      </div>
    </div>
  );
}
