import { useEffect, useMemo, useState } from 'react';
import { getSchema, type CafeDatabase } from '../sql-core/db';
import { LANGS } from '../sql-core/feedback';
import { allLevels, getChapters } from '../sql-core/levels';
import type { Table } from '../console/SchemaPanel';
import { ui, useLang } from '../i18n';
import { getDatabase } from './database';
import { LevelScreen } from './LevelScreen';
import { LevelNav } from './LevelNav';
import { emptyProgress, loadProgress, markCompleted, saveProgress, type Progress } from './progress';

export function App() {
  const [lang, setLang] = useLang();
  const t = ui[lang];

  const [db, setDb] = useState<CafeDatabase | null>(null);
  const [schema, setSchema] = useState<Table[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [levelIndex, setLevelIndex] = useState(() => startLevelIndex(progress));

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

  useEffect(() => saveProgress(progress), [progress]);

  // Levels in the chosen language, with their chapter attached.
  const chapters = useMemo(() => getChapters(lang), [lang]);
  const levels = useMemo(
    () => chapters.flatMap((chapter) => chapter.levels.map((level) => ({ level, chapter }))),
    [chapters],
  );
  const current = levels[levelIndex];

  function goTo(index: number) {
    setLevelIndex(index);
    setProgress((p) => ({ ...p, currentLevelId: allLevels[index].id }));
    window.scrollTo(0, 0);
  }

  function startOver() {
    if (!window.confirm(t.confirmStartOver)) return;
    setProgress(emptyProgress);
    goTo(0);
  }

  return (
    <main className="page">
      <header className="header">
        <h1 className="title">SQL Valley</h1>
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

      <LevelNav chapters={chapters} currentId={current.level.id} progress={progress} t={t} onSelect={goTo} />

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
          chapter={current.chapter}
          levelNumber={current.chapter.levels.indexOf(current.level) + 1}
          db={db}
          schema={schema}
          lang={lang}
          t={t}
          onSolved={(hintsUsed) => setProgress((p) => markCompleted(p, current.level.id, hintsUsed))}
          onNext={levelIndex + 1 < levels.length ? () => goTo(levelIndex + 1) : null}
        />
      )}

      <footer className="footer">
        <button className="link-button" onClick={startOver}>
          {t.startOver}
        </button>
      </footer>
    </main>
  );
}

/**
 * Where to start: the saved level, or the first one.
 * Development shortcut: http://localhost:5173/?level=ch1-1 jumps to a level
 * (only with `npm run dev`, never in the published game).
 */
function startLevelIndex(progress: Progress): number {
  const fromUrl = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('level') : null;
  const id = fromUrl ?? progress.currentLevelId;
  const index = allLevels.findIndex((l) => l.id === id);
  return index === -1 ? 0 : index;
}
