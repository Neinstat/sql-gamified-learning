/**
 * Concept mastery and simple spaced repetition (GAME_DESIGN.md §5). Each concept has a level
 * from 0 to 5 and a day it is due again:
 * - served with ⭐⭐⭐ (no hints, no wrong runs) → one level up, and it comes back later
 *   (1 → 2 → 4 → 7 → 14 days);
 * - served with hints or after wrong runs → one level down, back tomorrow;
 * - the customer gave up waiting → same level, back tomorrow (their order comes back).
 *
 * Mastery is never saved: it is worked out again from the saved day logs, so playing a day again
 * can never count twice. Each day's orders are planned from it: concepts that are due, a few new
 * ones in teaching order, and a little randomness, seeded by the date.
 */
import { CONCEPTS, type ConceptId } from './concepts';
import { FIRST_PLAY_DATE, newDay, parseDayLog, type DayLog } from './day';
import { hashText, orderId, parseOrderId, seeded } from './orders';
import { TEMPLATES } from './templates';

export const MAX_LEVEL = 5;
/** Days until a concept comes back, by its new level (index = level). */
export const INTERVAL_DAYS = [1, 1, 2, 4, 7, 14] as const;

export type ConceptMastery = { level: number; due: string; practised: number };
export type Mastery = Partial<Record<ConceptId, ConceptMastery>>;

/** Orders per day (one per arrival time). */
export const ORDERS_PER_DAY = 7;
/** At most this many new concepts per day (each comes with its lesson card). */
export const NEW_PER_DAY = 3;
/** A concept takes at most this many of a day's orders. */
export const MAX_PER_CONCEPT = 3;

/** "2026-11-01" + 1 → "2026-11-02" */
export function addDays(date: string, days: number): string {
  const t = Date.parse(`${date}T00:00:00Z`) + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** One order handed over: the concept moves up (⭐⭐⭐) or down, and gets a new due day. */
export function practise(mastery: Mastery, concept: ConceptId, date: string, stars: number): Mastery {
  const before = mastery[concept];
  const level = stars >= 3 ? Math.min(MAX_LEVEL, (before?.level ?? 0) + 1) : Math.max(0, (before?.level ?? 0) - 1);
  const due = addDays(date, stars >= 3 ? INTERVAL_DAYS[level] : 1);
  return { ...mastery, [concept]: { level, due, practised: (before?.practised ?? 0) + 1 } };
}

/** A customer left before being served: the concept is due again tomorrow, at the same level. */
export function missed(mastery: Mastery, concept: ConceptId, date: string): Mastery {
  const before = mastery[concept];
  return { ...mastery, [concept]: { level: before?.level ?? 0, due: addDays(date, 1), practised: before?.practised ?? 0 } };
}

/** Mastery after the given days, in order (served orders in the order they were handed over). */
export function masteryFrom(days: readonly DayLog[]): Mastery {
  let mastery: Mastery = {};
  for (const day of days) {
    for (const s of day.served) {
      const found = parseOrderId(s.orderId);
      if (found) mastery = practise(mastery, found.template.concept, day.date, s.stars);
    }
    for (const id of day.missed) {
      const found = parseOrderId(id);
      if (found) mastery = missed(mastery, found.template.concept, day.date);
    }
  }
  return mastery;
}

/**
 * The order ids for a day: first the concepts that are due (weakest first), then up to
 * NEW_PER_DAY new concepts, then a weighted draw where weaker concepts come up more often.
 * No order is repeated within the day, and orders from `recent` days are avoided when there is
 * another variant to use.
 */
export function planDay(date: string, mastery: Mastery, recent: readonly string[] = []): string[] {
  const rand = seeded(hashText(`plan ${date}`));
  const known = CONCEPTS.filter((c) => mastery[c]);
  const due = known
    .filter((c) => mastery[c]!.due <= date)
    .sort((a, b) => mastery[a]!.level - mastery[b]!.level || CONCEPTS.indexOf(a) - CONCEPTS.indexOf(b));
  const fresh = CONCEPTS.filter((c) => !mastery[c]).slice(0, NEW_PER_DAY);

  const slots: ConceptId[] = [];
  const count = (c: ConceptId) => slots.filter((s) => s === c).length;
  for (const c of [...due, ...fresh]) if (slots.length < ORDERS_PER_DAY) slots.push(c);

  // Fill the rest: today's concepts and every concept met before, weaker ones more likely.
  const pool = [...new Set([...known, ...fresh])];
  const weight = (c: ConceptId) => MAX_LEVEL + 1 - (mastery[c]?.level ?? 0);
  while (slots.length < ORDERS_PER_DAY) {
    const open = pool.filter((c) => count(c) < MAX_PER_CONCEPT && ordersLeft(c, slots) > 0);
    if (open.length === 0) break;
    let r = rand() * open.reduce((sum, c) => sum + weight(c), 0);
    const pick = open.find((c) => (r -= weight(c)) < 0) ?? open[open.length - 1];
    slots.push(pick);
  }

  // A different order for each slot: a template of that concept and one of its variants.
  const chosen: string[] = [];
  for (const concept of slots) {
    const options = TEMPLATES.filter((t) => t.concept === concept).flatMap((t) => t.variants.map((v) => orderId(t, v)));
    const unused = options.filter((id) => !chosen.includes(id));
    const notRecent = unused.filter((id) => !recent.includes(id));
    const from = notRecent.length > 0 ? notRecent : unused;
    if (from.length > 0) chosen.push(from[Math.floor(rand() * from.length)]);
  }

  // Shuffle, so the day doesn't always start with the same concept.
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }
  // A day that brings new concepts opens with the first of them (its lesson card comes first).
  const opener = chosen.findIndex((id) => fresh.length > 0 && parseOrderId(id)?.template.concept === fresh[0]);
  if (opener > 0) chosen.unshift(...chosen.splice(opener, 1));
  return chosen;
}

/** How many more orders a concept could still give today. */
function ordersLeft(concept: ConceptId, slots: readonly ConceptId[]): number {
  const total = TEMPLATES.filter((t) => t.concept === concept).reduce((n, t) => n + t.variants.length, 0);
  return total - slots.filter((s) => s === concept).length;
}

/**
 * The day after the given past days (the first play day when there are none), with its orders
 * planned from the mastery those days built. Yesterday's orders are avoided where possible.
 */
export function nextDay(past: readonly DayLog[]): DayLog {
  const last = past[past.length - 1];
  const date = last ? addDays(last.date, 1) : FIRST_PLAY_DATE;
  return newDay(date, planDay(date, masteryFrom(past), last?.orders ?? []));
}

/** The saved past days, oldest first; unreadable days are dropped, and dates must keep rising. */
export function parsePastDays(raw: string | null): DayLog[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as unknown;
    if (!Array.isArray(list)) return [];
    const days: DayLog[] = [];
    for (const item of list) {
      const day = parseDayLog(JSON.stringify(item));
      if (day && (days.length === 0 || day.date > days[days.length - 1].date)) days.push(day);
    }
    return days;
  } catch {
    return [];
  }
}

/** How each concept practised on a day moved: its level before and after, and when it is due. */
export function dayProgress(past: readonly DayLog[], day: DayLog) {
  const before = masteryFrom(past);
  const after = masteryFrom([...past, day]);
  const practisedToday = [...day.served.map((s) => s.orderId), ...day.missed]
    .map((id) => parseOrderId(id)?.template.concept)
    .filter((c): c is ConceptId => c !== undefined);
  return CONCEPTS.filter((c) => practisedToday.includes(c)).map((concept) => ({
    concept,
    before: before[concept]?.level ?? null,
    after: after[concept]!.level,
    due: after[concept]!.due,
  }));
}
