import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UiText } from '../i18n';
import { ExploreConsole } from '../console/ExploreConsole';
import type { Table } from '../console/SchemaPanel';
import { getSchema, type CafeDatabase } from '../sql-core/db';
import type { Lang } from '../sql-core/feedback';
import { isCase, type RequestLevel } from '../sql-core/levels';
import { stationTables, tablesInQuery } from '../sql-core/stations';
import { findOrderLevel } from '../sql-core/truck/levels';
import { OBJECT_STATION, objectForStation, type TruckObjectId } from '../sql-core/truck/objects';
import { PROTOTYPE_ORDERS, type TruckOrder } from '../sql-core/truck/orders';
import type { FrontCustomer, TruckBridge } from '../game/truck/bridge';
import { ConsoleOverlay } from './ConsoleOverlay';
import { getDatabase } from './database';

/**
 * A shift in the food truck (GAME_DESIGN.md §4): the database, the customer at the window and
 * their order, and what using each object in the truck does:
 * - the object the order needs (tablet, fridge, recipe binders) opens the order's console;
 * - any other object with data opens a "look around" console on its own tables, ungraded;
 * - the back door has nothing yet (The Manager comes in 4.11).
 */
export function useTruckShift(bridge: TruckBridge, lang: Lang, t: UiText) {
  const [db, setDb] = useState<CafeDatabase | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [schema, setSchema] = useState<Table[]>([]);
  const [front, setFront] = useState<FrontCustomer | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [exploring, setExploring] = useState<TruckObjectId | null>(null);
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
  const level = useMemo(() => {
    const found = order ? findOrderLevel(order.levelId, lang) : undefined;
    return found && !isCase(found) ? (found as RequestLevel) : undefined;
  }, [order, lang]);
  /** Where the current order is answered. */
  const orderObject = level ? objectForStation(level.station) : null;

  // Each new order starts with a clean console.
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

  // The player used something in the truck.
  useEffect(
    () =>
      bridge.on('use', (id) => {
        if (order && id === orderObject) setOrderOpen(true);
        else if (OBJECT_STATION[id]) setExploring(id);
        else setToast(t.truckDoor);
      }),
    [bridge, order, orderObject, t],
  );

  // Time stops while a console is open.
  const open = orderOpen || exploring !== null;
  useEffect(() => bridge.emit('pause', open), [bridge, open]);

  const closeOrder = useCallback(() => {
    setOrderOpen(false);
    // A solved order is handed over: the customer leaves and the next one steps up.
    if (solved) bridge.emit('serve', true);
  }, [bridge, solved]);

  const closeExplore = useCallback(() => setExploring(null), []);

  // Esc closes the look-around console (the order console handles its own).
  useEffect(() => {
    if (!exploring) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) closeExplore();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exploring, closeExplore]);

  const orderConsole =
    order && level && orderObject ? (
      // Kept mounted while the same customer orders, so a half-written query survives closing.
      <ConsoleOverlay
        key={`order-${order.id}`}
        stationName={t.truckOrderTitle(t.truckThings[orderObject])}
        level={level}
        db={db}
        dbError={dbError}
        schema={stationTables(level.station, schema)}
        lang={lang}
        t={t}
        visible={orderOpen}
        hintsUsed={hintsUsed}
        onRevealHint={() => setHintsUsed((n) => n + 1)}
        onCorrect={() => setSolved(true)}
        reward={null}
        solvedMessage={t.truckServed}
        doneLabel={t.truckServe}
        onClose={closeOrder}
      />
    ) : null;

  const exploreStation = exploring ? OBJECT_STATION[exploring] : null;
  const exploreConsole =
    exploring && exploreStation ? (
      <div className="console-overlay">
        <section className="console-panel" role="dialog" aria-label={t.truckExplore(t.truckThings[exploring])}>
          <header className="console-panel-header">
            <h2 className="console-panel-title">{t.truckExplore(t.truckThings[exploring])}</h2>
            <button className="close-button" onClick={closeExplore} aria-label={t.dialogueClose}>
              ✕
            </button>
          </header>
          <p className="explore-hint">
            {t.truckExploreHint}
            {order && orderObject && orderObject !== exploring && (
              <strong> {t.truckOrderElsewhere(t.truckWhere[orderObject])}</strong>
            )}
          </p>
          {db ? (
            <ExploreConsole
              key={exploring}
              db={db}
              station={exploreStation}
              schema={stationTables(exploreStation, schema)}
              lang={lang}
              t={t}
            />
          ) : (
            <div className="db-loading" role="status">
              <div className="loading-bar" aria-hidden="true" />
              <p className="loading">{dbError ? `${t.loadError} ${dbError}` : t.loading}</p>
            </div>
          )}
        </section>
      </div>
    ) : null;

  const toastView = toast ? (
    <div className="truck-toast" role="status">
      {toast}
    </div>
  ) : null;

  return {
    front,
    order: order as TruckOrder | undefined,
    /** Where to answer the current order, as a phrase ("at the fridge"). */
    answerWhere: orderObject ? t.truckWhere[orderObject] : null,
    /** The tables the current order needs (highlighted by the Data Lens). */
    orderTables: level ? tablesInQuery(level.solution) : [],
    db,
    consoleOpen: open,
    overlays: (
      <>
        {orderConsole}
        {exploreConsole}
        {toastView}
      </>
    ),
  };
}
