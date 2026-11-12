import { useState } from 'react';
import type { CafeDatabase } from '../sql-core/db';
import type { Lang } from '../sql-core/feedback';
import type { Level } from '../sql-core/levels';
import type { UiText } from '../i18n';
import { Console } from '../console/Console';
import type { Table } from '../console/SchemaPanel';

type Props = {
  level: Level;
  chapterId: number;
  chapterTitle: string;
  levelNumber: number;
  levelCount: number;
  db: CafeDatabase;
  schema: Table[];
  lang: Lang;
  t: UiText;
  onNext: (() => void) | null;
};

/** One level: intro (lesson + dialogue) → solve (task + console) → solved. */
export function LevelScreen(props: Props) {
  const { level, t } = props;
  const [phase, setPhase] = useState<'intro' | 'solve'>('intro');
  const [solved, setSolved] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);
  const speaker = t.characters[level.character];

  return (
    <article className="level">
      <p className="level-meta">
        {t.chapter(props.chapterId)} · {props.chapterTitle} — {t.level(props.levelNumber, props.levelCount)}
      </p>
      <h2 className="level-title">{level.title}</h2>

      {phase === 'intro' ? (
        <>
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

          <Console
            db={props.db}
            schema={props.schema}
            level={level}
            lang={props.lang}
            t={t}
            onCorrect={() => setSolved(true)}
            solvedPanel={
              solved && (
                <div className="solved">
                  <Dialogue speaker={speaker} lines={[level.success]} />
                  {props.onNext ? (
                    <button className="primary-button" onClick={props.onNext}>
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

function Dialogue({ speaker, lines }: { speaker: string; lines: string[] }) {
  return (
    <div className="dialogue">
      <span className="speaker">{speaker}</span>
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  );
}

function Lesson({ lesson }: { lesson: NonNullable<Level['lesson']> }) {
  return (
    <section className="lesson">
      <h3 className="lesson-title">📘 {lesson.title}</h3>
      {lesson.body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {lesson.example && <pre className="lesson-example">{lesson.example}</pre>}
    </section>
  );
}
