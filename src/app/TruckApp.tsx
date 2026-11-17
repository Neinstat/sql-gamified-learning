import { useEffect, useMemo, useRef, useState } from 'react';
import { ui, useLang } from '../i18n';
import { LANGS } from '../sql-core/feedback';
import { orderLine } from '../sql-core/truck/orders';
import { TruckBridge, type LensCard } from '../game/truck/bridge';
import { STATIONS } from '../sql-core/stations';
import { DataLens, useTableSummaries } from './DataLens';
import { useTruckShift } from './useTruckShift';

/** Every table in the truck, for the Data Lens cards. */
const ALL_TABLES = [...new Set(Object.values(STATIONS).flatMap((s) => s.tables))];

/** SQL Valley: the food truck, first person in 3D (GAME_DESIGN.md §14). */
export function TruckApp() {
  const [lang, setLang] = useLang();
  const t = ui[lang];
  const bridge = useMemo(() => new TruckBridge(), []);
  const parentRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [aimed, setAimed] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const { front, order, answerWhere, orderTables, db, consoleOpen, overlays } = useTruckShift(bridge, lang, t);
  const [lens, setLens] = useState(false);
  const [lensCards, setLensCards] = useState<LensCard[]>([]);
  const summaries = useTableSummaries(lens ? db : null, ALL_TABLES);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => bridge.on('locked', setLocked), [bridge]);
  useEffect(() => bridge.on('hover', setAimed), [bridge]);
  useEffect(() => bridge.on('anchor', setAnchor), [bridge]);
  // The Data Lens: L in the game, or the button; the game dissolves the view and places the cards.
  useEffect(() => bridge.on('lensKey', () => setLens((on) => !on)), [bridge]);
  useEffect(() => bridge.on('lensCards', setLensCards), [bridge]);
  useEffect(() => bridge.emit('lens', lens), [bridge, lens, ready]);

  useEffect(() => {
    let cancelled = false;
    let game: { destroy: () => void } | null = null;
    import('../game/truck/TruckGame').then(({ TruckGame }) => {
      if (cancelled || !parentRef.current) return;
      game = new TruckGame(parentRef.current, bridge);
      if (import.meta.env.DEV) (window as unknown as { __truck?: unknown }).__truck = game;
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
        <span className="truck-title">🚚 Rolling Roast</span>
        <span className="truck-controls">{t.truckControls}</span>
        <button
          className={lens ? 'lens-button lens-button-on' : 'lens-button'}
          aria-pressed={lens}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setLens((on) => !on)}
          title={t.lensHint}
        >
          🔍 {t.dataLens} <kbd>L</kbd>
        </button>
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
      <div className="truck-view" ref={parentRef}>
        {!ready && (
          <div className="world-loading" role="status">
            <p className="world-loading-title">SQL Valley</p>
            <div className="loading-bar" aria-hidden="true" />
          </div>
        )}
        {ready && !consoleOpen && lens && (
          <DataLens cards={lensCards} summaries={summaries} needed={orderTables} t={t} />
        )}
        {ready && !consoleOpen && (
          <>
            <div className={aimed ? 'crosshair crosshair-on' : 'crosshair'} aria-hidden="true" />
            {aimed && <p className="aim-label">E · {t.truckThings[aimed]}</p>}
          </>
        )}
        {ready && !consoleOpen && !locked && (
          <div className="truck-start" aria-hidden="true">
            <p className="truck-start-title">🖱 {t.truckStart}</p>
            <p className="truck-start-hint">{t.truckStartHint}</p>
          </div>
        )}
        {front && order && anchor && !consoleOpen && (
          <div
            className="order-bubble"
            role="status"
            aria-label={t.truckOrder}
            style={{ left: `${anchor.x * 100}%`, bottom: `${(1 - anchor.y) * 100}%` }}
          >
            <p className="order-bubble-text">{orderLine(order, lang)}</p>
            {answerWhere && <p className="order-bubble-hint">👉 {t.truckAnswerAt(answerWhere)}</p>}
          </div>
        )}
        {overlays}
      </div>
    </div>
  );
}
