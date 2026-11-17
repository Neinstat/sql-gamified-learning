import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UiText } from '../i18n';
import { ExploreConsole } from '../console/ExploreConsole';
import type { Table } from '../console/SchemaPanel';
import { getSchema, type CafeDatabase } from '../sql-core/db';
import type { Lang } from '../sql-core/feedback';
import { isCase, type Level, type RequestLevel } from '../sql-core/levels';
import { stationTables, tablesInQuery } from '../sql-core/stations';
import { findOrderLevel } from '../sql-core/truck/levels';
import { managerCaseFor } from '../sql-core/truck/manager';
import { OBJECT_STATION, objectForStation, type TruckObjectId } from '../sql-core/truck/objects';
import { emptyDay, missOrder, moodFor, parseDayLog, saleSql, serveOrder, TIPS, type DayLog } from '../sql-core/truck/day';
import { starsFor } from './rewards';
import { PROTOTYPE_ORDERS, type TruckOrder } from '../sql-core/truck/orders';
import type { FrontCustomer, TruckBridge } from '../game/truck/bridge';
import { ConsoleOverlay } from './ConsoleOverlay';
import { getDayDatabase } from './database';

/**
 * A shift in the food truck (GAME_DESIGN.md §4): the database, the customer at the window and
 * their order, and what using each object in the truck does:
 * - the object the order needs (tablet, fridge, recipe binders) opens the order's console;
 * - any other object with data opens a "look around" console on its own tables, ungraded;
 * - the back door has nothing yet (The Manager comes in 4.11).
 */
const DAY_KEY = 'sql-valley.truck-day';

function loadDay(): DayLog {
  try {
    return parseDayLog(localStorage.getItem(DAY_KEY));
  } catch {
    return emptyDay();
  }
}

function saveDay(log: DayLog): void {
  try {
    localStorage.setItem(DAY_KEY, JSON.stringify(log));
  } catch {
    // Private windows may refuse storage: the day just isn't kept after a reload.
  }
}

/** Throw away today's progress and start the day again (the page reloads to rebuild the data). */
export function restartDay(): void {
  saveDay(emptyDay());
  window.location.reload();
}

export function useTruckShift(bridge: TruckBridge, lang: Lang, t: UiText) {
  const [day, setDay] = useState<DayLog>(loadDay);
  const [db, setDb] = useState<CafeDatabase | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [schema, setSchema] = useState<Table[]>([]);
  const [front, setFront] = useState<FrontCustomer | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [exploring, setExploring] = useState<TruckObjectId | null>(null);
  /** Set once the order's answer is right: how many wrong runs came before it (for stars). */
  const [solved, setSolved] = useState<{ mistakes: number } | null>(null);
  /** Patience left of the customer at the window (0–1), for their mood and tip. */
  const [patience, setPatience] = useState<{ orderId: string; left: number } | null>(null);
  /** The game says the day is over (closing time, or nobody left to come, and the line is empty). */
  const [closed, setClosed] = useState(false);
  /** The Manager: knocking on the back door, and their case once the door is opened. */
  const [knocking, setKnocking] = useState(false);
  const [managerLevel, setManagerLevel] = useState<Level | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerSolved, setManagerSolved] = useState<{ wrong: number } | null>(null);
  const [managerHints, setManagerHints] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // Load the database (with today's sales replayed) while the first customers walk up.
  // Only the day as it was on load is replayed; later sales are written as they happen.
  const [dayOnLoad] = useState(day);
  useEffect(() => {
    getDayDatabase(dayOnLoad)
      .then(async (database) => {
        setSchema(await getSchema(database));
        setDb(database);
      })
      .catch((err) => setDbError(String(err)));
  }, [dayOnLoad]);

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
    setSolved(null);
    setHintsUsed(0);
  }, [order?.id]);

  // The day as the game plays it: the clock, impatient customers, closing time. Saved as it goes.
  const updateDay = useCallback((change: (log: DayLog) => DayLog) => {
    setDay((prev) => {
      const next = change(prev);
      if (next !== prev) saveDay(next);
      return next;
    });
  }, []);
  // The saved clock never goes back (only "start the day again" resets it, by replacing the log).
  useEffect(
    () => bridge.on('clock', (minutes) => updateDay((log) => (minutes > log.clock ? { ...log, clock: minutes } : log))),
    [bridge, updateDay],
  );
  useEffect(() => bridge.on('patience', setPatience), [bridge]);
  useEffect(() => bridge.on('closed', () => setClosed(true)), [bridge]);
  useEffect(() => bridge.on('knock', () => setKnocking(true)), [bridge]);
  useEffect(
    () =>
      bridge.on('gaveUp', (orderId) => {
        updateDay((log) => missOrder(log, orderId));
        setToast(t.gaveUp);
      }),
    [bridge, updateDay, t],
  );

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
        else if (id === 'back-door' && knocking && db) {
          // Open the door: the Manager's case is worked out from the data as it is right now.
          bridge.emit('door', true);
          managerCaseFor(db, day.date, lang)
            .then((level) => {
              setManagerLevel(level);
              setManagerOpen(true);
            })
            .catch((err) => {
              bridge.emit('door', false);
              setToast(String(err));
            });
        } else setToast(day.manager ? t.managerGone : t.truckDoor);
      }),
    [bridge, order, orderObject, t, knocking, db, day.date, day.manager, lang],
  );

  const closeManager = useCallback(() => {
    setManagerOpen(false);
    bridge.emit('door', false);
    if (!managerSolved) return;
    // Answered: the Manager leaves, and the day log keeps the stars.
    const stars = starsFor(managerHints, managerSolved.wrong);
    updateDay((log) => ({ ...log, manager: { stars } }));
    setKnocking(false);
    setManagerLevel(null);
    setManagerSolved(null);
    setManagerHints(0);
    bridge.emit('managerDone', true);
    setToast(t.managerLeft);
  }, [bridge, managerSolved, managerHints, updateDay, t]);

  // Time stops while a console is open.
  const open = orderOpen || exploring !== null || managerOpen;
  useEffect(() => bridge.emit('pause', open), [bridge, open]);

  const closeOrder = useCallback(() => {
    setOrderOpen(false);
    if (!solved || !order) return;
    // A solved order is handed over: it becomes sales rows, the day log is saved, and the
    // customer leaves so the next one steps up.
    const left = patience?.orderId === order.id ? patience.left : 1;
    const served = {
      orderId: order.id,
      at: Math.floor(day.clock),
      tip: TIPS[moodFor(left)],
      stars: starsFor(hintsUsed, solved.mistakes),
    };
    updateDay((log) => serveOrder(log, served));
    db?.write(saleSql(order, day.date, served.at)).catch((err) => setToast(String(err)));
    bridge.emit('serve', true);
  }, [bridge, solved, order, day, db, patience, hintsUsed, updateDay]);

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
        onCorrect={(mistakes) => setSolved({ mistakes })}
        reward={null}
        solvedMessage={t.truckServed}
        doneLabel={t.truckServe}
        onClose={closeOrder}
      />
    ) : null;

  const managerConsole =
    managerLevel ? (
      // Kept mounted while the Manager waits, so pinned results survive closing the door.
      <ConsoleOverlay
        key="manager"
        stationName={t.managerTitle}
        level={managerLevel}
        db={db}
        dbError={dbError}
        schema={stationTables('back-office', schema)}
        lang={lang}
        t={t}
        visible={managerOpen}
        hintsUsed={managerHints}
        onRevealHint={() => setManagerHints((n) => n + 1)}
        onCorrect={(wrong) => setManagerSolved({ wrong })}
        reward={null}
        solvedMessage={managerLevel.success}
        doneLabel={t.managerHandOver}
        onClose={closeManager}
        speech={{ speaker: t.managerName, lines: managerLevel.dialogue }}
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
    /** Today so far: the date, and the orders served (each one is in `sales`). */
    day,
    /** Every order of the day has been served. */
    dayDone: closed,
    /** The Manager is knocking and has not been answered yet. */
    knocking,
    /** The mood of the customer at the window (null when nobody is there). */
    mood: front && patience?.orderId === front.orderId ? moodFor(patience.left) : null,
    patienceLeft: front && patience?.orderId === front.orderId ? patience.left : null,
    consoleOpen: open,
    overlays: (
      <>
        {orderConsole}
        {managerConsole}
        {exploreConsole}
        {toastView}
      </>
    ),
  };
}
