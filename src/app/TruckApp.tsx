import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ui, useLang } from '../i18n';
import { LANGS } from '../sql-core/feedback';
import { orderLine, PROTOTYPE_ORDERS } from '../sql-core/truck/orders';
import { TRUCK_W } from '../game/truck/truckArt';
import { TruckBridge, type FrontCustomer } from '../game/truck/truckBridge';

/** Food truck v2 (GAME_DESIGN.md §14), opened with `?truck` while v1 stays the default. */
export function TruckApp() {
  const [lang, setLang] = useLang();
  const t = ui[lang];
  const bridge = useMemo(() => new TruckBridge(), []);
  const parentRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [front, setFront] = useState<FrontCustomer | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

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

  return (
    <div className="truck-app">
      <header className="truck-hud">
        <span className="truck-title">🚚 Rolling Roast</span>
        <div className="truck-hud-right">
          {import.meta.env.DEV && (
            <button className="hud-button" disabled={!front} onClick={() => bridge.emit('serve', true)}>
              {t.truckServeTest}
            </button>
          )}
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
        {front && order && (
          <OrderBubble key={order.id} parent={parentRef} front={front} label={t.truckOrder} text={orderLine(order, lang)} />
        )}
      </div>
    </div>
  );
}

/** The front customer's request, in a speech bubble above their head (follows the canvas zoom). */
function OrderBubble({
  parent,
  front,
  label,
  text,
}: {
  parent: React.RefObject<HTMLDivElement | null>;
  front: FrontCustomer;
  label: string;
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
    <div className="order-bubble" role="status" aria-label={label} style={{ left: pos.left, bottom: pos.bottom }}>
      {text}
    </div>
  );
}
