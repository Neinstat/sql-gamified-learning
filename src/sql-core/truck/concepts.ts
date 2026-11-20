/**
 * The SQL concepts customers' orders practise (GAME_DESIGN.md §5). Each order template has one
 * concept; the player's mastery of each concept decides which orders come back on which day.
 * Week 2 ("Picky Customers") for now; Phase 6 adds the other weeks.
 */
import type { Lang } from '../feedback';
import { getChapters, type Level } from '../levels';
import { CONCEPT_NAMES_ID } from './locales/id/concepts';

export type ConceptId = 'where-compare' | 'where-text' | 'and' | 'in' | 'like' | 'is-null';

/** In teaching order: new concepts are introduced in this order, a few per day. */
export const CONCEPTS: readonly ConceptId[] = ['where-compare', 'where-text', 'and', 'in', 'like', 'is-null'];

export const CONCEPT_NAMES: Record<ConceptId, string> = {
  'where-compare': 'WHERE with < and >=',
  'where-text': "WHERE with 'text'",
  and: 'Two conditions with AND',
  in: 'A list of values with IN',
  like: 'Patterns with LIKE',
  'is-null': 'Empty values: IS NULL',
};

export const conceptName = (concept: ConceptId, lang: Lang): string =>
  (lang === 'id' ? CONCEPT_NAMES_ID[concept] : undefined) ?? CONCEPT_NAMES[concept];

/** The chapter level whose lesson card teaches each concept (Chapter 1). */
const LESSON_FROM: Record<ConceptId, string> = {
  'where-compare': 'ch1-1',
  'where-text': 'ch1-2',
  and: 'ch1-3',
  in: 'ch1-4',
  like: 'ch1-5',
  'is-null': 'ch1-6',
};

/** The lesson card for a concept, in the player's language. */
export function conceptLesson(concept: ConceptId, lang: Lang): Level['lesson'] {
  const id = LESSON_FROM[concept];
  return getChapters(lang)
    .flatMap((c) => c.levels)
    .find((l) => l.id === id)?.lesson;
}
