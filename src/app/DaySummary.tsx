import { useEffect, useState } from 'react';
import type { UiText } from '../i18n';
import { runQuery, type CafeDatabase } from '../sql-core/db';
import type { Lang } from '../sql-core/feedback';
import { conceptName } from '../sql-core/truck/concepts';
import { revenueSql, type DayLog } from '../sql-core/truck/day';
import { dayProgress, MAX_LEVEL } from '../sql-core/truck/repetition';

const money = (n: number) => `$${n.toFixed(2)}`;

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

/**
 * The end-of-day summary (GAME_DESIGN.md §4): orders served and missed, revenue, tips and stars,
 * and how each concept practised today moved (it decides when it comes back). Revenue comes from
 * a real query on today's sales, shown so the summary is a small lesson too.
 */
export function DaySummary({
  db,
  day,
  past,
  dateLabel,
  lang,
  t,
  onNewDay,
  onReplay,
}: {
  db: CafeDatabase | null;
  day: DayLog;
  past: readonly DayLog[];
  dateLabel: string;
  lang: Lang;
  t: UiText;
  onNewDay: () => void;
  onReplay: () => void;
}) {
  const progress = dayProgress(past, day);
  const sql = revenueSql(day.date);
  const [revenue, setRevenue] = useState<number | null>(null);
  useEffect(() => {
    if (!db) return;
    let cancelled = false;
    // Run like a player would on the tablet, so the shown query is exactly what was run.
    runQuery(db, sql, 'cash-register').then((r) => {
      if (!cancelled && r.ok) setRevenue(Number(r.rows[0][1] ?? 0));
    });
    return () => {
      cancelled = true;
    };
  }, [db, sql, day.served.length]);

  const tips = day.served.reduce((sum, s) => sum + s.tip, 0);
  const stars = day.served.reduce((sum, s) => sum + s.stars, 0);

  return (
    <div className="day-summary" role="dialog" aria-label={t.summaryTitle(dateLabel)}>
      <p className="day-summary-title">🌇 {t.summaryTitle(dateLabel)}</p>
      <dl className="day-summary-stats">
        <div>
          <dt>{t.summaryServed}</dt>
          <dd>
            {day.served.length}/{day.orders.length}
          </dd>
        </div>
        <div>
          <dt>{t.summaryMissed}</dt>
          <dd>{day.missed.length}</dd>
        </div>
        <div>
          <dt>{t.summaryRevenue}</dt>
          <dd>{revenue === null ? '…' : money(revenue)}</dd>
        </div>
        <div>
          <dt>{t.summaryTips}</dt>
          <dd>{money(tips)}</dd>
        </div>
        <div>
          <dt>{t.summaryManager}</dt>
          <dd>{day.manager ? `✓ ${'⭐'.repeat(day.manager.stars)}` : t.summaryManagerMissed}</dd>
        </div>
        <div>
          <dt>{t.summaryStars}</dt>
          <dd>
            ⭐ {stars}/{day.orders.length * 3}
          </dd>
        </div>
      </dl>
      {progress.length > 0 && (
        <>
          <p className="day-summary-label">📈 {t.summaryPractised}</p>
          <ul className="day-summary-concepts">
            {progress.map((p) => (
              <li key={p.concept}>
                <span className="concept-name">{conceptName(p.concept, lang)}</span>
                <span className="concept-level" title={t.summaryLevel(p.after)}>
                  {p.before === null && <em className="concept-new">{t.summaryNewConcept}</em>}
                  {p.before !== null && p.after > p.before && <span className="concept-up">▲</span>}
                  {p.before !== null && p.after < p.before && <span className="concept-down">▼</span>}
                  <span aria-label={t.summaryLevel(p.after)}>
                    {'●'.repeat(p.after)}
                    {'○'.repeat(MAX_LEVEL - p.after)}
                  </span>
                </span>
                <span className="concept-due">{t.summaryBackIn(daysBetween(day.date, p.due))}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="day-summary-label">{t.summaryQuery}</p>
      <pre className="day-summary-sql">
        <code>{sql}</code>
      </pre>
      <p className="day-summary-next">{t.summaryNext}</p>
      <div className="day-summary-buttons">
        <button className="primary-button" onClick={onNewDay}>
          {t.newDay}
        </button>
        <button className="link-button" onClick={onReplay}>
          ↺ {t.replayDay}
        </button>
      </div>
    </div>
  );
}
