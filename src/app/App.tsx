import { useEffect, useMemo, useState } from 'react';
import { getSchema, type CafeDatabase } from '../sql-core/db';
import { LANGS } from '../sql-core/feedback';
import { allLevels, getChapters } from '../sql-core/levels';
import type { Table } from '../console/SchemaPanel';
import { ui, useLang } from '../i18n';
import { getDatabase } from './database';
import { LevelScreen } from './LevelScreen';

export function App() {
  const [lang, setLang] = useLang();
  const t = ui[lang];

  const [db, setDb] = useState<CafeDatabase | null>(null);
  const [schema, setSchema] = useState<Table[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [levelIndex, setLevelIndex] = useState(startLevelIndex);

  useEffect(() => {
    getDatabase()
      .then(async (database) => {
        setSchema(await getSchema(database));
        setDb(database);
      })
      .catch((err) => setLoadError(String(err)));
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Levels in the chosen language, with their chapter attached.
  const levels = useMemo(
    () => getChapters(lang).flatMap((chapter) => chapter.levels.map((level) => ({ level, chapter }))),
    [lang],
  );
  const current = levels[levelIndex];
  const chapterLevels = levels.filter((l) => l.chapter.id === current.chapter.id);

  return (
    <main className="page">
      <header className="header">
        <div>
          <h1 className="title">SQL Valley</h1>
        </div>
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
      </header>

      {loadError && (
        <p className="feedback feedback-wrong">
          {t.loadError} {loadError}
        </p>
      )}
      {!db && !loadError && <p className="loading">{t.loading}</p>}
      {db && (
        <LevelScreen
          key={current.level.id}
          level={current.level}
          chapterId={current.chapter.id}
          chapterTitle={current.chapter.title}
          levelNumber={chapterLevels.indexOf(current) + 1}
          levelCount={chapterLevels.length}
          db={db}
          schema={schema}
          lang={lang}
          t={t}
          onNext={
            levelIndex + 1 < levels.length
              ? () => {
                  setLevelIndex(levelIndex + 1);
                  window.scrollTo(0, 0);
                }
              : null
          }
        />
      )}
    </main>
  );
}

/**
 * Development shortcut: open http://localhost:5173/?level=ch1-1 to jump to a level.
 * Only works with `npm run dev`, never in the published game.
 */
function startLevelIndex(): number {
  if (!import.meta.env.DEV) return 0;
  const id = new URLSearchParams(window.location.search).get('level');
  const index = allLevels.findIndex((l) => l.id === id);
  return index === -1 ? 0 : index;
}
