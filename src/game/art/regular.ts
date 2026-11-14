import { blank, drawSheet, ellipse, FEET_FRONT, FEET_SIDE, finishPortrait, portraitUrl, rect, type Facing } from './characterKit';

/**
 * The Regular in the final autumn style (GAME_DESIGN.md §3): our own pixel art.
 * Slate cap, auburn hair, mustard scarf, rust jacket, jeans — always on the way to the market.
 */

/** Head and body (rows 0–28), one per facing. Side faces left. */
const DOWN = [
  '................',
  '................',
  '................',
  '.....kkkkkk.....',
  '....kNNNNNNk....',
  '...kNNcNNNNNk...',
  '..kNNNNNNNNNNk..',
  '.knnnnnnnnnnnnk.',
  '..k3ssssssss3k..',
  '..k3skssskss3k..',
  '..k3ssssssss3k..',
  '..kSsssbbsssSk..',
  '...kSssssssSk...',
  '....kkSssSkk....',
  '..kyyyyyyyyyyk..',
  '..koooyyyyoook..',
  '.kOooooyyooooOk.',
  '.kOooooyyooooOk.',
  '.kOooooooooooOk.',
  '.kOooooooooooOk.',
  '.kSsoooooooosSk.',
  '..kNNNNNNNNNNk..',
  '..kNNNNNNNNNNk..',
  '..kNnNNNNNNnNk..',
  '..kNNNNkkNNNNk..',
  '..kNNNk..kNNNk..',
  '..kNNNk..kNNNk..',
  '..kNNNk..kNNNk..',
  '..kkkkk..kkkkk..',
];

const UP = [
  '................',
  '................',
  '................',
  '.....kkkkkk.....',
  '....kNNNNNNk....',
  '...kNNcNNNNNk...',
  '..kNNNNNNNNNNk..',
  '.knnnnnnnnnnnnk.',
  '..k3333333333k..',
  '..k3433333343k..',
  '..k3333333333k..',
  '..kS33333333Sk..',
  '...kS333333Sk...',
  '....kkSSSSkk....',
  '..kyyyyyyyyyyk..',
  '.koooooooooook..',
  '.kOooooooooooOk.',
  '.kOooooooooooOk.',
  '.kOooooooooooOk.',
  '.kOooooooooooOk.',
  '.kSsoooooooosSk.',
  '..kNNNNNNNNNNk..',
  '..kNNNNNNNNNNk..',
  '..kNnNNNNNNnNk..',
  '..kNNNNkkNNNNk..',
  '..kNNNk..kNNNk..',
  '..kNNNk..kNNNk..',
  '..kNNNk..kNNNk..',
  '..kkkkk..kkkkk..',
];

const SIDE = [
  '................',
  '................',
  '................',
  '.....kkkkkk.....',
  '....kNNNNNNk....',
  '...kNNcNNNNNk...',
  '..kNNNNNNNNNk...',
  'knnnnnNNNNNk....',
  '..ksss33333k....',
  '..kskss3333k....',
  '..kssss3333k....',
  '..ksbsSS333k....',
  '...kSsSS33k.....',
  '.....kssSk......',
  '....kyyyyyyk....',
  '...kyoooooook...',
  '...kyoooOOook...',
  '...kooooOOook...',
  '...kooooOOook...',
  '...koooosSook...',
  '...koooosSook...',
  '....kNNNNNNk....',
  '....kNNNNNNk....',
  '....kNnNNNNk....',
  '....kNNNNNNk....',
  '....kNNNNNNk....',
  '....kNNNNNNk....',
  '....kNNNNNNk....',
  '....kkkkkkkk....',
];


const UPPER = { down: DOWN, up: UP, side: SIDE } as const;

/** One 16×32 frame: head and body, then the shoes for this step. */
export function regularFrame(facing: Facing, step: number): string[] {
  return [...UPPER[facing], ...(facing === 'side' ? FEET_SIDE : FEET_FRONT)[step]];
}

/** The Regular's walking sheet. */
export function drawRegularSheet(canvas: HTMLCanvasElement): void {
  drawSheet(canvas, regularFrame);
}

/** The Regular's dialogue portrait as a 64×64 text grid. */
export function regularPortraitGrid(): string[] {
  const fig = blank();
  // Rust jacket with a collar, and a thick mustard scarf.
  ellipse(fig, 32, 66, 28, 18, 'o');
  ellipse(fig, 32, 66, 28, 18, 'r', (x) => x >= 49);
  rect(fig, 31, 54, 2, 10, 'r');
  ellipse(fig, 32, 49, 15, 6, 'y');
  ellipse(fig, 32, 49, 15, 6, 'O', (x, y) => y >= 51 || x >= 42);
  rect(fig, 36, 51, 5, 10, 'y');
  rect(fig, 39, 51, 2, 10, 'O');
  for (const y of [53, 56, 59]) rect(fig, 36, y, 5, 1, 'O');
  // Neck.
  rect(fig, 28, 40, 8, 6, 's');
  // Auburn hair at the sides, behind the face.
  ellipse(fig, 32, 30, 18, 14, '3', (_x, y) => y >= 22);
  // Ears.
  ellipse(fig, 17.5, 33, 3, 4, 's');
  ellipse(fig, 46.5, 33, 3, 4, 'S');
  // Face, shaded on the right, with freckles.
  ellipse(fig, 32, 32, 14, 14, 's');
  ellipse(fig, 32, 32, 14, 14, 'S', (x, y) => x >= 41 && y >= 26);
  for (const [x, y] of [[22, 36], [24, 37], [21, 38], [40, 36], [42, 37], [39, 38]]) rect(fig, x, y, 1, 1, 'S');
  // Slate cap with a highlight and a brim.
  ellipse(fig, 32, 21, 17, 10, 'N', (_x, y) => y <= 23);
  rect(fig, 24, 13, 8, 1, 'c');
  rect(fig, 14, 22, 36, 3, 'n');
  rect(fig, 30, 11, 4, 2, 'n');
  // Eyebrows, eyes, nose, a friendly smile.
  rect(fig, 23, 27, 5, 1, '2');
  rect(fig, 36, 27, 5, 1, '2');
  rect(fig, 25, 30, 2, 3, 'k');
  rect(fig, 37, 30, 2, 3, 'k');
  rect(fig, 25, 30, 1, 1, '8');
  rect(fig, 37, 30, 1, 1, '8');
  rect(fig, 31, 34, 2, 2, 'S');
  rect(fig, 28, 40, 8, 1, 'b');
  rect(fig, 27, 39, 1, 1, 'b');
  rect(fig, 36, 39, 1, 1, 'b');
  return finishPortrait(fig);
}

/** The Regular's portrait as a data URL. */
export function regularPortrait(): string {
  return portraitUrl('regular', regularPortraitGrid);
}

/** For tests: every grid has the right size and only uses palette colours. */
export const REGULAR_GRIDS = { DOWN, UP, SIDE };
