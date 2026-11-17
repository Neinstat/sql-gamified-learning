import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ui, useLang, type UiText } from '../i18n';
import { LANGS } from '../sql-core/feedback';
import { orderLine } from '../sql-core/truck/orders';
import { PANELS, START_PANEL, TRUCK_W } from '../game/truck/truckArt';
import { TruckBridge, type FrontCustomer } from '../game/truck/truckBridge';
import { useTruckShift } from './useTruckShift';

/** Food truck v2 (GAME_DESIGN.md §14), opened with `?truck` while v1 stays the default. */
export function TruckApp() {
  const [lang, setLang] = useLang();
  const t = ui[lang];
  const bridge = useMemo(() => new TruckBridge(), []);
  const parentRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [scrollX, setScrollX] = useState(0);
  const [artLabels, setArtLabels] = useState(false);
  const [panel, setPanel] = useState(START_PANEL);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => bridge.on('view', setScrollX), [bridge]);
  useEffect(() => bridge.on('panel', setPanel), [bridge]);
  useEffect(() => bridge.on('hover', setHovered), [bridge]);
  useEffect(() => bridge.emit('artLabels', artLabels), [bridge, artLabels, ready]);

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

  const { front, order, tabletOpen, tablet, toastView } = useTruckShift(bridge, lang, t);

  return (
    <div className="truck-app">
      <header className="truck-hud">
        <span className="truck-title">🚚 Rolling Roast</span>
        <span className="truck-controls">{t.truckControls}</span>
        <div className="truck-hud-right">
          <button
            className={artLabels ? 'hud-button active' : 'hud-button'}
            title={t.truckArtTitle}
            aria-pressed={artLabels}
            onClick={() => setArtLabels((on) => !on)}
          >
            🏷 {t.truckArt}
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
          <OrderBubble
            key={`bubble-${order.id}`}
            parent={parentRef}
            front={front}
            scrollX={scrollX}
            t={t}
            text={orderLine(order, lang)}
          />
        )}
        {ready && !tabletOpen && (
          <>
            <p className="truck-side-name" aria-live="polite">
              {hovered ? `👆 ${t.truckThings[hovered]}` : t.truckSides[PANELS[panel]]}
            </p>
            <TurnButton
              dir={-1}
              label={t.truckTurnLeft}
              next={panel > 0 ? t.truckSides[PANELS[panel - 1]] : null}
              alert={!!front && panel > 1 ? t.truckWaiting : null}
              onClick={() => bridge.emit('look', -1)}
            />
            <TurnButton
              dir={1}
              label={t.truckTurnRight}
              next={panel < PANELS.length - 1 ? t.truckSides[PANELS[panel + 1]] : null}
              alert={!!front && panel < 1 ? t.truckWaiting : null}
              onClick={() => bridge.emit('look', 1)}
            />
          </>
        )}
        {toastView}
        {tablet}
      </div>
    </div>
  );
}

/** The front customer's request, in a speech bubble above their head (follows the canvas zoom). */
function OrderBubble({
  parent,
  front,
  scrollX,
  t,
  text,
}: {
  parent: React.RefObject<HTMLDivElement | null>;
  front: FrontCustomer;
  /** World x of the screen's left edge (the camera follows the player). */
  scrollX: number;
  t: UiText;
  text: string;
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
        left: box.left - hostBox.left + (front.x - scrollX) * scale,
        bottom: hostBox.bottom - (box.top + front.y * scale) + 6,
      });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(host);
    return () => observer.disconnect();
  }, [parent, front, scrollX]);

  if (!pos) return null;
  return (
    <div className="order-bubble" role="status" aria-label={t.truckOrder} style={{ left: pos.left, bottom: pos.bottom }}>
      <p className="order-bubble-text">{text}</p>
      <p className="order-bubble-hint">📱 {t.truckAnswer}</p>
    </div>
  );
}

/** ‹ / › at the edge of the screen: turn to the next side (with a "!" when a customer waits that way). */
function TurnButton({
  dir,
  label,
  next,
  alert,
  onClick,
}: {
  dir: -1 | 1;
  label: string;
  /** The side you would turn to (null at the end of the truck). */
  next: string | null;
  alert: string | null;
  onClick: () => void;
}) {
  if (!next) return null;
  return (
    <button
      className={`truck-turn ${dir < 0 ? 'truck-turn-left' : 'truck-turn-right'}`}
      onClick={onClick}
      aria-label={`${label}: ${next}${alert ? `. ${alert}` : ''}`}
      title={alert ?? next}
    >
      <span aria-hidden="true">{dir < 0 ? '‹' : '›'}</span>
      <span className="truck-turn-name" aria-hidden="true">
        {next}
      </span>
      {alert && (
        <span className="truck-turn-alert" aria-hidden="true">
          !
        </span>
      )}
    </button>
  );
}
