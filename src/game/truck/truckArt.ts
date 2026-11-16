/**
 * The food truck scene (GAME_DESIGN.md §14.8): seen from inside the truck, looking out of the
 * serving window. Fixed 480×270 canvas, drawn with plain canvas calls in palette colours only,
 * so it needs no Phaser and can be tested.
 */
import { fill, PALETTE, type PaletteKey } from '../art/palette';

export const TRUCK_W = 480;
export const TRUCK_H = 270;

/** Largest whole-number zoom that fits (sharp pixels); smaller screens get a fractional fit. */
export function truckZoom(width: number, height: number): number {
  const fit = Math.min(width / TRUCK_W, height / TRUCK_H);
  return fit >= 1 ? Math.floor(fit) : fit;
}

/** Areas later iterations build on (queue outside the window, tablet, back door, clock). */
export const TRUCK_LAYOUT = {
  window: { x: 20, y: 34, w: 300, h: 142 },
  /** The sidewalk inside the window, where customers will queue (4.2). */
  sidewalkY: 150,
  counterY: 176,
  tablet: { x: 248, y: 136, w: 62, h: 42 },
  door: { x: 404, y: 40, w: 64, h: 230 },
  clock: { cx: 372, cy: 46, r: 15 },
  menuBoard: { x: 340, y: 74, w: 56, h: 66 },
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

function wall(ctx: Ctx): void {
  // Brushed steel panels with seams and rivets.
  fill(ctx, 'z', 0, 0, TRUCK_W, TRUCK_H);
  for (let x = 0; x < TRUCK_W; x += 60) {
    fill(ctx, 'X', x, 0, 1, TRUCK_H);
    for (let y = 18; y < TRUCK_H; y += 24) fill(ctx, 'X', x + 3, y, 1, 1);
  }
  // Ceiling with a warm light strip.
  fill(ctx, 'x', 0, 0, TRUCK_W, 12);
  fill(ctx, 'k', 0, 12, TRUCK_W, 1);
  fill(ctx, 'Y', 40, 9, 240, 3);
  fill(ctx, '8', 40, 10, 240, 1);
}

function outside(ctx: Ctx): void {
  const { x, y, w, h } = TRUCK_LAYOUT.window;
  const ground = TRUCK_LAYOUT.sidewalkY;
  // Morning sky.
  fill(ctx, 'C', x, y, w, ground - y);
  fill(ctx, 'c', x, ground - 44, w, 10);
  // Clouds.
  for (const [cx, cy] of [[70, 58], [210, 52], [270, 66]] as const) {
    fill(ctx, '8', cx - 14, cy, 28, 4);
    fill(ctx, '8', cx - 8, cy - 3, 16, 3);
  }
  // Town buildings in the distance.
  const buildings: [number, number, PaletteKey][] = [
    [20, 62, 'N'], [52, 48, 'x'], [84, 70, 'N'], [118, 40, 'X'], [146, 58, 'x'],
    [180, 76, 'N'], [214, 50, 'X'], [246, 64, 'x'], [280, 44, 'N'],
  ];
  for (const [bx, bh, key] of buildings) {
    const top = ground - bh;
    fill(ctx, key, x + bx - 20, top, 32, bh);
    fill(ctx, 'k', x + bx - 20, top, 32, 1);
    for (let wy = top + 6; wy < ground - 8; wy += 10) {
      for (let wx = x + bx - 16; wx < x + bx + 8; wx += 8) fill(ctx, (wx + wy) % 3 === 0 ? 'Y' : 'n', wx, wy, 4, 5);
    }
  }
  // A tree on the sidewalk.
  fill(ctx, '2', x + 236, ground - 30, 5, 30);
  disc(ctx, 'G', x + 238, ground - 40, 15);
  disc(ctx, 'l', x + 233, ground - 45, 8);
  // Sidewalk and kerb.
  fill(ctx, 'X', x, ground, w, y + h - ground);
  fill(ctx, 'z', x, ground, w, 2);
  for (let sx = x + 10; sx < x + w; sx += 40) fill(ctx, 'x', sx, ground + 2, 1, y + h - ground - 2);
}

function awning(ctx: Ctx): void {
  const { x, y, w } = TRUCK_LAYOUT.window;
  const stripe = 12;
  for (let i = 0; i * stripe < w; i++) {
    const key: PaletteKey = i % 2 === 0 ? 'B' : '8';
    const sx = x + i * stripe;
    const sw = Math.min(stripe, x + w - sx);
    fill(ctx, key, sx, y, sw, 12);
    // Scalloped edge.
    fill(ctx, key, sx + 2, y + 12, Math.max(0, sw - 4), 2);
    fill(ctx, key, sx + 4, y + 14, Math.max(0, sw - 8), 1);
  }
  fill(ctx, 'b', x, y + 11, w, 1);
}

function windowFrame(ctx: Ctx): void {
  const { x, y, w, h } = TRUCK_LAYOUT.window;
  fill(ctx, 'n', x - 4, y - 4, w + 8, 4);
  fill(ctx, 'n', x - 4, y, 4, h);
  fill(ctx, 'n', x + w, y, 4, h);
  fill(ctx, 'N', x - 3, y - 3, w + 6, 1);
  // Shutter rail at the top.
  fill(ctx, 'x', x, y, w, 2);
}

function counter(ctx: Ctx): void {
  const top = TRUCK_LAYOUT.counterY;
  const right = TRUCK_LAYOUT.window.x + TRUCK_LAYOUT.window.w + 16;
  // Steel ledge.
  fill(ctx, '8', 0, top, right, 2);
  fill(ctx, 'X', 0, top + 2, right, 9);
  fill(ctx, 'x', 0, top + 11, right, 2);
  // Wooden cabinet below.
  fill(ctx, '3', 0, top + 13, right, TRUCK_H - top - 13);
  fill(ctx, '4', 0, top + 13, right, 2);
  for (let cx = 0; cx < right; cx += 84) {
    fill(ctx, '2', cx + 6, top + 22, 74, TRUCK_H - top - 30);
    fill(ctx, '3', cx + 8, top + 24, 70, TRUCK_H - top - 34);
    fill(ctx, '5', cx + 70, top + 50, 3, 12);
  }
  fill(ctx, 'k', right, top, 1, TRUCK_H - top);
}

function counterItems(ctx: Ctx): void {
  const top = TRUCK_LAYOUT.counterY;
  // Tip jar with coins.
  fill(ctx, 'c', 34, top - 20, 18, 20);
  fill(ctx, 'C', 36, top - 18, 14, 17);
  fill(ctx, 'y', 37, top - 7, 12, 6);
  fill(ctx, 'Y', 39, top - 9, 5, 2);
  fill(ctx, 'N', 33, top - 22, 20, 2);
  // Napkin holder.
  fill(ctx, 'x', 62, top - 12, 20, 12);
  fill(ctx, '8', 64, top - 16, 16, 6);
  // A row of paper cups.
  for (let i = 0; i < 3; i++) {
    const cx = 100 + i * 12;
    fill(ctx, '7', cx, top - 14, 9, 14);
    fill(ctx, 'O', cx, top - 9, 9, 4);
  }
  // Tablet (POS) on a stand, where SQL is written (4.3).
  const t = TRUCK_LAYOUT.tablet;
  fill(ctx, 'x', t.x + t.w / 2 - 6, t.y + t.h - 6, 12, 6);
  fill(ctx, 'k', t.x, t.y, t.w, t.h - 6);
  fill(ctx, 'n', t.x + 2, t.y + 2, t.w - 4, t.h - 10);
  // A few glowing "query" lines on the screen.
  fill(ctx, 'L', t.x + 6, t.y + 6, 22, 2);
  fill(ctx, 'c', t.x + 6, t.y + 11, 36, 2);
  fill(ctx, 'c', t.x + 6, t.y + 16, 28, 2);
  fill(ctx, 'y', t.x + 6, t.y + 21, 14, 2);
  fill(ctx, 'C', t.x + 6, t.y + 26, 2, 3);
}

function menuBoard(ctx: Ctx): void {
  const { x, y, w, h } = TRUCK_LAYOUT.menuBoard;
  fill(ctx, '2', x - 3, y - 3, w + 6, h + 6);
  fill(ctx, 'g', x, y, w, h);
  // Chalk "writing": a title and price lines.
  fill(ctx, 'Y', x + 8, y + 6, w - 16, 2);
  for (let i = 0; i < 5; i++) {
    const ly = y + 16 + i * 9;
    fill(ctx, 'm', x + 5, ly, 24 + ((i * 7) % 10), 2);
    fill(ctx, '8', x + w - 13, ly, 8, 2);
  }
}

function backDoor(ctx: Ctx): void {
  const { x, y, w, h } = TRUCK_LAYOUT.door;
  fill(ctx, 'n', x - 3, y - 3, w + 6, h + 3);
  fill(ctx, 'N', x, y, w, h);
  fill(ctx, 'c', x + 2, y, 1, h);
  // Small window in the door.
  fill(ctx, 'n', x + 14, y + 16, w - 28, 44);
  fill(ctx, 'C', x + 16, y + 18, w - 32, 40);
  fill(ctx, 'c', x + 16, y + 44, w - 32, 14);
  fill(ctx, '8', x + 19, y + 21, 3, 12);
  // Handle and kick plate.
  fill(ctx, 'k', x + 6, y + 112, 6, 14);
  fill(ctx, 'Y', x + 7, y + 113, 4, 12);
  fill(ctx, 'x', x + 4, y + h - 26, w - 8, 22);
  fill(ctx, 'X', x + 4, y + h - 26, w - 8, 1);
}

/** The wall clock; drawn separately so the scene can redraw it as time passes. */
export function paintClock(ctx: Ctx, hour: number, minute: number): void {
  const { cx, cy, r } = TRUCK_LAYOUT.clock;
  disc(ctx, 'k', cx, cy, r + 1);
  disc(ctx, 'o', cx, cy, r);
  disc(ctx, '8', cx, cy, r - 3);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const tick = i % 3 === 0 ? 'k' : 'X';
    fill(ctx, tick, Math.round(cx + Math.sin(a) * (r - 5)), Math.round(cy - Math.cos(a) * (r - 5)), 1, 1);
  }
  const hourAngle = (((hour % 12) + minute / 60) / 12) * Math.PI * 2;
  const minuteAngle = (minute / 60) * Math.PI * 2;
  line(ctx, 'k', cx, cy, Math.round(cx + Math.sin(hourAngle) * 6), Math.round(cy - Math.cos(hourAngle) * 6));
  line(ctx, 'r', cx, cy, Math.round(cx + Math.sin(minuteAngle) * 9), Math.round(cy - Math.cos(minuteAngle) * 9));
  fill(ctx, 'k', cx, cy, 1, 1);
}

/** Everything that does not change during a day. */
export function paintTruckScene(ctx: Ctx): void {
  wall(ctx);
  outside(ctx);
  awning(ctx);
  windowFrame(ctx);
  menuBoard(ctx);
  backDoor(ctx);
  counter(ctx);
  counterItems(ctx);
}
