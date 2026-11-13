import { useState } from 'react';
import type { CafeDatabase } from '../sql-core/db';
import type { Lang } from '../sql-core/feedback';
import type { Chapter, Level } from '../sql-core/levels';
import type { UiText } from '../i18n';
import { Console } from '../console/Console';
import { Dialogue, Hints, Lesson } from './LevelParts';
import type { Table } from '../console/SchemaPanel';

type Props = {
  level: Level;
  chapter: Chapter;
  levelNumber: number;
  db: CafeDatabase;
  schema: Table[];
  lang: Lang;
  t: UiText;
  /** Called each time the answer is correct, with the hints used so far. */
  onSolved: (hintsUsed: number) => void;
  onNext: (() => void) | null;
};

/** One level: intro (lesson + dialogue) → solve (task, hints, console) → solved. */
export function LevelScreen({ level, chapter, levelNumber, db, schema, lang, t, onSolved, onNext }: Props) {
  const [phase, setPhase] = useState<'intro' | 'solve'>('intro');
  const [solved, setSolved] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const speaker = t.characters[level.character];

  return (
    <article className="level">
      <p className="level-meta">
        {t.chapter(chapter.id)} · {chapter.title} — {t.level(levelNumber, chapter.levels.length)}
      </p>
      <h2 className="level-title">{level.title}</h2>

      {phase === 'intro' ? (
        <>
          {levelNumber === 1 && (
            <section className="chapter-card">
              <span className="chapter-card-label">{t.newChapter}</span>
              <p className="chapter-card-title">
                {t.chapter(chapter.id)}: {chapter.title}
              </p>
              <p className="chapter-card-summary">{chapter.summary}</p>
            </section>
          )}
          <Dialogue speaker={speaker} lines={level.dialogue} />
          {level.lesson && <Lesson lesson={level.lesson} />}
          <button className="primary-button" onClick={() => setPhase('solve')}>
            {t.start}
          </button>
        </>
      ) : (
        <>
          <div className="task">
            <span className="task-label">{t.task}</span>
            <p className="task-text">{level.task}</p>
            {level.lesson && (
              <button className="link-button" onClick={() => setLessonOpen((o) => !o)}>
                {lessonOpen ? t.hideLesson : t.showLesson}
              </button>
            )}
            {lessonOpen && level.lesson && <Lesson lesson={level.lesson} />}
          </div>

          <Hints hints={level.hints} used={hintsUsed} onReveal={() => setHintsUsed((n) => n + 1)} t={t} />

          <Console
            db={db}
            schema={schema}
            level={level}
            lang={lang}
            t={t}
            onCorrect={() => {
              setSolved(true);
              onSolved(hintsUsed);
            }}
            solvedPanel={
              solved && (
                <div className="solved">
                  <Dialogue speaker={speaker} lines={[level.success]} />
                  {onNext ? (
                    <button className="primary-button" onClick={onNext}>
                      {t.next} →
                    </button>
                  ) : (
                    <p className="all-done">{t.allDone}</p>
                  )}
                </div>
              )
            }
          />
        </>
      )}
    </article>
  );
}
