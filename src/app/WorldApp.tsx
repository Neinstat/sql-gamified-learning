import { useEffect, useMemo, useState } from 'react';
import { LANGS } from '../sql-core/feedback';
import { allLevels, getChapters, type CharacterId } from '../sql-core/levels';
import { GameBridge, type InteractTarget } from '../game/bridge';
import { ui, useLang } from '../i18n';
import { GameView } from './GameView';
import { DialogueBox } from './DialogueBox';
import { loadProgress } from './progress';

/** The game world (Phase 2). Levels are still solved in classic mode until iteration 2.6. */
export function WorldApp() {
  const [lang, setLang] = useLang();
  const t = ui[lang];
  const bridge = useMemo(() => new GameBridge(), []);
  const [talkingTo, setTalkingTo] = useState<string | null>(null);

  // The level the player is on, in the chosen language.
  const level = useMemo(() => {
    const id = loadProgress().currentLevelId;
    const levels = getChapters(lang).flatMap((chapter) => chapter.levels);
    return levels[Math.max(0, allLevels.findIndex((l) => l.id === id))];
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(
    () =>
      bridge.on('interact', (target: InteractTarget) => {
        if (target.kind === 'npc') setTalkingTo(target.id);
      }),
    [bridge],
  );

  // Freeze the world while an overlay is open.
  useEffect(() => bridge.emit('overlay', talkingTo !== null), [bridge, talkingTo]);

  const characterId = talkingTo as CharacterId | null;
  // An NPC with a request in the current level says it; anyone else just chats.
  const lines = characterId && (level.character === characterId ? level.dialogue : [t.npcIdle[characterId]]);

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
        {characterId && lines && (
          <DialogueBox
            key={`${characterId}-${lang}`}
            character={characterId}
            speaker={t.characters[characterId]}
            lines={lines}
            t={t}
            onClose={() => setTalkingTo(null)}
          />
        )}
      </div>
    </main>
  );
}
