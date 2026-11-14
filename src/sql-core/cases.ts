/**
 * Mini Case / Analysis Case checks (GAME_DESIGN.md §5):
 * a conclusion is right when the answer is right AND a pinned result backs it up.
 * Pure SQL core: no React, no game engine.
 */
import { runQuery, type CafeDatabase } from './db';
import { normalizeValue, type ResultSet } from './checker';
import type { CaseAnswer, CaseQuestion, Evidence } from './levels/types';

/** What the player gave for one question: typed text, or the index of a choice. */
export type GivenAnswer = string | number | null;

export type CaseFeedback =
  | { kind: 'no-answer' }
  | { kind: 'answer-wrong' }
  | { kind: 'no-evidence' }
  | { kind: 'evidence-missing-column'; column: string }
  | { kind: 'evidence-missing-rows'; missing: number }
  | { kind: 'evidence-extra-rows'; actual: number; expected: number }
  | { kind: 'evidence-too-broad'; actual: number; max: number };

export type ConclusionVerdict = { correct: true } | { correct: false; feedback: CaseFeedback };

/** Is the given answer right? Numbers ignore spaces, `$` and trailing zeros ("4", " 4.0 "). */
export function isAnswerRight(answer: CaseAnswer, given: GivenAnswer): boolean {
  if (given === null || given === '') return false;
  if (answer.kind === 'choice') return given === answer.correct;
  const n = Number(String(given).replace(/[\s$,]/g, ''));
  return Number.isFinite(n) && Math.abs(n - answer.value) < 1e-6;
}

/** Does the pinned result back up the answer? */
export async function checkEvidence(db: CafeDatabase, pinned: ResultSet, evidence: Evidence): Promise<ConclusionVerdict> {
  const reference = await runQuery(db, evidence.sql);
  if (!reference.ok) throw new Error(`Evidence query failed: ${JSON.stringify(reference.error)}`);

  // Line up the reference columns with the pinned ones: by name when the names match, otherwise
  // by value (so `revenue`, `total` or an unnamed SUM all count), keeping the best fit.
  const names = pinned.columns.map((c) => c.toLowerCase());
  const candidates = reference.columns.map((column) => {
    const i = names.indexOf(column.toLowerCase());
    return i >= 0 ? [i] : pinned.columns.map((_, j) => j);
  });
  let best: number | null = null;
  for (const order of assignments(candidates)) {
    const missing = missingRows(reference.rows, pinned.rows, order);
    if (best === null || missing < best) best = missing;
    if (best === 0) break;
  }
  if (best === null) {
    const column = reference.columns.find((c) => !names.includes(c.toLowerCase())) ?? reference.columns[0];
    return { correct: false, feedback: { kind: 'evidence-missing-column', column } };
  }
  if (best > 0) return { correct: false, feedback: { kind: 'evidence-missing-rows', missing: best } };

  const expected = reference.rows.length;
  if (evidence.exact && pinned.rows.length !== expected) {
    return { correct: false, feedback: { kind: 'evidence-extra-rows', actual: pinned.rows.length, expected } };
  }
  const max = evidence.maxRows ?? expected + 5;
  if (!evidence.exact && pinned.rows.length > max) {
    return { correct: false, feedback: { kind: 'evidence-too-broad', actual: pinned.rows.length, max } };
  }
  return { correct: true };
}

/** Every way to pick one pinned column per reference column, each pinned column used once. */
function* assignments(candidates: number[][], taken: number[] = []): Generator<number[]> {
  if (taken.length === candidates.length) {
    yield taken;
    return;
  }
  for (const i of candidates[taken.length]) if (!taken.includes(i)) yield* assignments(candidates, [...taken, i]);
}

/** How many reference rows are not found among the pinned rows (pinned columns in `order`). */
function missingRows(reference: unknown[][], pinned: unknown[][], order: number[]): number {
  const key = (row: unknown[]) => JSON.stringify(row.map(normalizeValue));
  const available = new Map<string, number>();
  for (const row of pinned) {
    const k = key(order.map((i) => row[i]));
    available.set(k, (available.get(k) ?? 0) + 1);
  }
  let missing = 0;
  for (const row of reference) {
    const k = key(row);
    const left = available.get(k) ?? 0;
    if (left === 0) missing++;
    else available.set(k, left - 1);
  }
  return missing;
}

/** Check one conclusion: an answer first, then the pinned evidence for it. */
export async function checkConclusion(
  db: CafeDatabase,
  question: CaseQuestion,
  given: GivenAnswer,
  pinned: ResultSet | null,
): Promise<ConclusionVerdict> {
  if (given === null || given === '') return { correct: false, feedback: { kind: 'no-answer' } };
  if (!isAnswerRight(question.answer, given)) return { correct: false, feedback: { kind: 'answer-wrong' } };
  if (!pinned) return { correct: false, feedback: { kind: 'no-evidence' } };
  return checkEvidence(db, pinned, question.evidence);
}
