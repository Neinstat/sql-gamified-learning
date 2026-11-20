import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UiText } from '../i18n';
import { ExploreConsole } from '../console/ExploreConsole';
import type { Table } from '../console/SchemaPanel';
import { getSchema, type CafeDatabase } from '../sql-core/db';
import type { Lang } from '../sql-core/feedback';
import type { Level } from '../sql-core/levels';
import { stationTables, tablesInQuery } from '../sql-core/stations';
import { managerCaseFor, managerIntroFor } from '../sql-core/truck/manager';
import { OBJECT_STATION, objectForStation, type TruckObjectId } from '../sql-core/truck/objects';
import { missOrder, moodFor, newDay, parseDayLog, saleSql, serveOrder, TIPS, type DayLog } from '../sql-core/truck/day';
import { starsFor } from './rewards';
import { dayOrders, inputStage, orderLevel, type TruckOrder } from '../sql-core/truck/orders';
import { masteryFrom, nextDay, parsePastDays } from '../sql-core/truck/repetition';
import type { FrontCustomer, TruckBridge } from '../game/truck/bridge';
import { ConsoleOverlay } from './ConsoleOverlay';
import { TalkBox } from './TalkBox';
import { getDayDatabase } from './database';

/**
 * A shift in the food truck (GAME_DESIGN.md §4): the database, the customer at the window and
 * their order, and what using each object in the truck does:
 * - the object the order needs (tablet, fridge, recipe binders) opens the order's console;
 * - any other object with data opens a "look around" console on its own tables, ungraded;
 * - the back door has nothing yet (The Manager comes in 4.11).
 */
const DAY_KEY = 'sql-valley.truck-day';
/** Every finished day, oldest first: their sales are replayed, and mastery is worked out from them. */
const PAST_KEY = 'sql-valley.truck-past';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private windows may refuse storage: progress just isn't kept after a reload.
  }
}

/** The finished days and today. Today must come after the last finished day, or a new one starts. */
function loadProgress(): { past: DayLog[]; day: DayLog } {
  const past = parsePastDays(read(PAST_KEY));
  const saved = parseDayLog(read(DAY_KEY));
  const last = past[past.length - 1];
  const day = saved && (!last || saved.date > last.date) ? saved : nextDay(past);
  return { past, day };
}

const saveDay = (log: DayLog) => write(DAY_KEY, log);

/** Throw away today's progress and play the same day again (the page reloads to rebuild the data). */
export function restartDay(day: DayLog): void {
  saveDay(newDay(day.date, day.orders));
  window.location.reload();
}

/** Close the books on today and open the next day, planned from everything practised so far. */
export function startNextDay(past: readonly DayLog[], day: DayLog): void {
  const done = [...past, day];
  write(PAST_KEY, done);
  saveDay(nextDay(done));
  window.location.reload();
}

export function useTruckShift(bridge: TruckBridge, lang: Lang, t: UiText) {
  const [progressOnLoad] = useState(loadProgress);
  const past = progressOnLoad.past;
  const [day, setDay] = useState<DayLog>(progressOnLoad.day);
  const [db, setDb] = useState<CafeDatabase | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [schema, setSchema] = useState<Table[]>([]);
  const [front, setFront] = useState<FrontCustomer | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [exploring, setExploring] = useState<TruckObjectId | null>(null);
  /** The table the look-around console starts on (from a Data Lens card). */
  const [exploreTable, setExploreTable] = useState<string | undefined>(undefined);
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
  /** Talking with the Manager at the door, before the case opens. */
  const [managerTalk, setManagerTalk] = useState(false);
  const [managerSolved, setManagerSolved] = useState<{ wrong: number } | null>(null);
  const [managerHints, setManagerHints] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // Load the database (with today's sales replayed) while the first customers walk up.
  // Only the day as it was on load is replayed; later sales are written as they happen.
  useEffect(() => {
    getDayDatabase([progressOnLoad.past, progressOnLoad.day].flat())
      .then(async (database) => {
        setSchema(await getSchema(database));
        setDb(database);
      })
      .catch((err) => setDbError(String(err)));
  }, [progressOnLoad]);
  // A fresh day is saved straight away, so a reload keeps its plan.
  useEffect(() => saveDay(progressOnLoad.day), [progressOnLoad]);

  useEffect(() => bridge.on('front', setFront), [bridge]);

  /** Today's orders, in the order customers arrive (who they are, and what they ask). */
  const orders = useMemo(() => dayOrders(day.date, day.orders), [day.date, day.orders]);
  /** What the player had practised before today: a concept met for the first time opens its lesson. */
  const masteryBefore = useMemo(() => masteryFrom(past), [past]);
  const order = front ? orders.find((o) => o.id === front.orderId) : undefined;
  const newConcept = order ? masteryBefore[order.concept] === undefined : false;
  /** The better the concept is known (before today), the more of the query the player writes. */
  const stage = inputStage(order ? masteryBefore[order.concept]?.level : undefined);
  const level = useMemo(() => (order ? orderLevel(order, lang, stage) : undefined), [order, lang, stage]);
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
        else if (OBJECT_STATION[id]) {
          setExploreTable(undefined);
          setExploring(id);
        }
        else if (id === 'back-door' && knocking && db) {
          bridge.emit('door', true);
          // Back to a case already started: straight in. Otherwise: talk first, while the case is
          // worked out from the data as it is right now.
          if (managerLevel) {
            setManagerOpen(true);
            return;
          }
          setManagerTalk(true);
          managerCaseFor(db, day.date, lang)
            .then(setManagerLevel)
            .catch((err) => {
              setManagerTalk(false);
              bridge.emit('door', false);
              setToast(String(err));
            });
        } else if (id === 'back-door' && knocking) {
          // The records are still loading (just after a reload): say so instead of ignoring the knock.
          setToast(t.stillLoading);
        } else setToast(day.manager ? t.managerGone : t.truckDoor);
      }),
    [bridge, order, orderObject, t, knocking, db, day.date, day.manager, lang, managerLevel],
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
  const open = orderOpen || exploring !== null || managerOpen || managerTalk;
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

  /** A table clicked in the Data Lens: look around it with the object that holds it. */
  const openTable = useCallback((object: TruckObjectId, table: string) => {
    if (!OBJECT_STATION[object]) return;
    setExploreTable(table);
    setExploring(object);
  }, []);

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
        lessonOpen={newConcept}
        note={stage === 'keyword' ? undefined : t.inputStageNote[stage]}
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
        speech={{ speaker: t.managerName, lines: managerLevel.dialogue.slice(-1) }}
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
              key={`${exploring}-${exploreTable ?? ''}`}
              table={exploreTable}
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
    /** Today's customers, in the order they arrive. */
    orders,
    /** The days played before today. */
    past,
    /** Every order of the day has been served. */
    dayDone: closed,
    /** The Manager is knocking and has not been answered yet. */
    knocking,
    /** The mood of the customer at the window (null when nobody is there). */
    mood: front && patience?.orderId === front.orderId ? moodFor(patience.left) : null,
    patienceLeft: front && patience?.orderId === front.orderId ? patience.left : null,
    consoleOpen: open,
    openTable,
    overlays: (
      <>
        {orderConsole}
        {managerTalk && (
          <TalkBox
            speaker={t.managerName}
            {...talkScript(managerIntroFor(lang))}
            onDone={() => {
              setManagerTalk(false);
              setManagerOpen(true);
            }}
            onClose={() => {
              setManagerTalk(false);
              bridge.emit('door', false);
            }}
            t={t}
          />
        )}
        {managerConsole}
        {exploreConsole}
        {toastView}
      </>
    ),
  };
}

const talkScript = (intro: ReturnType<typeof managerIntroFor>) => ({
  lines: intro.lines,
  replies: intro.replies,
  openLabel: intro.open,
});

