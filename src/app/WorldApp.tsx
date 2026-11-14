import { useCallback, useEffect, useMemo, useState } from 'react';
import { LANGS } from '../sql-core/feedback';
import { getSchema, type CafeDatabase } from '../sql-core/db';
import { allLevels, getChapters, type CharacterId } from '../sql-core/levels';
import { stationTables, type StationId } from '../sql-core/stations';
import { GameBridge, type InteractTarget } from '../game/bridge';
import type { Table } from '../console/SchemaPanel';
import { ui, useLang } from '../i18n';
import { GameView } from './GameView';
import { DialogueBox } from './DialogueBox';
import { ConsoleOverlay } from './ConsoleOverlay';
import { WorldModal } from './WorldModal';
import { LevelNav } from './LevelNav';
import { Lesson } from './LevelParts';
import { getDatabase } from './database';
import { emptyProgress, loadProgress, markSoWhatRight, rewardForSolve, saveProgress, type Progress } from './progress';
import { SO_WHAT_BONUS, type Reward } from './rewards';
import { acceptRequest, questStage, reportDone, resumeNewLevels, solveRequest, startLevel } from './quest';
import { SoWhatCard } from './SoWhatCard';
import { CafeMap } from './CafeMap';
import { reachedChapter } from './rooms';
import { openRooms, roomOfTarget, type RoomId } from '../game/rooms/cafe';

/** What is open over the world. `null` = the player is walking around. */
type Overlay = InteractTarget | { kind: 'lesson' } | { kind: 'chapter' } | { kind: 'journal' } | { kind: 'soWhat' };

const levelIds = allLevels.map((l) => l.id);

/** The game world: walk around, take requests, solve them at stations, report back. */
export function WorldApp() {
  const [lang, setLang] = useLang();
  const t = ui[lang];
  const bridge = useMemo(() => new GameBridge(), []);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [progress, setProgress] = useState<Progress>(() => withDevStart(resumeNewLevels(loadProgress(), levelIds)));
  const [db, setDb] = useState<CafeDatabase | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [schema, setSchema] = useState<Table[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  /** Stars and coins from the last correct answer at a station. */
  const [reward, setReward] = useState<Reward | null>(null);
  /** The room the player is standing in (from the game), and which Journal tab is open. */
  const [here, setHere] = useState<RoomId>('front');
  const [journalTab, setJournalTab] = useState<'levels' | 'map'>('levels');
  /** Chapters whose title card was shown this visit. */
  const [seenChapters, setSeenChapters] = useState<number[]>([]);

  // The level the player is on, in the chosen language, with its chapter.
  const chapters = useMemo(() => getChapters(lang), [lang]);
  const { level, chapter } = useMemo(() => {
    const entries = chapters.flatMap((c) => c.levels.map((l) => ({ level: l, chapter: c })));
    return entries[Math.max(0, levelIds.indexOf(progress.currentLevelId ?? ''))];
  }, [chapters, progress.currentLevelId]);
  const stage = questStage(progress, level.id);
  const giver = t.characters[level.character];
  const stationName = t.stations[level.station];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => saveProgress(progress), [progress]);
  // Hints are counted per level.
  useEffect(() => {
    setHintsUsed(0);
    setReward(null);
  }, [level.id]);

  // Start loading the café database in the background as soon as the world opens.
  useEffect(() => {
    getDatabase()
      .then(async (database) => {
        setSchema(await getSchema(database));
        setDb(database);
      })
      .catch((err) => setDbError(String(err)));
  }, []);

  // A new chapter starts with its title card.
  const firstOfChapter = chapter.levels[0].id === level.id;
  useEffect(() => {
    if (stage === 'talk' && firstOfChapter && !seenChapters.includes(chapter.id) && overlay === null) {
      setOverlay({ kind: 'chapter' });
    }
  }, [stage, firstOfChapter, seenChapters, chapter.id, overlay]);

  // Game → app: the player used something.
  useEffect(() => bridge.on('interact', (target) => setOverlay(target)), [bridge]);

  // App → game: freeze the world under overlays, and show where to go next.
  const questTarget = useMemo<InteractTarget | null>(() => {
    if (stage === 'done') return null;
    if (stage === 'solve') return { kind: 'station', id: level.station };
    return { kind: 'npc', id: level.character };
  }, [stage, level.station, level.character]);
  // Rooms open chapter by chapter; the signs by the doors use the player's language.
  const open = useMemo(() => openRooms(reachedChapter(progress, chapter.id)), [progress, chapter.id]);
  const labels = useMemo(() => ({ names: t.rooms }), [t]);
  useEffect(() => bridge.emit('overlay', overlay !== null), [bridge, overlay]);
  useEffect(() => bridge.emit('quest', questTarget), [bridge, questTarget]);
  useEffect(() => bridge.emit('rooms', open), [bridge, open]);
  useEffect(() => bridge.emit('labels', labels), [bridge, labels]);
  useEffect(() => bridge.on('room', setHere), [bridge]);
  useEffect(
    () =>
      bridge.on('ready', () => {
        bridge.emit('quest', questTarget);
        bridge.emit('overlay', overlay !== null);
        bridge.emit('rooms', open);
        bridge.emit('labels', labels);
      }),
    [bridge, questTarget, overlay, open, labels],
  );

  const close = useCallback(() => {
    // Don't leave focus inside a closed overlay (e.g. the hidden SQL editor), or the
    // player's next WASD/Space would type there instead of moving.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setOverlay(null);
  }, []);

  // --- What each overlay shows ---------------------------------------------------------

  const station = overlay?.kind === 'station' ? (overlay.id as StationId) : null;
  const consoleOpen = station !== null && station === level.station && stage !== 'talk';

  let dialogue: { character?: CharacterId; speaker: string; lines: string[]; onClose: () => void } | null = null;
  if (overlay?.kind === 'npc') {
    const id = overlay.id as CharacterId;
    const isGiver = id === level.character;
    const base = { character: id, speaker: t.characters[id], onClose: close };
    if (isGiver && stage === 'talk') {
      dialogue = {
        ...base,
        lines: level.dialogue,
        onClose: () => {
          if (level.lesson) {
            setOverlay({ kind: 'lesson' });
          } else {
            setProgress((p) => acceptRequest(p, level.id));
            close();
          }
        },
      };
    } else if (isGiver && stage === 'solve') {
      dialogue = { ...base, lines: [t.questRemind(stationName)] };
    } else if (isGiver && stage === 'report') {
      dialogue = {
        ...base,
        lines: [level.success],
        onClose: () => {
          if (level.soWhat) {
            setOverlay({ kind: 'soWhat' });
          } else {
            setProgress((p) => reportDone(p, levelIds, level.id));
            close();
          }
        },
      };
    } else {
      dialogue = { ...base, lines: [t.npcIdle[id]] };
    }
  } else if (station && !consoleOpen) {
    const closed = db !== null && stationTables(station, schema).length === 0;
    const line = station === level.station ? t.stationTalkFirst(giver) : closed ? t.stationClosed : t.stationNothing;
    dialogue = { speaker: t.stations[station], lines: [line], onClose: close };
  }

  return (
    <main className="world">
      <header className="world-hud">
        <h1 className="world-title">SQL Valley</h1>
        <div className="world-hud-actions">
          <span className="hud-coins" title={t.coins} aria-label={`${t.coins}: ${progress.coins}`}>
            🪙 {progress.coins}
          </span>
          {/* onMouseDown: clicking doesn't keep focus here, so Space still talks in the world. */}
          <button className="hud-button" onMouseDown={noFocus} onClick={() => setOverlay({ kind: 'journal' })}>
            📖 {t.journal}
          </button>
          <div className="lang-switch" role="group" aria-label={t.language}>
            {LANGS.map((code) => (
              <button
                key={code}
                onMouseDown={noFocus}
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

      <QuestBar
        label={`${t.chapter(chapter.id)} · ${chapter.title}`}
        status={dbError ? `⚠️ ${t.loadError}` : db ? null : t.loadingRecords}
        active={stage !== 'done'}
        text={
          stage === 'talk'
            ? t.questTalk(giver)
            : stage === 'solve'
              ? `${t.questSolve(stationName)} ${level.task}`
              : stage === 'report'
                ? t.questReport(giver)
                : t.allDone
        }
      />

      <div className="world-stage">
        <GameView t={t} bridge={bridge} />
        <div className="zoom-controls">
          <button
            className="zoom-button"
            onMouseDown={noFocus}
            onClick={() => bridge.emit('zoom', 1)}
            aria-label={t.zoomIn}
            title={t.zoomIn}
          >
            +
          </button>
          <button
            className="zoom-button"
            onMouseDown={noFocus}
            onClick={() => bridge.emit('zoom', -1)}
            aria-label={t.zoomOut}
            title={t.zoomOut}
          >
            −
          </button>
        </div>

        {dialogue && (
          <DialogueBox
            key={`${overlay?.kind}-${'id' in (overlay ?? {}) ? (overlay as InteractTarget).id : ''}-${stage}-${lang}`}
            character={dialogue.character}
            speaker={dialogue.speaker}
            lines={dialogue.lines}
            t={t}
            onClose={dialogue.onClose}
          />
        )}

        {/* Kept mounted for the whole level so the player's query survives closing it. */}
        {stage !== 'talk' && (
          <ConsoleOverlay
            key={level.id}
            stationName={stationName}
            level={level}
            db={db}
            dbError={dbError}
            schema={stationTables(level.station, schema)}
            lang={lang}
            t={t}
            visible={consoleOpen}
            hintsUsed={hintsUsed}
            onRevealHint={() => setHintsUsed((n) => n + 1)}
            onCorrect={(mistakes) => {
              setReward(rewardForSolve(progress, level.id, hintsUsed, mistakes));
              setProgress((p) => solveRequest(p, level.id, hintsUsed, mistakes));
            }}
            reward={reward}
            solvedMessage={t.solvedGoReport(giver)}
            onClose={close}
          />
        )}

        {overlay?.kind === 'lesson' && level.lesson && (
          <WorldModal
            label={level.lesson.title}
            action={t.gotIt}
            onAction={() => {
              setProgress((p) => acceptRequest(p, level.id));
              close();
            }}
          >
            <Lesson lesson={level.lesson} />
          </WorldModal>
        )}

        {overlay?.kind === 'soWhat' && level.soWhat && (
          <SoWhatCard
            key={`${level.id}-${lang}`}
            soWhat={level.soWhat}
            speaker={giver}
            t={t}
            bonus={progress.soWhatRight.includes(level.id) ? 0 : SO_WHAT_BONUS}
            onDone={(right) => {
              setProgress((p) => {
                const paid = right ? markSoWhatRight(p, level.id, SO_WHAT_BONUS) : p;
                return reportDone(paid, levelIds, level.id);
              });
              close();
            }}
          />
        )}

        {overlay?.kind === 'chapter' && (
          <WorldModal
            label={chapter.title}
            action={t.dialogueNext}
            onAction={() => {
              setSeenChapters((seen) => [...seen, chapter.id]);
              close();
            }}
          >
            <section className="chapter-card">
              <span className="chapter-card-label">{t.newChapter}</span>
              <p className="chapter-card-title">
                {t.chapter(chapter.id)}: {chapter.title}
              </p>
              <p className="chapter-card-summary">{chapter.summary}</p>
            </section>
          </WorldModal>
        )}

        {overlay?.kind === 'journal' && (
          <WorldModal
            label={t.journal}
            action={t.backToCafe}
            onAction={close}
            onClose={close}
            closeLabel={t.dialogueClose}
          >
            <h2 className="world-modal-title">{t.journal}</h2>
            <div className="journal-tabs" role="tablist">
              {(['levels', 'map'] as const).map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={journalTab === tab}
                  className={journalTab === tab ? 'journal-tab active' : 'journal-tab'}
                  onClick={() => setJournalTab(tab)}
                >
                  {tab === 'levels' ? t.levelsTab : `🗺 ${t.cafeMap}`}
                </button>
              ))}
            </div>
            {journalTab === 'map' ? (
              <CafeMap
                open={open}
                here={here}
                task={questTarget ? roomOfTarget(questTarget.kind, questTarget.id) : null}
                t={t}
              />
            ) : (
              <>
                <p className="world-modal-hint">{t.journalHint}</p>
                <LevelNav
                  chapters={chapters}
                  currentId={level.id}
                  progress={progress}
                  t={t}
                  onSelect={(index) => {
                    setProgress((p) => startLevel(p, levelIds[index]));
                    close();
                  }}
                />
                <button
                  className="link-button world-modal-start-over"
                  onClick={() => {
                    if (!window.confirm(t.confirmStartOver)) return;
                    setProgress(emptyProgress);
                    setSeenChapters([]);
                    close();
                  }}
                >
                  {t.startOver}
                </button>
              </>
            )}
          </WorldModal>
        )}
      </div>
    </main>
  );
}

/** Always-visible line under the header: what to do next. */
/**
 * Development shortcut: http://localhost:5173/?level=ch1-3 starts that level's request
 * (only with `npm run dev`, never in the published game).
 */
function withDevStart(progress: Progress): Progress {
  if (!import.meta.env.DEV) return progress;
  const id = new URLSearchParams(window.location.search).get('level');
  return id && levelIds.includes(id) ? startLevel(progress, id) : progress;
}

const noFocus = (event: React.MouseEvent) => event.preventDefault();

function QuestBar(props: { label: string; text: string; active: boolean; status: string | null }) {
  const { label, text, active, status } = props;
  return (
    <div className="quest-bar" role="status">
      <span className="quest-bar-label">{label}</span>
      <span className={active ? 'quest-bar-text active' : 'quest-bar-text'}>{text}</span>
      {status && <span className="quest-bar-status">{status}</span>}
    </div>
  );
}
