import { blank, drawSheet, ellipse, FEET_FRONT, FEET_SIDE, finishPortrait, portraitUrl, rect, type Facing } from './characterKit';

/**
 * The Supplier in the final autumn style (GAME_DESIGN.md §3): our own pixel art.
 * Short dark hair and a full beard, olive overalls over a cream shirt, sleeves rolled up.
 */

/** Head and body (rows 0–28), one per facing. Side faces left. */
const DOWN = [
  '................',
  '................',
  '................',
  '.....kkkkkk.....',
  '....k222222k....',
  '...k22222222k...',
  '..k2222222222k..',
  '..k2SSSSSSSS2k..',
  '..kSSSSSSSSSSk..',
  '..kSSkSSSSkSSk..',
  '..k2SSSSSSSS2k..',
  '..k22SSbbSS22k..',
  '...k22222222k...',
  '....kk2222kk....',
  '...k7l7777l7k...',
  '..k77l7777l77k..',
  '.k77llllllll77k.',
  '.k77llGllGll77k.',
  '.kSSllllllllSSk.',
  '.kSSllllllllSSk.',
  '.kqSllllllllSqk.',
  '..kllllllllllk..',
  '..kllllllllllk..',
  '..kGllllllllGk..',
  '..kllllkkllllk..',
  '..klllk..klllk..',
  '..klllk..klllk..',
  '..klllk..klllk..',
  '..kkkkk..kkkkk..',
];

const UP = [
  '................',
  '................',
  '................',
  '.....kkkkkk.....',
  '....k222222k....',
  '...k22222222k...',
  '..k2222222222k..',
  '..k2222222222k..',
  '..k2122222212k..',
  '..k2222222222k..',
  '..kS22222222Sk..',
  '..kS22222222Sk..',
  '...kSSSSSSSSk...',
  '....kkqSSqkk....',
  '...k77777777k...',
  '..k7777777777k..',
  '.k77l777777l77k.',
  '.k777l7777l777k.',
  '.kSS7llllll7SSk.',
  '.kSSllllllllSSk.',
  '.kqSllllllllSqk.',
  '..kllllllllllk..',
  '..kllllllllllk..',
  '..kGllllllllGk..',
  '..kllllkkllllk..',
  '..klllk..klllk..',
  '..klllk..klllk..',
  '..klllk..klllk..',
  '..kkkkk..kkkkk..',
];

const SIDE = [
  '................',
  '................',
  '................',
  '.....kkkkkk.....',
  '....k222222k....',
  '...k22222222k...',
  '..k2222222222k..',
  '..kSSS2222222k..',
  '..kSSSSS22222k..',
  '.kSkSSS22222k...',
  '.kSSSSSq2222k...',
  '..k22bSS222k....',
  '...k222222k.....',
  '....kk22kk......',
  '....kl7777k.....',
  '...kl777777k....',
  '...kll77777k....',
  '...kll7SS77k....',
  '...kll7SS77k....',
  '...klll7SS7k....',
  '...klllqSS7k....',
  '...klllllllk....',
  '...klllllllk....',
  '...kGllllllk....',
  '....kllllllk....',
  '....kllllllk....',
  '....kllllllk....',
  '....kllllllk....',
  '....kkkkkkkk....',
];


const UPPER = { down: DOWN, up: UP, side: SIDE } as const;

/** One 16×32 frame: head and body, then the shoes for this step. */
export function supplierFrame(facing: Facing, step: number): string[] {
  return [...UPPER[facing], ...(facing === 'side' ? FEET_SIDE : FEET_FRONT)[step]];
}

/** The Supplier's walking sheet. */
export function drawSupplierSheet(canvas: HTMLCanvasElement): void {
  drawSheet(canvas, supplierFrame);
}

/** The Supplier's dialogue portrait as a 64×64 text grid. */
export function supplierPortraitGrid(): string[] {
  const fig = blank();
  // Cream shirt under olive overalls with straps and a pocket.
  ellipse(fig, 32, 66, 29, 18, '7');
  ellipse(fig, 32, 66, 29, 18, '6', (x) => x >= 49);
  rect(fig, 21, 54, 22, 10, 'l');
  rect(fig, 38, 54, 5, 10, 'G');
  rect(fig, 21, 48, 4, 7, 'l');
  rect(fig, 39, 48, 4, 7, 'l');
  rect(fig, 22, 54, 2, 2, 'Y');
  rect(fig, 40, 54, 2, 2, 'Y');
  rect(fig, 28, 57, 8, 4, 'G');
  // Neck.
  rect(fig, 27, 42, 10, 8, 'S');
  // Hair behind the head.
  ellipse(fig, 32, 24, 17, 14, '2', (_x, y) => y <= 28);
  // Ears.
  ellipse(fig, 17.5, 32, 3, 4, 'S');
  ellipse(fig, 46.5, 32, 3, 4, 'q');
  // Face, shaded on the right.
  ellipse(fig, 32, 31, 14, 14, 'S');
  ellipse(fig, 32, 31, 14, 14, 'q', (x, y) => x >= 42 && y >= 25);
  // Short hair on top.
  ellipse(fig, 32, 18, 16, 7, '2', (_x, y) => y <= 21);
  rect(fig, 25, 12, 8, 1, '3');
  // A full beard around the mouth and chin.
  ellipse(fig, 32, 40, 14, 9, '2', (_x, y) => y >= 35);
  rect(fig, 19, 31, 3, 6, '2');
  rect(fig, 42, 31, 3, 6, '2');
  rect(fig, 28, 39, 8, 2, 'b');
  rect(fig, 29, 39, 6, 1, 'p');
  rect(fig, 26, 37, 12, 1, '2');
  // Eyebrows, eyes, nose.
  rect(fig, 23, 25, 6, 2, '1');
  rect(fig, 35, 25, 6, 2, '1');
  rect(fig, 25, 29, 3, 3, 'k');
  rect(fig, 37, 29, 3, 3, 'k');
  rect(fig, 25, 29, 1, 1, '8');
  rect(fig, 37, 29, 1, 1, '8');
  rect(fig, 31, 33, 2, 3, 'q');
  return finishPortrait(fig);
}

/** The Supplier's portrait as a data URL. */
export function supplierPortrait(): string {
  return portraitUrl('supplier', supplierPortraitGrid);
}

/** For tests: every grid has the right size and only uses palette colours. */
export const SUPPLIER_GRIDS = { DOWN, UP, SIDE };
