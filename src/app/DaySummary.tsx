import { useEffect, useState } from 'react';
import type { UiText } from '../i18n';
import { runQuery, type CafeDatabase } from '../sql-core/db';
import { revenueSql, type DayLog } from '../sql-core/truck/day';
import { PROTOTYPE_ORDERS } from '../sql-core/truck/orders';

const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * The end-of-day summary (GAME_DESIGN.md §4): orders served and missed, revenue, tips and stars.
 * Revenue comes from a real query on today's sales, shown so the summary is a small lesson too.
 */
export function DaySummary({
  db,
  day,
  dateLabel,
  t,
  onNewDay,
}: {
  db: CafeDatabase | null;
  day: DayLog;
  dateLabel: string;
  t: UiText;
  onNewDay: () => void;
}) {
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
            {day.served.length}/{PROTOTYPE_ORDERS.length}
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
          <dt>{t.summaryStars}</dt>
          <dd>
            ⭐ {stars}/{PROTOTYPE_ORDERS.length * 3}
          </dd>
        </div>
      </dl>
      <p className="day-summary-label">{t.summaryQuery}</p>
      <pre className="day-summary-sql">
        <code>{sql}</code>
      </pre>
      <p className="day-summary-next">{t.summaryNext}</p>
      <button className="primary-button" onClick={onNewDay}>
        ↺ {t.newDay}
      </button>
    </div>
  );
}
