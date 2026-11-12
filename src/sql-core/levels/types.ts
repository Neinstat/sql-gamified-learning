import type { CheckOptions } from '../checker';

/** People in the café who give the player requests. */
export type CharacterId = 'grandma' | 'barista' | 'supplier' | 'regular';

/**
 * How the player writes the query (see GAME_DESIGN.md §6):
 * - blocks:     arrange word blocks into a query (puzzle-style)
 * - fill-blank: a query with gaps; `___` marks each gap
 * - free:       type the whole query in the editor
 */
export type InputMode =
  | {
      kind: 'blocks';
      /**
       * Every block shown to the player, in display order.
       * Must contain all tokens of the solution; may add distractors.
       * Don't list them in answer order — that gives the answer away.
       */
      blocks: string[];
    }
  | {
      kind: 'fill-blank';
      /** The query with gaps; each `___` is one gap. */
      template: string;
      /**
       * One reference answer per gap, in order. Not used for grading (the
       * result is graded) — tests use it to check the template is solvable.
       */
      answers: string[];
    }
  | { kind: 'free'; starter?: string };

/** The gap marker used in fill-blank templates. */
export const BLANK = '___';

export type Level = {
  /** Unique id, e.g. "ch0-1". Used to save progress — never change it once released. */
  id: string;
  title: string;
  character: CharacterId;
  /** Short teaching card shown before the request (new SQL idea for this level). */
  lesson?: { title: string; body: string[]; example?: string };
  /** What the character says, line by line. */
  dialogue: string[];
  /** One clear sentence: what the result must contain. Always visible while solving. */
  task: string;
  input: InputMode;
  /** The reference answer. Only its *result* is compared, never its text. */
  solution: string;
  check?: CheckOptions;
  /** Exactly 3 hints: general direction → clause needed → almost the answer. */
  hints: [string, string, string];
  /** Line the character says after a correct answer. */
  success: string;
};

export type Chapter = {
  id: number;
  title: string;
  /** One sentence shown on the chapter card. */
  summary: string;
  levels: Level[];
};

/**
 * Translated text for one level. SQL (lesson examples, solution, blocks)
 * is never translated, so it is not part of this type.
 */
export type LevelText = {
  title: string;
  lesson?: { title: string; body: string[] };
  dialogue: string[];
  task: string;
  hints: [string, string, string];
  success: string;
};

/** A chapter's translation: chapter text + text for each level, by level id. */
export type ChapterTranslation = {
  title: string;
  summary: string;
  levels: Record<string, LevelText>;
};
