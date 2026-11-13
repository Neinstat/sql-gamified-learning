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
import { getDatabase } from './database';
import { loadProgress, markCompleted, saveProgress, type Progress } from './progress';

/** The game world (Phase 2). Moving on to the next level comes in iteration 2.6. */
export function WorldApp() {
  const [lang, setLang] = useLang();
  const t = ui[lang];
  const bridge = useMemo(() => new GameBridge(), []);
  const [overlay, setOverlay] = useState<InteractTarget | null>(null);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [db, setDb] = useState<CafeDatabase | null>(null);
  const [schema, setSchema] = useState<Table[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  /** Stations whose console was opened for the current level (kept mounted, see ConsoleOverlay). */
  const [openedConsole, setOpenedConsole] = useState<StationId | null>(null);

  // The level the player is on, in the chosen language.
  const level = useMemo(() => {
    const levels = getChapters(lang).flatMap((chapter) => chapter.levels);
    return levels[Math.max(0, allLevels.findIndex((l) => l.id === progress.currentLevelId))];
  }, [lang, progress.currentLevelId]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => saveProgress(progress), [progress]);

  // Hints are counted per level.
  useEffect(() => setHintsUsed(0), [level.id]);

  // Start loading the café database in the background as soon as the world opens.
  useEffect(() => {
    getDatabase()
      .then(async (database) => {
        setSchema(await getSchema(database));
        setDb(database);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => bridge.on('interact', (target) => setOverlay(target)), [bridge]);

  // Freeze the world while an overlay is open.
  useEffect(() => bridge.emit('overlay', overlay !== null), [bridge, overlay]);

  const close = useCallback(() => setOverlay(null), []);

  const station = overlay?.kind === 'station' ? (overlay.id as StationId) : null;
  const visibleTables = station ? stationTables(station, schema) : [];
  // A station opens its console when the current task is solved there.
  const consoleHere = station !== null && station === level.station;
  useEffect(() => {
    if (consoleHere && station) setOpenedConsole(station);
  }, [consoleHere, station]);

  let message: { character?: CharacterId; speaker: string; lines: string[] } | null = null;
  if (overlay?.kind === 'npc') {
    const id = overlay.id as CharacterId;
    // An NPC with a request in the current level says it; anyone else just chats.
    message = { character: id, speaker: t.characters[id], lines: level.character === id ? level.dialogue : [t.npcIdle[id]] };
  } else if (station && !consoleHere) {
    const closed = db !== null && visibleTables.length === 0;
    message = { speaker: t.stations[station], lines: [closed ? t.stationClosed : t.stationNothing] };
  }

  return (
    <main className="world">
      <header className="world-hud">
        <h1 className="world-title">SQL Valley</h1>
        <div className="world-hud-actions">
          <a className="link-button" href="?classic">
            {t.classicMode}
          </a>
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
      <div className="world-stage">
        <GameView t={t} bridge={bridge} />
        {message && (
          <DialogueBox
            key={`${overlay?.kind}-${overlay?.id}-${lang}`}
            character={message.character}
            speaker={message.speaker}
            lines={message.lines}
            t={t}
            onClose={close}
          />
        )}
        {openedConsole === level.station && (
          <ConsoleOverlay
            key={level.id}
            stationName={t.stations[level.station]}
            level={level}
            db={db}
            schema={stationTables(level.station, schema)}
            lang={lang}
            t={t}
            visible={consoleHere}
            hintsUsed={hintsUsed}
            onRevealHint={() => setHintsUsed((n) => n + 1)}
            onCorrect={() => setProgress((p) => markCompleted(p, level.id, hintsUsed))}
            onClose={close}
          />
        )}
      </div>
    </main>
  );
}
