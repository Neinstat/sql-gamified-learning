/**
 * SQL Valley's fixed palette: warm autumn (GAME_DESIGN.md §3 "Arah visual final").
 * Every final asset uses only these colours, so tiles, characters and portraits match.
 * Our own palette (no third-party licence).
 *
 * Pixel art is written as text grids: one character = one pixel, `.` = transparent.
 * Plain canvas drawing (no Phaser), so the React dialogue box can use it too.
 */
export const PALETTE = {
  // Outline / darkest.
  k: '#2b1d19',
  // Wood, dark → light.
  '1': '#4a2c22',
  '2': '#6e4430',
  '3': '#93603d',
  '4': '#b98154',
  '5': '#d7a571',
  '6': '#ecc995',
  // Cream.
  '7': '#f6e7c8',
  '8': '#fff6e3',
  // Rust, orange, mustard.
  r: '#7c3424',
  o: '#b1532f',
  O: '#d9783d',
  y: '#eda552',
  Y: '#f5cd78',
  // Olive greens.
  g: '#2f3b25',
  G: '#4c5e2f',
  l: '#75853d',
  L: '#a2ad5c',
  m: '#cfd090',
  // Berry.
  b: '#6b2b36',
  B: '#a5494f',
  p: '#d98c7f',
  // Skin.
  s: '#f2c9a2',
  S: '#d39c74',
  q: '#9c6448',
  // Slate / sky.
  n: '#2c3640',
  N: '#4c6170',
  c: '#86a6ac',
  C: '#cfe0d8',
  // Warm stone / grey hair.
  x: '#6f6a66',
  X: '#a59e94',
  z: '#d8d0c4',
} as const;

export type PaletteKey = keyof typeof PALETTE;
export const TRANSPARENT = '.';

export function isPaletteKey(ch: string): ch is PaletteKey {
  return Object.prototype.hasOwnProperty.call(PALETTE, ch);
}

/** Draws a text grid at (x, y); `flipX` mirrors it left ↔ right. */
export function paintGrid(
  ctx: CanvasRenderingContext2D,
  grid: readonly string[],
  x = 0,
  y = 0,
  flipX = false,
): void {
  grid.forEach((row, gy) => {
    const width = row.length;
    for (let gx = 0; gx < width; gx++) {
      const ch = row[gx];
      if (ch === TRANSPARENT || !isPaletteKey(ch)) continue;
      ctx.fillStyle = PALETTE[ch];
      ctx.fillRect(x + (flipX ? width - 1 - gx : gx), y + gy, 1, 1);
    }
  });
}

/** A rectangle in a palette colour. */
export function fill(ctx: CanvasRenderingContext2D, key: PaletteKey, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = PALETTE[key];
  ctx.fillRect(x, y, w, h);
}
