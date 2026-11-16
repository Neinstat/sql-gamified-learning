import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ui, useLang, type UiText } from '../i18n';
import { getSchema, type CafeDatabase } from '../sql-core/db';
import { LANGS } from '../sql-core/feedback';
import { getChapters, isCase, type Level } from '../sql-core/levels';
import { stationTables } from '../sql-core/stations';
import { orderLine, PROTOTYPE_ORDERS } from '../sql-core/truck/orders';
import type { Table } from '../console/SchemaPanel';
import { TRUCK_W } from '../game/truck/truckArt';
import { TruckBridge, type FrontCustomer } from '../game/truck/truckBridge';
import { ConsoleOverlay } from './ConsoleOverlay';
import { getDatabase } from './database';

/** Food truck v2 (GAME_DESIGN.md §14), opened with `?truck` while v1 stays the default. */
export function TruckApp() {
  const [lang, setLang] = useLang();
  const t = ui[lang];
  const bridge = useMemo(() => new TruckBridge(), []);
  const parentRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [front, setFront] = useState<FrontCustomer | null>(null);
  const [db, setDb] = useState<CafeDatabase | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [schema, setSchema] = useState<Table[]>([]);
  const [tabletOpen, setTabletOpen] = useState(false);
  const [solved, setSolved] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Load the database in the background while the first customers walk up.
  useEffect(() => {
    getDatabase()
      .then(async (database) => {
        setSchema(await getSchema(database));
        setDb(database);
      })
      .catch((err) => setDbError(String(err)));
  }, []);

  useEffect(() => bridge.on('front', setFront), [bridge]);

  useEffect(() => {
    let cancelled = false;
    let game: { destroy: (removeCanvas: boolean) => void } | null = null;
    import('../game/truck/createTruckGame').then(({ createTruckGame }) => {
      if (cancelled || !parentRef.current) return;
      game = createTruckGame(parentRef.current, bridge);
      if (import.meta.env.DEV) (window as unknown as { __game?: unknown }).__game = game;
      setReady(true);
    });
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, [bridge]);

  const order = front ? PROTOTYPE_ORDERS.find((o) => o.id === front.orderId) : undefined;
  const level = useMemo(() => (order ? findRequest(order.levelId, lang) : undefined), [order, lang]);

  // Each new order starts with a clean tablet.
  useEffect(() => {
    setSolved(false);
    setHintsUsed(0);
  }, [order?.id]);

  const openTablet = useCallback(() => {
    if (order) setTabletOpen(true);
  }, [order]);

  useEffect(() => bridge.on('tablet', openTablet), [bridge, openTablet]);

  // Time stops while the tablet is open.
  useEffect(() => bridge.emit('pause', tabletOpen), [bridge, tabletOpen]);

  const closeTablet = useCallback(() => {
    setTabletOpen(false);
    // A solved order is handed over: the customer leaves and the next one steps up.
    if (solved) bridge.emit('serve', true);
  }, [bridge, solved]);

  return (
    <div className="truck-app">
      <header className="truck-hud">
        <span className="truck-title">🚚 Rolling Roast</span>
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
        {front && order && !tabletOpen && (
          <OrderBubble key={`bubble-${order.id}`} parent={parentRef} front={front} t={t} text={orderLine(order, lang)} onAnswer={openTablet} />
        )}
        {/* Kept mounted while the same customer orders, so a half-written query survives closing. */}
        {order && level && (
          <ConsoleOverlay
            key={`tablet-${order.id}`}
            stationName={t.truckTablet(t.stations[level.station])}
            level={level}
            db={db}
            dbError={dbError}
            schema={stationTables(level.station, schema)}
            lang={lang}
            t={t}
            visible={tabletOpen}
            hintsUsed={hintsUsed}
            onRevealHint={() => setHintsUsed((n) => n + 1)}
            onCorrect={() => setSolved(true)}
            reward={null}
            solvedMessage={t.truckServed}
            doneLabel={t.truckServe}
            onClose={closeTablet}
          />
        )}
      </div>
    </div>
  );
}

/** The order's level in the player's language (orders only use plain requests, never cases). */
function findRequest(levelId: string, lang: 'en' | 'id'): Level | undefined {
  const level = getChapters(lang)
    .flatMap((c) => c.levels)
    .find((l) => l.id === levelId);
  return level && !isCase(level) ? level : undefined;
}

/** The front customer's request, in a speech bubble above their head (follows the canvas zoom). */
function OrderBubble({
  parent,
  front,
  t,
  text,
  onAnswer,
}: {
  parent: React.RefObject<HTMLDivElement | null>;
  front: FrontCustomer;
  t: UiText;
  text: string;
  onAnswer: () => void;
}) {
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);

  useLayoutEffect(() => {
    const host = parent.current;
    if (!host) return;
    const place = () => {
      const canvas = host.querySelector('canvas');
      if (!canvas) return;
      const box = canvas.getBoundingClientRect();
      const hostBox = host.getBoundingClientRect();
      const scale = box.width / TRUCK_W;
      setPos({
        left: box.left - hostBox.left + front.x * scale,
        bottom: hostBox.bottom - (box.top + front.y * scale) + 6,
      });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(host);
    return () => observer.disconnect();
  }, [parent, front]);

  if (!pos) return null;
  return (
    <div className="order-bubble" role="status" aria-label={t.truckOrder} style={{ left: pos.left, bottom: pos.bottom }}>
      <p className="order-bubble-text">{text}</p>
      <button className="order-bubble-button" onClick={onAnswer}>
        📱 {t.truckAnswer}
      </button>
    </div>
  );
}
