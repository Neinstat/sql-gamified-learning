import { blank, drawSheet, ellipse, FEET_FRONT, FEET_SIDE, finishPortrait, portraitUrl, rect, ring, type Facing } from './characterKit';

/**
 * Grandma in the final autumn style (GAME_DESIGN.md §3): our own pixel art.
 * Silver bun, round glasses, berry cardigan over a cream blouse, brown skirt.
 */

/** Head and body (rows 0–28), one per facing. Side faces left. */
const DOWN = [
  '................',
  '................',
  '......kkkk......',
  '.....kzzzzk.....',
  '.....kzXXzk.....',
  '....kkkkkkkk....',
  '...kzzzzzzzzk...',
  '..kzzzzzzzzzzk..',
  '..kzzXzzzzXzzk..',
  '..kXssssssssXk..',
  '..ks3k3ss3k3sk..',
  '..kspssssssspk..',
  '..kSsssBBsssSk..',
  '...kSssssssSk...',
  '....kk7ss7kk....',
  '...kBB7777BBk...',
  '..kBBbB77BbBBk..',
  '..kBBbB77BbBBk..',
  '.kBBBbB77BbBBBk.',
  '.kBBBbB77BbBBBk.',
  '.kBBkbB77BbkBBk.',
  '.ksSkbBBBBbkSsk.',
  '..k2222222222k..',
  '..k2212222122k..',
  '..k2212222122k..',
  '.k221222222122k.',
  '.k221222222122k.',
  '.k211222222112k.',
  '.kkkkkkkkkkkkkk.',
];

const UP = [
  '................',
  '................',
  '......kkkk......',
  '.....kzzzzk.....',
  '.....kzXXzk.....',
  '....kkkkkkkk....',
  '...kzzzzzzzzk...',
  '..kzzzzzzzzzzk..',
  '..kzXzzzzzzXzk..',
  '..kzXzzXzzzXzk..',
  '..kXzzzXzzzXXk..',
  '..kXXzzzzzXXXk..',
  '..kXXXzzzXXXXk..',
  '...kXXXXXXXXk...',
  '....kkkSSkkk....',
  '...kBBBBBBBBk...',
  '..kBBbBBBBbBBk..',
  '..kBBbBBBBbBBk..',
  '.kBBBbBBBBbBBBk.',
  '.kBBBbBBBBbBBBk.',
  '.kBBkbBBBBbkBBk.',
  '.ksSkbBBBBbkSsk.',
  '..k2222222222k..',
  '..k2212222122k..',
  '..k2212222122k..',
  '.k221222222122k.',
  '.k221222222122k.',
  '.k211222222112k.',
  '.kkkkkkkkkkkkkk.',
];

const SIDE = [
  '................',
  '................',
  '........kkkk....',
  '.......kzzzzk...',
  '.......kzXXzk...',
  '....kkkkkkkkk...',
  '...kzzzzzzzzk...',
  '..kzzzzzzzzzzk..',
  '..kzzzzzzzzXzk..',
  '..ksssszzzzXXk..',
  '.ks3k3szzzzXXk..',
  '.kssspszzzzXXk..',
  '..kssBssXzzXXk..',
  '..kSsssSkXXXk...',
  '.....kssskk.....',
  '....k77BBBBk....',
  '...k77BBbbBBk...',
  '...k7BBBbbBBk...',
  '...k7BBBbbBBk...',
  '...k7BBBbbBBk...',
  '...k7BBBbbBBk...',
  '...kBBBBsSBBk...',
  '...k22222222k...',
  '..k2212221222k..',
  '..k2212221222k..',
  '..k2212221222k..',
  '..k2112222112k..',
  '..k2222222222k..',
  '..kkkkkkkkkkkk..',
];

const UPPER = { down: DOWN, up: UP, side: SIDE } as const;

/** One 16×32 frame: head and body, then the feet for this step. */
export function grandmaFrame(facing: Facing, step: number): string[] {
  return [...UPPER[facing], ...(facing === 'side' ? FEET_SIDE : FEET_FRONT)[step]];
}

/** Grandma's walking sheet. */
export function drawGrandmaSheet(canvas: HTMLCanvasElement): void {
  drawSheet(canvas, grandmaFrame);
}

/** Grandma's dialogue portrait as a 64×64 text grid (testable without a canvas). */
export function grandmaPortraitGrid(): string[] {
  const fig = blank();
  // Cardigan shoulders, shaded on the right.
  ellipse(fig, 32, 66, 28, 18, 'B');
  ellipse(fig, 32, 66, 28, 18, 'b', (x) => x >= 48);
  rect(fig, 31, 52, 2, 12, 'b');
  for (const y of [55, 60]) rect(fig, 34, y, 2, 2, 'Y');
  // Neck and blouse collar.
  rect(fig, 27, 42, 10, 9, 's');
  rect(fig, 34, 42, 3, 9, 'S');
  for (let i = 0; i < 6; i++) {
    rect(fig, 24 + i, 48 + i, 3, 1, '8');
    rect(fig, 37 - i, 48 + i, 3, 1, '7');
  }
  // Hair behind the face, and the bun.
  ellipse(fig, 32, 29, 20, 19, 'z');
  ellipse(fig, 32, 29, 20, 19, 'X', (x, y) => x >= 44 || y >= 40);
  ellipse(fig, 32, 10, 10, 7, 'z');
  ellipse(fig, 32, 10, 10, 7, 'X', (x, y) => y >= 13 || x >= 38);
  rect(fig, 28, 6, 4, 1, '8');
  // Ears with little pearl earrings.
  ellipse(fig, 17.5, 35, 3, 4, 's');
  ellipse(fig, 46.5, 35, 3, 4, 'S');
  rect(fig, 17, 39, 2, 2, '8');
  rect(fig, 46, 39, 2, 2, '7');
  // Face, shaded on the right.
  ellipse(fig, 32, 34, 14, 15, 's');
  ellipse(fig, 32, 34, 14, 15, 'S', (x, y) => x >= 41 && y >= 28);
  // Fringe swept to the side.
  ellipse(fig, 32, 20, 17, 8, 'z', (_x, y) => y <= 24);
  ellipse(fig, 27, 22, 8, 4, 'z');
  for (const [x, y] of [[22, 18], [26, 16], [36, 17], [41, 19]]) rect(fig, x, y, 3, 1, 'X');
  rect(fig, 30, 13, 6, 1, '8');
  // Eyebrows, eyes, round glasses.
  rect(fig, 23, 27, 5, 1, 'X');
  rect(fig, 36, 27, 5, 1, 'X');
  rect(fig, 25, 32, 2, 3, 'k');
  rect(fig, 37, 32, 2, 3, 'k');
  rect(fig, 25, 32, 1, 1, '8');
  rect(fig, 37, 32, 1, 1, '8');
  ring(fig, 25.5, 33.5, 5, '3');
  ring(fig, 38.5, 33.5, 5, '3');
  rect(fig, 30, 33, 4, 1, '3');
  rect(fig, 22, 31, 1, 1, '8');
  rect(fig, 35, 31, 1, 1, '8');
  // Nose, cheeks, smile, laugh lines.
  rect(fig, 31, 37, 2, 2, 'S');
  rect(fig, 20, 39, 4, 2, 'p');
  rect(fig, 40, 39, 4, 2, 'p');
  rect(fig, 28, 43, 8, 1, 'b');
  rect(fig, 27, 42, 1, 1, 'b');
  rect(fig, 36, 42, 1, 1, 'b');
  rect(fig, 29, 44, 6, 1, 'B');
  rect(fig, 19, 33, 1, 2, 'S');
  rect(fig, 44, 33, 1, 2, 'q');
  return finishPortrait(fig);
}

/** Grandma's portrait as a data URL. */
export function grandmaPortrait(): string {
  return portraitUrl('grandma', grandmaPortraitGrid);
}

/** For tests: every grid has the right size and only uses palette colours. */
export const GRANDMA_GRIDS = { DOWN, UP, SIDE, FEET_FRONT, FEET_SIDE };
