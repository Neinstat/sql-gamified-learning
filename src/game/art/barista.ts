import { blank, drawSheet, ellipse, FEET_FRONT, FEET_SIDE, finishPortrait, portraitUrl, rect, type Facing } from './characterKit';

/**
 * The Barista in the final autumn style (GAME_DESIGN.md §3): our own pixel art.
 * Short dark hair, rolled-up sleeves, olive apron over a cream shirt, slate trousers.
 */

/** Head and body (rows 0–28), one per facing. Side faces left. */
const DOWN = [
  '................',
  '................',
  '................',
  '.....kkkkkk.....',
  '...kk121121kk...',
  '..k1112111211k..',
  '..k1211111121k..',
  '..k11SSSSSS11k..',
  '..k1SSSSSSSS1k..',
  '..kSSkSSSSkSSk..',
  '..kSSSSSSSSSSk..',
  '..kqSSSbbSSSqk..',
  '...kqSSSSSSqk...',
  '....kkqSSqkk....',
  '...k7G7777G7k...',
  '..k77G7777G77k..',
  '.k77GGGGGGGG77k.',
  '.k77GGgGGgGG77k.',
  '.kSSGGGGGGGGSSk.',
  '.kSSGGGGGGGGSSk.',
  '.kqSGGGGGGGGSqk.',
  '..knGGGGGGGGnk..',
  '..knGGGGGGGGnk..',
  '..kngGGGGGGgnk..',
  '..knnnnkknnnnk..',
  '..knnnk..knnnk..',
  '..knnnk..knnnk..',
  '..knnnk..knnnk..',
  '..kkkkk..kkkkk..',
];

const UP = [
  '................',
  '................',
  '................',
  '.....kkkkkk.....',
  '...kk121121kk...',
  '..k1112111211k..',
  '..k1211111121k..',
  '..k1111111111k..',
  '..k1121111211k..',
  '..k1111111111k..',
  '..k1111111111k..',
  '..kS11111111Sk..',
  '...kSSSSSSSSk...',
  '....kkqSSqkk....',
  '...k77777777k...',
  '..k7777777777k..',
  '.k777777777777k.',
  '.k77G777777G77k.',
  '.kSS77GGGG77SSk.',
  '.kSS777GG777SSk.',
  '.kqS77777777Sqk.',
  '..knnnnnnnnnnk..',
  '..knnnnnnnnnnk..',
  '..knnnnnnnnnnk..',
  '..knnnnkknnnnk..',
  '..knnnk..knnnk..',
  '..knnnk..knnnk..',
  '..knnnk..knnnk..',
  '..kkkkk..kkkkk..',
];

const SIDE = [
  '................',
  '................',
  '................',
  '.....kkkkkk.....',
  '....kk121121k...',
  '...k11211121k...',
  '..k1211111211k..',
  '..kSS11111111k..',
  '..kSSSS111111k..',
  '.kSkSSS11111k...',
  '.kSSSSSq1111k...',
  '..kSbSSSSq11k...',
  '...kqSSSSSqk....',
  '....kkqSqkk.....',
  '....kG7777k.....',
  '...kG777777k....',
  '...kGG77777k....',
  '...kGG7SS77k....',
  '...kGG7SS77k....',
  '...kGGG7SS7k....',
  '...kGGGqSS7k....',
  '...kGGnnnnnk....',
  '...kGGnnnnnk....',
  '...kgGnnnnnk....',
  '....knnnnnnk....',
  '....knnnnnnk....',
  '....knnnnnnk....',
  '....knnnnnnk....',
  '....kkkkkkkk....',
];


const UPPER = { down: DOWN, up: UP, side: SIDE } as const;

/** One 16×32 frame: head and body, then the shoes for this step. */
export function baristaFrame(facing: Facing, step: number): string[] {
  return [...UPPER[facing], ...(facing === 'side' ? FEET_SIDE : FEET_FRONT)[step]];
}

/** The Barista's walking sheet. */
export function drawBaristaSheet(canvas: HTMLCanvasElement): void {
  drawSheet(canvas, baristaFrame);
}

/** The Barista's dialogue portrait as a 64×64 text grid. */
export function baristaPortraitGrid(): string[] {
  const fig = blank();
  // Cream shirt, shaded on the right, under an olive apron with straps and a pocket.
  ellipse(fig, 32, 66, 27, 18, '7');
  ellipse(fig, 32, 66, 27, 18, '6', (x) => x >= 48);
  rect(fig, 22, 52, 20, 12, 'G');
  rect(fig, 38, 52, 4, 12, 'g');
  rect(fig, 22, 47, 3, 6, 'G');
  rect(fig, 39, 47, 3, 6, 'G');
  rect(fig, 28, 57, 8, 5, 'l');
  rect(fig, 33, 54, 1, 4, 'Y');
  // Neck and collar.
  rect(fig, 27, 42, 10, 9, 'S');
  rect(fig, 34, 42, 3, 9, 'q');
  for (let i = 0; i < 5; i++) {
    rect(fig, 25 + i, 47 + i, 3, 1, '8');
    rect(fig, 36 - i, 47 + i, 3, 1, '6');
  }
  // Hair behind the head.
  ellipse(fig, 32, 25, 17, 15, '1', (_x, y) => y <= 30);
  // Ears.
  ellipse(fig, 17.5, 33, 3, 4, 'S');
  ellipse(fig, 46.5, 33, 3, 4, 'q');
  // Face, shaded on the right.
  ellipse(fig, 32, 32, 14, 15, 'S');
  ellipse(fig, 32, 32, 14, 15, 'q', (x, y) => x >= 42 && y >= 26);
  // Short, slightly messy hair on top.
  ellipse(fig, 32, 19, 16, 8, '1', (_x, y) => y <= 23);
  for (const [x, y, w] of [[19, 10, 5], [27, 8, 6], [36, 9, 5], [43, 13, 3]]) rect(fig, x, y, w, 4, '1');
  for (const [x, y] of [[22, 13], [29, 11], [37, 12], [26, 17], [40, 17]]) rect(fig, x, y, 3, 1, '2');
  // Eyebrows, eyes, nose, cheeks, a wide grin.
  rect(fig, 23, 26, 6, 2, '1');
  rect(fig, 35, 26, 6, 2, '1');
  rect(fig, 25, 30, 3, 3, 'k');
  rect(fig, 37, 30, 3, 3, 'k');
  rect(fig, 25, 30, 1, 1, '8');
  rect(fig, 37, 30, 1, 1, '8');
  rect(fig, 31, 34, 2, 3, 'q');
  rect(fig, 20, 37, 4, 2, 'p');
  rect(fig, 40, 37, 4, 2, 'p');
  rect(fig, 27, 40, 10, 2, 'b');
  rect(fig, 28, 40, 8, 1, '8');
  rect(fig, 26, 39, 1, 1, 'b');
  rect(fig, 37, 39, 1, 1, 'b');
  return finishPortrait(fig);
}

/** The Barista's portrait as a data URL. */
export function baristaPortrait(): string {
  return portraitUrl('barista', baristaPortraitGrid);
}

/** For tests: every grid has the right size and only uses palette colours. */
export const BARISTA_GRIDS = { DOWN, UP, SIDE };
