import { CHAR_H, CHAR_W, FACINGS, FRAMES_PER_FACING, frameIndex } from '../placeholderSprites';
import { paintGrid, type PaletteKey } from './palette';

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

/** Feet (rows 29–31) per step: standing, left foot forward, right foot forward. */
const FEET_FRONT = [
  ['...kkk....kkk...', '...kkk....kkk...', '................'],
  ['...kkk....kkk...', '...kkk..........', '...kkk..........'],
  ['...kkk....kkk...', '..........kkk...', '..........kkk...'],
];
const FEET_SIDE = [
  ['...kkkk.kkk.....', '...kkkk.kkk.....', '................'],
  ['..kkk...kkk.....', '..kkk....kk.....', '................'],
  ['....kkkkkk......', '.....kkkkk......', '................'],
];

const UPPER = { down: DOWN, up: UP, side: SIDE } as const;

/** One 16×32 frame: head and body, then the feet for this step. */
export function grandmaFrame(facing: (typeof FACINGS)[number], step: number): string[] {
  return [...UPPER[facing], ...(facing === 'side' ? FEET_SIDE : FEET_FRONT)[step]];
}

/** All frames in the same order as the placeholder sheets (see placeholderSprites.ts). */
export function drawGrandmaSheet(canvas: HTMLCanvasElement): void {
  canvas.width = FACINGS.length * FRAMES_PER_FACING * CHAR_W;
  canvas.height = CHAR_H;
  const ctx = canvas.getContext('2d')!;
  for (const facing of FACINGS) {
    for (let step = 0; step < FRAMES_PER_FACING; step++) {
      const x = frameIndex(facing, step) * CHAR_W;
      // A soft shadow under the feet, then the character.
      ctx.fillStyle = 'rgba(43, 29, 25, 0.25)';
      ctx.fillRect(x + 3, CHAR_H - 2, 10, 2);
      ctx.fillRect(x + 4, CHAR_H - 3, 8, 1);
      paintGrid(ctx, grandmaFrame(facing, step), x, 0);
    }
  }
}

// --- Portrait (64×64) ---------------------------------------------------------------------------

const SIZE = 64;
type Layer = (PaletteKey | '.')[][];

const blank = (): Layer => Array.from({ length: SIZE }, () => Array<PaletteKey | '.'>(SIZE).fill('.'));

function ellipse(layer: Layer, cx: number, cy: number, rx: number, ry: number, key: PaletteKey, keep = (_x: number, _y: number) => true) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1 && keep(x, y)) layer[y][x] = key;
    }
  }
}

function rect(layer: Layer, x: number, y: number, w: number, h: number, key: PaletteKey) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) layer[yy][xx] = key;
}

function ring(layer: Layer, cx: number, cy: number, r: number, key: PaletteKey) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= r && d > r - 1.2) layer[y][x] = key;
    }
  }
}

/** Dark outline around the figure: every empty pixel touching it (not the bottom edge). */
function outline(layer: Layer) {
  const edge: [number, number][] = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (layer[y][x] !== '.') continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const v = layer[y + dy]?.[x + dx];
        return v !== undefined && v !== '.' && v !== 'k';
      });
      if (near) edge.push([x, y]);
    }
  }
  for (const [x, y] of edge) layer[y][x] = 'k';
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
  outline(fig);

  // Warm background: cream wallpaper with the café's stripes, wainscot below.
  const out = blank();
  rect(out, 0, 0, SIZE, SIZE, '7');
  for (const x of [4, 20, 36, 52]) rect(out, x, 0, 2, 50, '6');
  rect(out, 0, 50, SIZE, 2, '5');
  rect(out, 0, 52, SIZE, 12, '4');
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (fig[y][x] !== '.') out[y][x] = fig[y][x];
  return out.map((row) => row.join(''));
}

let portraitUrl: string | null = null;

/** Grandma's portrait as a data URL (drawn once). */
export function grandmaPortrait(): string {
  if (portraitUrl) return portraitUrl;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  paintGrid(canvas.getContext('2d')!, grandmaPortraitGrid());
  portraitUrl = canvas.toDataURL();
  return portraitUrl;
}

/** For tests: every grid has the right size and only uses palette colours. */
export const GRANDMA_GRIDS = { DOWN, UP, SIDE, FEET_FRONT, FEET_SIDE };
