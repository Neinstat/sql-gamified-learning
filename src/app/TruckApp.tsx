import { useEffect, useMemo, useRef, useState } from 'react';
import { ui, useLang } from '../i18n';
import { LANGS } from '../sql-core/feedback';
import { orderLine } from '../sql-core/truck/orders';
import { TruckBridge, type LensCard } from '../game/truck/bridge';
import { STATIONS } from '../sql-core/stations';
import { DataLens, useTableSummaries } from './DataLens';
import { placeOnScreen } from './overlayLayout';
import { restartDay, startNextDay, useTruckShift } from './useTruckShift';
import { DaySummary } from './DaySummary';
import { CLOSING, formatClock } from '../sql-core/truck/day';

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
  // The 3D view's size in pixels, to keep the bubble and the lens cards on screen.
  const [view, setView] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const measure = () => setView({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const { front, order, answerWhere, orderTables, db, day, orders, past, dayDone, knocking, mood, patienceLeft, consoleOpen, openTable, overlays } =
    useTruckShift(bridge, lang, t);
  // The orders served before this page load: the game skips those customers.
  /** Closing time, or the day ended early because nobody else is coming. */
  const shut = day.clock >= CLOSING || dayDone;
  const startOnLoad = useRef({
    orders: orders.map((o) => ({ id: o.id, look: o.look })),
    handled: [...day.served.map((s) => s.orderId), ...day.missed],
    clock: day.clock,
    managerDone: day.manager !== null,
  });
  const [lens, setLens] = useState(false);
  const [lensCards, setLensCards] = useState<LensCard[]>([]);
  const summaries = useTableSummaries(lens ? db : null, ALL_TABLES, day.served.length);

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
      game = new TruckGame(parentRef.current, bridge, startOnLoad.current);
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
        <span className={shut ? 'truck-clock truck-clock-closed' : 'truck-clock'} title={t.clockTitle}>
          🕙 {formatClock(day.clock)}
          {shut && ` · ${t.closedLabel}`}
        </span>
        <span className="truck-day" title={t.dayTitle}>
          📅 {t.dayLabel(past.length + 1, day.date, day.served.length, day.orders.length)}
        </span>
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
        {ready && knocking && !consoleOpen && !dayDone && (
          <p className="knock-alert" role="status">
            🚪 {t.knockAlert}
          </p>
        )}
        {ready && dayDone && !front && !consoleOpen && (
          <DaySummary
            db={db}
            day={day}
            past={past}
            dateLabel={t.dateLabel(day.date)}
            lang={lang}
            t={t}
            onNewDay={() => startNextDay(past, day)}
            onReplay={() => restartDay(day)}
          />
        )}
        {ready && !consoleOpen && lens && (
          <>
            <DataLens cards={lensCards} summaries={summaries} needed={orderTables} view={view} onOpen={openTable} t={t} />
            <p className="lens-hint">🔍 {t.lensClickHint}</p>
          </>
        )}
        {ready && !consoleOpen && !dayDone && (
          <>
            <div className={aimed ? 'crosshair crosshair-on' : 'crosshair'} aria-hidden="true" />
            {aimed && <p className="aim-label">E · {t.truckThings[aimed]}</p>}
          </>
        )}
        {ready && !consoleOpen && !locked && !dayDone && !lens && (
          <div className="truck-start" aria-hidden="true">
            <p className="truck-start-title">🖱 {t.truckStart}</p>
            <p className="truck-start-hint">{t.truckStartHint}</p>
          </div>
        )}
        {front && order && anchor && !consoleOpen && !lens && view.width > 0 && (
          <div
            className="order-bubble"
            role="status"
            aria-label={t.truckOrder}
            style={bubbleStyle(anchor, view.width, view.height)}
          >
            {mood && patienceLeft !== null && (
              <p className={`order-mood order-mood-${mood}`} title={t.moodLabels[mood]}>
                <span aria-hidden="true">{t.moods[mood]}</span>
                <span className="order-patience" aria-label={t.moodLabels[mood]}>
                  <span style={{ width: `${Math.round(patienceLeft * 100)}%` }} />
                </span>
              </p>
            )}
            <p className="order-bubble-text">{orderLine(order, lang)}</p>
            {answerWhere && <p className="order-bubble-hint">👉 {t.truckAnswerAt(answerWhere)}</p>}
          </div>
        )}
        {overlays}
      </div>
    </div>
  );
}

/** The order bubble: a fixed width, kept on screen, with its tail pointing at the customer's head. */
const BUBBLE_WIDTH = 288;
function bubbleStyle(anchor: { x: number; y: number }, viewWidth: number, viewHeight: number): React.CSSProperties {
  const width = Math.min(BUBBLE_WIDTH, viewWidth * 0.8);
  const { centre, tail } = placeOnScreen(anchor.x * viewWidth, width, viewWidth);
  return {
    left: centre,
    width,
    bottom: viewHeight * (1 - anchor.y),
    ['--tail' as string]: `${tail}px`,
  };
}

