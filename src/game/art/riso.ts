/**
 * The food truck's "risograph print" look (GAME_DESIGN.md §14.8): a few flat inks on cream paper,
 * dithered dots instead of extra shades, and outlines that are slightly mis-registered, like a riso
 * print where the red layer landed one pixel off. Our own palette (no third-party licence).
 *
 * Plain canvas drawing (no Phaser), so it can be tested.
 */
export const RISO = {
  // Paper.
  paper: '#f4ead5',
  paperShade: '#e6d6b6',
  white: '#fffaf0',
  // Ink (outlines, text) — a deep blue, not black.
  ink: '#25304f',
  inkSoft: '#4a5878',
  // Tomato red (the "mis-registered" layer).
  red: '#e4573d',
  redDark: '#a83b2a',
  pink: '#f3a59a',
  // Teal.
  teal: '#2b9c8e',
  tealDark: '#1c6b63',
  tealLight: '#9ad6c8',
  // Mustard.
  mustard: '#f2b234',
  mustardDark: '#c58a1f',
  // Dusk sky.
  peach: '#f8c7a4',
  lilac: '#c9b3d9',
  // Park.
  grass: '#79b25d',
  grassDark: '#4f8a49',
  // Wood.
  wood: '#c27b4b',
  woodDark: '#8a5134',
  // Skin tones.
  skin1: '#f6cfae',
  skin2: '#d9a07a',
  skin3: '#9a6446',
} as const;

export type Ink = keyof typeof RISO;

type Ctx = CanvasRenderingContext2D;

export function rect(ctx: Ctx, ink: Ink, x: number, y: number, w: number, h: number): void {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = RISO[ink];
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/**
 * Dots of `ink` over whatever is already there, in a fixed pattern (aligned to the canvas so
 * neighbouring shapes line up): 'half' = checkerboard, 'light' = every 4th pixel, 'heavy' = 3 of 4.
 */
export function dither(ctx: Ctx, ink: Ink, x: number, y: number, w: number, h: number, density: 'light' | 'half' | 'heavy' = 'half'): void {
  ctx.fillStyle = RISO[ink];
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  for (let py = y0; py < y0 + Math.round(h); py++) {
    for (let px = x0; px < x0 + Math.round(w); px++) {
      const odd = (px + py) % 2 === 1;
      const on =
        density === 'half'
          ? odd
          : density === 'light'
            ? px % 2 === 0 && py % 2 === 0 && (px / 2 + py / 2) % 2 === 0
            : !(px % 2 === 0 && py % 2 === 0);
      if (on) ctx.fillRect(px, py, 1, 1);
    }
  }
}

/** A filled disc. `onlyTop` draws the upper half (domes, hair, sun on the horizon). */
export function disc(ctx: Ctx, ink: Ink, cx: number, cy: number, r: number, onlyTop = false): void {
  ctx.fillStyle = RISO[ink];
  for (let y = -r; y <= (onlyTop ? 0 : r); y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2 + 1, 1);
  }
}

/** A 1 px line. */
export function line(ctx: Ctx, ink: Ink, x0: number, y0: number, x1: number, y1: number): void {
  ctx.fillStyle = RISO[ink];
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    ctx.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), 1, 1);
  }
}

/**
 * The signature shape: a flat box with an ink outline, and a red outline printed 1 px off
 * (down-right) behind it, like a mis-registered riso layer.
 */
export function printBox(ctx: Ctx, fillInk: Ink, x: number, y: number, w: number, h: number, misprint = true): void {
  if (misprint) rect(ctx, 'red', x + 1, y + 1, w, h);
  rect(ctx, 'ink', x, y, w, h);
  rect(ctx, fillInk, x + 1, y + 1, w - 2, h - 2);
}

/** A soft-cornered filled shape (bodies, cushions). */
export function soft(ctx: Ctx, ink: Ink, x: number, y: number, w: number, h: number, r = 3): void {
  for (let i = 0; i < r && i < h; i++) {
    const inset = r - i;
    rect(ctx, ink, x + inset, y + i, w - inset * 2, 1);
  }
  rect(ctx, ink, x, y + r, w, h - r);
}
