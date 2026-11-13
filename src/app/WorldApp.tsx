import { useEffect } from 'react';
import { LANGS } from '../sql-core/feedback';
import { ui, useLang } from '../i18n';
import { GameView } from './GameView';

/** The game world (Phase 2). Levels are still played in classic mode until iteration 2.6. */
export function WorldApp() {
  const [lang, setLang] = useLang();
  const t = ui[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

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
      <GameView t={t} />
    </main>
  );
}
