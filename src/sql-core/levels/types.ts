import type { CheckOptions } from '../checker';
import type { StationId } from '../stations';

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

/** Shared by every kind of level. */
type LevelBase = {
  /** Unique id, e.g. "ch0-1". Used to save progress — never change it once released. */
  id: string;
  title: string;
  character: CharacterId;
  /** Where in the café the player solves it: the station's console must see the tables used. */
  station: StationId;
  /** Short teaching card shown before the request (new SQL idea for this level). */
  lesson?: { title: string; body: string[]; example?: string };
  /** What the character says, line by line. */
  dialogue: string[];
  /** One clear sentence: what the player must do. Always visible while solving. */
  task: string;
  /** Exactly 3 hints: general direction → clause needed → almost the answer. */
  hints: [string, string, string];
  /** Line the character says after a correct answer. */
  success: string;
  /** Optional "So what?" question asked after reporting (GAME_DESIGN.md §5). */
  soWhat?: SoWhat;
};

/** A request: one question, one correct result. */
export type RequestLevel = LevelBase & {
  kind?: 'request';
  input: InputMode;
  /** The reference answer. Only its *result* is compared, never its text. */
  solution: string;
  check?: CheckOptions;
};

/**
 * A Mini Case (GAME_DESIGN.md §5): the player runs any queries, pins results as evidence,
 * and answers conclusion questions. Always typed freely, in the editor.
 */
export type CaseLevel = LevelBase & {
  kind: 'case';
  /** Editable starting queries the player can load (may contain `___` to fill in). */
  starters: string[];
  questions: CaseQuestion[];
};

export type Level = RequestLevel | CaseLevel;

export const isCase = (level: Level): level is CaseLevel => level.kind === 'case';

/** "So what?": one multiple-choice question about what a result means. Never blocks progress. */
export type SoWhat = {
  question: string;
  choices: string[];
  /** Index of the right choice. */
  answer: number;
  /** Shown after any choice: why the right one is right. */
  explanation: string;
};

export type CaseAnswer =
  /** A number; `tolerance` allows rounding (e.g. 18 for 18.36%). */
  | { kind: 'number'; value: number; tolerance?: number }
  | { kind: 'choice'; choices: string[]; correct: number };

/**
 * What a pinned result must show to back up an answer. `sql` is a reference query:
 * the pinned result must contain all its rows (on its columns, matched by name).
 */
export type Evidence = {
  sql: string;
  /** The pinned result must have exactly as many rows as the reference (no extras). */
  exact?: boolean;
  /** Otherwise: at most this many rows, so "the whole table" isn't evidence. Default: reference rows + 5. */
  maxRows?: number;
};

export type CaseQuestion = {
  prompt: string;
  answer: CaseAnswer;
  /** Several ways to prove it: any one of them is enough (analysts reach the same fact by different queries). */
  evidence: Evidence | Evidence[];
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
  soWhat?: { question: string; choices: string[]; explanation: string };
  /** Mini Case only: each question's prompt, and its choices when it is multiple choice. */
  questions?: { prompt: string; choices?: string[] }[];
};

/** A chapter's translation: chapter text + text for each level, by level id. */
export type ChapterTranslation = {
  title: string;
  summary: string;
  levels: Record<string, LevelText>;
};
