import { allLevels, isCase, type Chapter } from '../sql-core/levels';
import type { UiText } from '../i18n';
import type { Progress } from './progress';
import { Stars } from './Stars';

type Props = {
  chapters: Chapter[];
  currentId: string;
  progress: Progress;
  t: UiText;
  /** Index into allLevels. */
  onSelect: (index: number) => void;
};

/**
 * Level list by chapter. Finished levels and the next unfinished one are open;
 * the rest stay locked so the learning order is kept.
 */
export function LevelNav({ chapters, currentId, progress, t, onSelect }: Props) {
  const firstOpen = allLevels.findIndex((l) => !progress.completed[l.id]);
  const unlockedUpTo = firstOpen === -1 ? allLevels.length - 1 : firstOpen;

  return (
    <nav className="level-nav" aria-label={t.levels}>
      {chapters.map((chapter) => (
        <div key={chapter.id} className="level-nav-chapter">
          <span className="level-nav-title">
            {t.chapter(chapter.id)}
            <span className="level-nav-stars">
              {t.chapterStars(
                chapter.levels.reduce((sum, l) => sum + (progress.completed[l.id]?.stars ?? 0), 0),
                chapter.levels.length * 3,
              )}
            </span>
          </span>
          {chapter.levels.map((level, i) => {
            const index = allLevels.findIndex((l) => l.id === level.id);
            const done = Boolean(progress.completed[level.id]);
            const isCurrent = level.id === currentId;
            const locked = index > unlockedUpTo && !isCurrent;
            const classes = ['level-dot', done && 'done', isCurrent && 'current'].filter(Boolean).join(' ');
            const stars = progress.completed[level.id]?.stars ?? 0;
            return (
              <span key={level.id} className="level-slot">
                <button
                  className={classes}
                  disabled={locked}
                  aria-current={isCurrent ? 'step' : undefined}
                  title={level.title}
                  onClick={() => onSelect(index)}
                >
                  {isCase(level) ? '🔍' : i + 1}
                </button>
                {done && <Stars count={stars} t={t} small />}
              </span>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
