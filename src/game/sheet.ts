/**
 * How a character's walking sheet is laid out: 16×32 frames in one row.
 * For each facing (down, up, side) → standing, step A, step B. "side" faces left;
 * facing right is the same frame flipped.
 */
export const CHAR_W = 16;
export const CHAR_H = 32;
export const FACINGS = ['down', 'up', 'side'] as const;
export const FRAMES_PER_FACING = 3;

/** Frame index for a facing and step, matching the order in the sheet. */
export function frameIndex(facing: (typeof FACINGS)[number], step: number): number {
  return FACINGS.indexOf(facing) * FRAMES_PER_FACING + step;
}
