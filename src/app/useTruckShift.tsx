import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UiText } from '../i18n';
import type { Table } from '../console/SchemaPanel';
import { getSchema, type CafeDatabase } from '../sql-core/db';
import type { Lang } from '../sql-core/feedback';
import { getChapters, isCase, type Level } from '../sql-core/levels';
import { stationTables } from '../sql-core/stations';
import { PROTOTYPE_ORDERS, type TruckOrder } from '../sql-core/truck/orders';
import type { FrontCustomer, TruckBridge } from '../game/truck/bridge';
import { ConsoleOverlay } from './ConsoleOverlay';
import { getDatabase } from './database';

/**
 * A shift in the food truck: the database, the customer at the window and their order, the
 * tablet, and what using things in the truck does.
 */
export function useTruckShift(bridge: TruckBridge, lang: Lang, t: UiText) {
  const [db, setDb] = useState<CafeDatabase | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [schema, setSchema] = useState<Table[]>([]);
  const [front, setFront] = useState<FrontCustomer | null>(null);
  const [tabletOpen, setTabletOpen] = useState(false);
  const [solved, setSolved] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

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

  const order = front ? PROTOTYPE_ORDERS.find((o) => o.id === front.orderId) : undefined;
  const level = useMemo(() => (order ? findRequest(order.levelId, lang) : undefined), [order, lang]);

  // Each new order starts with a clean tablet.
  useEffect(() => {
    setSolved(false);
    setHintsUsed(0);
  }, [order?.id]);

  // A short message that fades on its own.
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openTablet = useCallback(() => {
    if (order) setTabletOpen(true);
  }, [order]);

  // The player used something in the truck.
  useEffect(
    () =>
      bridge.on('use', (id) => {
        if (id === 'tablet') openTablet();
        else setToast(t.truckSoon(t.truckThings[id]));
      }),
    [bridge, openTablet, t],
  );

  // Time stops while the tablet is open.
  useEffect(() => bridge.emit('pause', tabletOpen), [bridge, tabletOpen]);

  const closeTablet = useCallback(() => {
    setTabletOpen(false);
    // A solved order is handed over: the customer leaves and the next one steps up.
    if (solved) bridge.emit('serve', true);
  }, [bridge, solved]);

  const tablet =
    order && level ? (
      // Kept mounted while the same customer orders, so a half-written query survives closing.
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
    ) : null;

  const toastView = toast ? (
    <div className="truck-toast" role="status">
      {toast}
    </div>
  ) : null;

  return { front, order: order as TruckOrder | undefined, tabletOpen, tablet, toastView };
}

/** The order's level in the player's language (orders only use plain requests, never cases). */
function findRequest(levelId: string, lang: Lang): Level | undefined {
  const level = getChapters(lang)
    .flatMap((c) => c.levels)
    .find((l) => l.id === levelId);
  return level && !isCase(level) ? level : undefined;
}
