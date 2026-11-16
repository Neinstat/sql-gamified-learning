/**
 * The food truck interior (GAME_DESIGN.md §14.8): a side-on cut-away, wider than the screen.
 * The player walks along the floor in front of the back wall; customers stand outside the serving
 * window in that wall. Plain canvas calls in palette colours, so it needs no Phaser and is tested.
 *
 * ⚠ Every drawing here is a PLACEHOLDER (docs/ASSETS.md) until final art is chosen in Phase 7.
 */
import { fill, PALETTE, type PaletteKey } from '../art/palette';

/** The screen (base resolution) and the world the camera moves across. */
export const TRUCK_W = 480;
export const TRUCK_H = 270;
export const WORLD_W = 960;

/** Largest whole-number zoom that fits (sharp pixels); smaller screens get a fractional fit. */
export function truckZoom(width: number, height: number): number {
  const fit = Math.min(width / TRUCK_W, height / TRUCK_H);
  return fit >= 1 ? Math.floor(fit) : fit;
}

/** Where things are, in world pixels. */
export const TRUCK_LAYOUT = {
  /** Where the back wall meets the floor. */
  floorTop: 168,
  /** The serving window; its sill (the counter customers lean on) is at `y + h`. */
  window: { x: 200, y: 36, w: 320, h: 114 },
  sillH: 12,
  /** Customers' waists are hidden just below the sill. */
  customerBaseY: 162,
  tablet: { x: 462, y: 124, w: 46, h: 26 },
  fridge: { x: 52, y: 44, w: 84, h: 124 },
  prepCounter: { x: 548, y: 120, w: 156, h: 48 },
  coffeeMachine: { x: 566, y: 84, w: 52, h: 36 },
  menuBoard: { x: 630, y: 26, w: 70, h: 82 },
  recipeShelf: { x: 724, y: 54, w: 72, h: 114 },
  door: { x: 826, y: 30, w: 70, h: 138 },
} as const;

type Ctx = CanvasRenderingContext2D;

function disc(ctx: Ctx, key: PaletteKey, cx: number, cy: number, r: number): void {
  ctx.fillStyle = PALETTE[key];
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
  }
}

function line(ctx: Ctx, key: PaletteKey, x0: number, y0: number, x1: number, y1: number): void {
  ctx.fillStyle = PALETTE[key];
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    ctx.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), 1, 1);
  }
}

/** A dark outline box with a filled inside. */
function box(ctx: Ctx, key: PaletteKey, x: number, y: number, w: number, h: number, outline: PaletteKey = 'k'): void {
  fill(ctx, outline, x, y, w, h);
  fill(ctx, key, x + 1, y + 1, w - 2, h - 2);
}

// ── The street seen through the window (scrolls slower: parallax) ──────────────────────────

/** Width of the street layer; it moves at OUTSIDE_PARALLAX of the camera speed. */
export const OUTSIDE_W = WORLD_W;
export const OUTSIDE_PARALLAX = 0.6;

export function paintOutside(ctx: Ctx): void {
  const ground = 140;
  fill(ctx, 'C', 0, 0, OUTSIDE_W, ground);
  fill(ctx, 'c', 0, ground - 52, OUTSIDE_W, 12);
  for (const [cx, cy] of [[80, 40], [260, 30], [420, 50], [620, 36], [800, 46]] as const) {
    fill(ctx, '8', cx - 18, cy, 36, 5);
    fill(ctx, '8', cx - 10, cy - 4, 20, 4);
  }
  const shades: PaletteKey[] = ['N', 'x', 'X', 'N', 'x'];
  for (let i = 0; i * 44 < OUTSIDE_W; i++) {
    const bx = i * 44;
    const bw = Math.min(40, OUTSIDE_W - bx);
    const bh = 50 + ((i * 37) % 46);
    const top = ground - bh;
    fill(ctx, shades[i % shades.length], bx, top, bw, bh);
    fill(ctx, 'k', bx, top, bw, 1);
    for (let wy = top + 7; wy < ground - 8; wy += 11) {
      for (let wx = bx + 5; wx + 5 <= bx + bw && wx < bx + 34; wx += 9) fill(ctx, (wx + wy) % 4 === 0 ? 'Y' : 'n', wx, wy, 5, 6);
    }
  }
  // Trees and a lamp post.
  for (const tx of [150, 470, 760]) {
    fill(ctx, '2', tx, ground - 34, 6, 34);
    disc(ctx, 'G', tx + 3, ground - 46, 17);
    disc(ctx, 'l', tx - 2, ground - 52, 9);
  }
  fill(ctx, 'n', 330, ground - 60, 3, 60);
  fill(ctx, 'Y', 326, ground - 64, 11, 5);
  // Sidewalk.
  fill(ctx, 'X', 0, ground, OUTSIDE_W, TRUCK_H - ground);
  fill(ctx, 'z', 0, ground, OUTSIDE_W, 2);
  for (let sx = 20; sx < OUTSIDE_W; sx += 48) fill(ctx, 'x', sx, ground + 2, 1, TRUCK_H - ground - 2);
}

// ── Inside the truck (drawn over the customers, with the window left see-through) ─────────

function wallAndFloor(ctx: Ctx): void {
  const { floorTop } = TRUCK_LAYOUT;
  // Brushed steel wall panels.
  fill(ctx, 'z', 0, 0, WORLD_W, floorTop);
  for (let x = 0; x < WORLD_W; x += 64) {
    fill(ctx, 'X', x, 14, 1, floorTop - 14);
    for (let y = 24; y < floorTop; y += 26) fill(ctx, 'X', x + 4, y, 1, 1);
  }
  // Ceiling with lamps.
  fill(ctx, 'x', 0, 0, WORLD_W, 14);
  fill(ctx, 'k', 0, 14, WORLD_W, 1);
  for (let lx = 80; lx < WORLD_W; lx += 140) {
    fill(ctx, 'k', lx, 15, 1, 6);
    fill(ctx, 'n', lx - 7, 21, 15, 5);
    fill(ctx, 'Y', lx - 5, 26, 11, 2);
  }
  // Skirting and wooden floor planks.
  fill(ctx, '2', 0, floorTop - 4, WORLD_W, 4);
  fill(ctx, '4', 0, floorTop, WORLD_W, TRUCK_H - floorTop);
  for (let y = floorTop + 12; y < TRUCK_H; y += 14) fill(ctx, '3', 0, y, WORLD_W, 1);
  for (let row = 0; floorTop + row * 14 < TRUCK_H; row++) {
    const h = Math.min(13, TRUCK_H - (floorTop + row * 14));
    for (let x = (row % 2) * 40; x < WORLD_W; x += 80) fill(ctx, '3', x, floorTop + row * 14, 1, h);
  }
  fill(ctx, '5', 0, floorTop, WORLD_W, 1);
  // The ends of the truck.
  fill(ctx, 'n', 0, 0, 16, TRUCK_H);
  fill(ctx, 'n', WORLD_W - 16, 0, 16, TRUCK_H);
  fill(ctx, 'N', 15, 0, 1, TRUCK_H);
  fill(ctx, 'N', WORLD_W - 16, 0, 1, TRUCK_H);
}

function serviceWindow(ctx: Ctx): void {
  const { window: w, sillH } = TRUCK_LAYOUT;
  // Frame.
  fill(ctx, 'n', w.x - 6, w.y - 6, w.w + 12, 6);
  fill(ctx, 'n', w.x - 6, w.y, 6, w.h);
  fill(ctx, 'n', w.x + w.w, w.y, 6, w.h);
  // Rolled-up shutter at the top.
  fill(ctx, 'x', w.x, w.y, w.w, 6);
  for (let x = w.x; x < w.x + w.w; x += 4) fill(ctx, 'X', x, w.y + 1, 1, 4);
  // The sill / serving counter, and the panel below it.
  const sy = w.y + w.h;
  fill(ctx, '8', w.x - 12, sy, w.w + 24, 2);
  fill(ctx, 'X', w.x - 12, sy + 2, w.w + 24, sillH - 4);
  fill(ctx, 'x', w.x - 12, sy + sillH - 2, w.w + 24, 2);
  fill(ctx, '3', w.x - 4, sy + sillH, w.w + 8, TRUCK_LAYOUT.floorTop - 4 - sy - sillH);
  for (let x = w.x + 20; x < w.x + w.w - 40; x += 80) fill(ctx, '2', x, sy + sillH + 2, 60, 1);
}

function sillItems(ctx: Ctx): void {
  const { window: w, tablet: t } = TRUCK_LAYOUT;
  const sy = w.y + w.h;
  // Tip jar and napkins.
  fill(ctx, 'c', w.x + 16, sy - 18, 16, 18);
  fill(ctx, 'C', w.x + 18, sy - 16, 12, 15);
  fill(ctx, 'y', w.x + 19, sy - 7, 10, 6);
  fill(ctx, 'N', w.x + 15, sy - 20, 18, 2);
  box(ctx, 'x', w.x + 40, sy - 12, 18, 12);
  fill(ctx, '8', w.x + 42, sy - 16, 14, 5);
  // Tablet (POS) on a stand.
  fill(ctx, 'x', t.x + t.w / 2 - 5, t.y + t.h - 4, 10, 4);
  box(ctx, 'n', t.x, t.y, t.w, t.h - 4);
  fill(ctx, 'L', t.x + 4, t.y + 4, 16, 2);
  fill(ctx, 'c', t.x + 4, t.y + 8, 30, 2);
  fill(ctx, 'c', t.x + 4, t.y + 12, 22, 2);
  fill(ctx, 'y', t.x + 4, t.y + 16, 10, 2);
}

function fridge(ctx: Ctx): void {
  const f = TRUCK_LAYOUT.fridge;
  box(ctx, 'C', f.x, f.y, f.w, f.h);
  fill(ctx, 'z', f.x + 2, f.y + 2, f.w - 4, 3);
  // Glass door with shelves of bottles and cartons.
  box(ctx, 'c', f.x + 6, f.y + 10, f.w - 12, f.h - 30, 'N');
  for (let s = 0; s < 4; s++) {
    const sy = f.y + 34 + s * 24;
    fill(ctx, 'X', f.x + 8, sy, f.w - 16, 2);
    for (let i = 0; i < 6; i++) {
      const colour: PaletteKey = (['8', 'Y', 'p', 'L', '8', 'O'] as const)[(i + s) % 6];
      fill(ctx, colour, f.x + 11 + i * 11, sy - 14, 8, 14);
      fill(ctx, 'k', f.x + 11 + i * 11, sy - 14, 8, 1);
    }
  }
  fill(ctx, 'k', f.x + f.w - 12, f.y + 40, 3, 30);
  // Feet and a little stock clipboard.
  fill(ctx, 'k', f.x + 6, f.y + f.h - 6, 10, 6);
  fill(ctx, 'k', f.x + f.w - 16, f.y + f.h - 6, 10, 6);
  box(ctx, '8', f.x + f.w + 4, f.y + 40, 18, 24);
  for (let i = 0; i < 4; i++) fill(ctx, 'x', f.x + f.w + 7, f.y + 46 + i * 4, 12, 1);
}

function prepAndCoffee(ctx: Ctx): void {
  const p = TRUCK_LAYOUT.prepCounter;
  fill(ctx, '8', p.x, p.y, p.w, 2);
  fill(ctx, 'X', p.x, p.y + 2, p.w, 6);
  box(ctx, '3', p.x + 2, p.y + 8, p.w - 4, p.h - 8, '2');
  for (let x = p.x + 6; x < p.x + p.w - 30; x += 50) {
    box(ctx, '4', x, p.y + 12, 44, p.h - 16, '2');
    fill(ctx, '6', x + 38, p.y + 24, 2, 8);
  }
  const c = TRUCK_LAYOUT.coffeeMachine;
  box(ctx, 'x', c.x, c.y, c.w, c.h);
  fill(ctx, 'X', c.x + 2, c.y + 2, c.w - 4, 6);
  fill(ctx, 'k', c.x + 10, c.y + 14, 8, 6);
  fill(ctx, 'k', c.x + 32, c.y + 14, 8, 6);
  fill(ctx, '7', c.x + 11, c.y + 26, 7, 9);
  fill(ctx, 'O', c.x + 11, c.y + 29, 7, 3);
  disc(ctx, 'y', c.x + c.w - 8, c.y + 8, 2);
  // Stacked cups.
  for (let i = 0; i < 3; i++) fill(ctx, '7', c.x + c.w + 10, p.y - 8 - i * 7, 10, 7);
}

function menuBoard(ctx: Ctx): void {
  const m = TRUCK_LAYOUT.menuBoard;
  fill(ctx, '2', m.x - 4, m.y - 4, m.w + 8, m.h + 8);
  fill(ctx, 'g', m.x, m.y, m.w, m.h);
  fill(ctx, 'Y', m.x + 10, m.y + 7, m.w - 20, 3);
  for (let i = 0; i < 6; i++) {
    const ly = m.y + 18 + i * 10;
    fill(ctx, 'm', m.x + 6, ly, 28 + ((i * 9) % 14), 2);
    fill(ctx, '8', m.x + m.w - 15, ly, 9, 2);
  }
}

function recipeShelf(ctx: Ctx): void {
  const r = TRUCK_LAYOUT.recipeShelf;
  box(ctx, '3', r.x, r.y, r.w, r.h, '1');
  for (let s = 0; s < 3; s++) {
    const sy = r.y + 36 + s * 36;
    fill(ctx, '2', r.x + 2, sy, r.w - 4, 3);
    // Books (the middle shelf holds the recipe binders).
    let bx = r.x + 6;
    for (let i = 0; bx < r.x + r.w - 10; i++) {
      const colour: PaletteKey =
        s === 1 ? (['O', 'O', 'r', 'O'] as const)[i % 4] : (['B', 'G', 'N', 'y', 'b'] as const)[(i + s) % 5];
      const bw = 6 + (i % 3) * 2;
      const bh = 22 + ((i * 5) % 8);
      fill(ctx, 'k', bx, sy - bh, bw, bh);
      fill(ctx, colour, bx + 1, sy - bh + 1, bw - 2, bh - 1);
      bx += bw + 1;
    }
  }
}

function backDoor(ctx: Ctx): void {
  const d = TRUCK_LAYOUT.door;
  fill(ctx, 'n', d.x - 4, d.y - 4, d.w + 8, d.h + 4);
  fill(ctx, 'N', d.x, d.y, d.w, d.h);
  fill(ctx, 'c', d.x + 2, d.y, 1, d.h);
  box(ctx, 'C', d.x + 16, d.y + 14, d.w - 32, 40, 'n');
  fill(ctx, 'c', d.x + 17, d.y + 38, d.w - 34, 15);
  fill(ctx, '8', d.x + 20, d.y + 18, 3, 12);
  fill(ctx, 'k', d.x + d.w - 14, d.y + 70, 6, 16);
  fill(ctx, 'Y', d.x + d.w - 13, d.y + 71, 4, 14);
  fill(ctx, 'x', d.x + 4, d.y + d.h - 24, d.w - 8, 20);
  fill(ctx, 'X', d.x + 4, d.y + d.h - 24, d.w - 8, 1);
}

/** The wall clock above the coffee machine; drawn separately so it can show the time of day. */
export const CLOCK = { cx: 584, cy: 50, r: 15 } as const;

export function paintClock(ctx: Ctx, hour: number, minute: number): void {
  const { cx, cy, r } = CLOCK;
  disc(ctx, 'k', cx, cy, r + 1);
  disc(ctx, 'o', cx, cy, r);
  disc(ctx, '8', cx, cy, r - 3);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    fill(ctx, i % 3 === 0 ? 'k' : 'X', Math.round(cx + Math.sin(a) * (r - 5)), Math.round(cy - Math.cos(a) * (r - 5)), 1, 1);
  }
  const hourAngle = (((hour % 12) + minute / 60) / 12) * Math.PI * 2;
  const minuteAngle = (minute / 60) * Math.PI * 2;
  line(ctx, 'k', cx, cy, Math.round(cx + Math.sin(hourAngle) * 6), Math.round(cy - Math.cos(hourAngle) * 6));
  line(ctx, 'r', cx, cy, Math.round(cx + Math.sin(minuteAngle) * 9), Math.round(cy - Math.cos(minuteAngle) * 9));
  fill(ctx, 'k', cx, cy, 1, 1);
}

/** The whole inside of the truck (WORLD_W × TRUCK_H), with the window see-through. */
export function paintInterior(ctx: Ctx): void {
  const { window: w } = TRUCK_LAYOUT;
  wallAndFloor(ctx);
  serviceWindow(ctx);
  ctx.clearRect(w.x, w.y + 6, w.w, w.h - 6);
  sillItems(ctx);
  fridge(ctx);
  prepAndCoffee(ctx);
  menuBoard(ctx);
  recipeShelf(ctx);
  backDoor(ctx);
}
