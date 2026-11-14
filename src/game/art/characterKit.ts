import { CHAR_H, CHAR_W, FACINGS, FRAMES_PER_FACING, frameIndex } from '../placeholderSprites';
import { paintGrid, type PaletteKey } from './palette';

/**
 * Shared tools for the final-style characters (GAME_DESIGN.md §3):
 * walking sheets from text-grid frames, and 64×64 portraits built from simple shapes.
 */

export type Facing = (typeof FACINGS)[number];

/** Draw every frame of a character into one sheet, in the same order as the placeholder sheets. */
export function drawSheet(canvas: HTMLCanvasElement, frame: (facing: Facing, step: number) => string[]): void {
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
      paintGrid(ctx, frame(facing, step), x, 0);
    }
  }
}

/** Shoes for front/back frames (rows 29–31): standing, left foot forward, right foot forward. */
export const FEET_FRONT = [
  ['...kkk....kkk...', '...kkk....kkk...', '................'],
  ['...kkk....kkk...', '...kkk..........', '...kkk..........'],
  ['...kkk....kkk...', '..........kkk...', '..........kkk...'],
];

/** Shoes for side frames (facing left). */
export const FEET_SIDE = [
  ['...kkkk.kkk.....', '...kkkk.kkk.....', '................'],
  ['..kkk...kkk.....', '..kkk....kk.....', '................'],
  ['....kkkkkk......', '.....kkkkk......', '................'],
];

// --- Portrait (64×64) ---------------------------------------------------------------------------

export const SIZE = 64;
export type Layer = (PaletteKey | '.')[][];

export const blank = (): Layer => Array.from({ length: SIZE }, () => Array<PaletteKey | '.'>(SIZE).fill('.'));

export function ellipse(layer: Layer, cx: number, cy: number, rx: number, ry: number, key: PaletteKey, keep = (_x: number, _y: number) => true) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1 && keep(x, y)) layer[y][x] = key;
    }
  }
}

export function rect(layer: Layer, x: number, y: number, w: number, h: number, key: PaletteKey) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) layer[yy][xx] = key;
}

export function ring(layer: Layer, cx: number, cy: number, r: number, key: PaletteKey) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d <= r && d > r - 1.2) layer[y][x] = key;
    }
  }
}

/** Dark outline around the figure: every empty pixel touching it (not the bottom edge). */
export function outline(layer: Layer) {
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

/** The café wall behind every portrait: cream striped wallpaper above wood. */
export function cafeBackground(): Layer {
  const out = blank();
  rect(out, 0, 0, SIZE, SIZE, '7');
  for (const x of [4, 20, 36, 52]) rect(out, x, 0, 2, 50, '6');
  rect(out, 0, 50, SIZE, 2, '5');
  rect(out, 0, 52, SIZE, 12, '4');
  return out;
}

/** Outline the figure, put it on the café background, and return the rows as text. */
export function finishPortrait(fig: Layer): string[] {
  outline(fig);
  const out = cafeBackground();
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (fig[y][x] !== '.') out[y][x] = fig[y][x];
  return out.map((row) => row.join(''));
}

const portraitCache = new Map<string, string>();

/** A portrait grid as a data URL (drawn once per key). */
export function portraitUrl(key: string, grid: () => string[]): string {
  const cached = portraitCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  paintGrid(canvas.getContext('2d')!, grid());
  const url = canvas.toDataURL();
  portraitCache.set(key, url);
  return url;
}
