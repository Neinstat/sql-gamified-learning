/**
 * Food truck characters (GAME_DESIGN.md §14.3, §14.8), built from simple shapes in palette colours.
 * - Customers: half body, front view, 64×80 (they stand outside the window; the sill hides their
 *   waist). Two frames: standing, and a walking bob.
 * - The player: side view, 40×96, facing right (flipped for left). Three frames: stand, step, step.
 *
 * ⚠ PLACEHOLDER art (docs/ASSETS.md): to be replaced by final characters in Phase 7.
 */
import type { CustomerLook } from '../../sql-core/truck/orders';
import { fill, PALETTE, type PaletteKey } from '../art/palette';

export const CUSTOMER_W = 64;
export const CUSTOMER_H = 80;
export const CUSTOMER_FRAMES = 2;

export const PLAYER_W = 40;
export const PLAYER_H = 96;
export const PLAYER_FRAMES = 3;

type Look = {
  skin: PaletteKey;
  hair: PaletteKey;
  hairStyle: 'short' | 'long' | 'cap' | 'sides';
  hat?: PaletteKey;
  top: PaletteKey;
  topShade: PaletteKey;
  extra?: 'lanyard' | 'glasses' | 'paint' | 'straps';
};

export const LOOKS: Record<CustomerLook, Look> = {
  student: { skin: 's', hair: '1', hairStyle: 'short', top: 'O', topShade: 'o', extra: 'straps' },
  office: { skin: 'S', hair: 'k', hairStyle: 'short', top: 'c', topShade: 'N', extra: 'lanyard' },
  runner: { skin: 'q', hair: 'k', hairStyle: 'cap', hat: 'B', top: 'L', topShade: 'l' },
  grandpa: { skin: 's', hair: 'X', hairStyle: 'sides', top: '3', topShade: '2', extra: 'glasses' },
  painter: { skin: 'S', hair: 'r', hairStyle: 'long', top: 'm', topShade: 'L', extra: 'paint' },
};

type Ctx = CanvasRenderingContext2D;

function disc(ctx: Ctx, key: PaletteKey, cx: number, cy: number, r: number, onlyTop = false): void {
  ctx.fillStyle = PALETTE[key];
  for (let y = -r; y <= (onlyTop ? 0 : r); y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
  }
}

/** A rounded rectangle (corners cut by `r` pixels), for soft bodies. */
function soft(ctx: Ctx, key: PaletteKey, x: number, y: number, w: number, h: number, r = 3): void {
  for (let i = 0; i < r; i++) {
    const inset = r - i;
    fill(ctx, key, x + inset, y + i, w - inset * 2, 1);
  }
  fill(ctx, key, x, y + r, w, h - r);
}

// ── Customers ────────────────────────────────────────────────────────────────────────────

function drawCustomer(ctx: Ctx, look: Look, ox: number, frame: number): void {
  const y0 = frame === 1 ? 2 : 0;
  const cx = ox + 32;
  const headY = 26 + y0;

  // Shoulders, arms and body (to the bottom edge: the sill hides the rest).
  soft(ctx, 'k', ox + 6, 44 + y0, 52, 36 - y0, 8);
  soft(ctx, look.topShade, ox + 7, 45 + y0, 50, 35 - y0, 8);
  soft(ctx, look.top, ox + 13, 45 + y0, 38, 35 - y0, 5);
  fill(ctx, 'k', ox + 14, 58 + y0, 1, 22 - y0);
  fill(ctx, 'k', ox + 49, 58 + y0, 1, 22 - y0);

  // Neck.
  fill(ctx, 'S', cx - 5, 38 + y0, 10, 8);
  fill(ctx, look.skin, cx - 4, 38 + y0, 8, 6);

  // Long hair falls behind the head.
  if (look.hairStyle === 'long') soft(ctx, look.hair, cx - 16, 14 + y0, 32, 34, 6);

  // Head.
  disc(ctx, 'k', cx, headY, 15);
  disc(ctx, look.skin, cx, headY, 14);
  fill(ctx, look.skin, cx - 15, headY - 1, 2, 6);
  fill(ctx, look.skin, cx + 14, headY - 1, 2, 6);

  // Hair.
  if (look.hairStyle === 'short' || look.hairStyle === 'long') {
    disc(ctx, look.hair, cx, headY - 3, 15, true);
    fill(ctx, look.hair, cx - 15, headY - 3, 5, 6);
    fill(ctx, look.hair, cx + 11, headY - 3, 5, 4);
    fill(ctx, look.hair, cx - 8, headY - 4, 12, 3);
  } else if (look.hairStyle === 'cap') {
    disc(ctx, look.hat ?? 'B', cx, headY - 4, 15, true);
    fill(ctx, look.hat ?? 'B', cx - 15, headY - 6, 31, 4);
    fill(ctx, 'k', cx - 17, headY - 2, 34, 2);
    fill(ctx, '8', cx - 2, headY - 16, 4, 4);
  } else {
    fill(ctx, look.hair, cx - 15, headY - 4, 5, 10);
    fill(ctx, look.hair, cx + 11, headY - 4, 5, 10);
  }

  // Face: brows, eyes with a highlight, nose, mouth, cheeks.
  fill(ctx, 'k', cx - 8, headY + 1, 5, 1);
  fill(ctx, 'k', cx + 4, headY + 1, 5, 1);
  fill(ctx, 'k', cx - 7, headY + 3, 3, 4);
  fill(ctx, 'k', cx + 5, headY + 3, 3, 4);
  fill(ctx, '8', cx - 7, headY + 3, 1, 1);
  fill(ctx, '8', cx + 5, headY + 3, 1, 1);
  fill(ctx, 'S', cx, headY + 7, 1, 3);
  fill(ctx, 'q', cx - 3, headY + 11, 7, 1);
  fill(ctx, 'q', cx - 4, headY + 10, 1, 1);
  fill(ctx, 'q', cx + 4, headY + 10, 1, 1);
  fill(ctx, 'p', cx - 11, headY + 7, 3, 2);
  fill(ctx, 'p', cx + 9, headY + 7, 3, 2);

  switch (look.extra) {
    case 'glasses':
      for (const gx of [cx - 10, cx + 2]) {
        fill(ctx, 'k', gx, headY + 1, 9, 1);
        fill(ctx, 'k', gx, headY + 8, 9, 1);
        fill(ctx, 'k', gx, headY + 1, 1, 8);
        fill(ctx, 'k', gx + 8, headY + 1, 1, 8);
      }
      fill(ctx, 'k', cx - 1, headY + 3, 3, 1);
      break;
    case 'lanyard':
      fill(ctx, 'Y', cx - 6, 46 + y0, 2, 18);
      fill(ctx, 'Y', cx + 5, 46 + y0, 2, 18);
      fill(ctx, 'k', cx - 7, 63 + y0, 15, 12);
      fill(ctx, '8', cx - 6, 64 + y0, 13, 10);
      fill(ctx, 'N', cx - 4, 66 + y0, 9, 2);
      break;
    case 'paint':
      fill(ctx, 'O', ox + 20, 56 + y0, 4, 3);
      fill(ctx, 'B', ox + 38, 64 + y0, 4, 4);
      fill(ctx, 'c', ox + 28, 72 + y0, 5, 2);
      break;
    case 'straps':
      fill(ctx, 'r', ox + 16, 46 + y0, 4, 34 - y0);
      fill(ctx, 'r', ox + 44, 46 + y0, 4, 34 - y0);
      break;
  }
}

/** Both customer frames side by side (128×80). */
export function paintCustomerSheet(ctx: Ctx, look: CustomerLook): void {
  for (let f = 0; f < CUSTOMER_FRAMES; f++) drawCustomer(ctx, LOOKS[look], f * CUSTOMER_W, f);
}

// ── The player (side view, facing right) ───────────────────────────────────────────────

/** Leg swing per frame: [front leg, back leg] horizontal offsets of the foot. */
const STRIDE: readonly [number, number][] = [
  [0, 0],
  [6, -6],
  [-6, 6],
];

function leg(ctx: Ctx, hipX: number, hipY: number, footOffset: number, colour: PaletteKey): void {
  const length = 26;
  for (let i = 0; i < length; i++) {
    const x = Math.round(hipX + (footOffset * i) / length);
    fill(ctx, 'k', x - 1, hipY + i, 8, 1);
    fill(ctx, colour, x, hipY + i, 6, 1);
  }
  const fx = Math.round(hipX + footOffset);
  fill(ctx, 'k', fx - 1, hipY + length, 11, 4);
  fill(ctx, 'n', fx, hipY + length, 9, 3);
}

function drawPlayer(ctx: Ctx, ox: number, frame: number): void {
  const [front, back] = STRIDE[frame];
  const bob = frame === 0 ? 0 : 1;
  const y = bob;

  // Back leg, back arm (darker), then body.
  leg(ctx, ox + 15, 62 + y, back, 'N');
  fill(ctx, 'k', ox + 12 - Math.sign(front) * 2, 36 + y, 7, 22);
  fill(ctx, 'o', ox + 13 - Math.sign(front) * 2, 37 + y, 5, 18);
  leg(ctx, ox + 17, 62 + y, front, 'n');

  // Torso: uniform shirt with an apron.
  soft(ctx, 'k', ox + 10, 32 + y, 20, 32, 4);
  soft(ctx, 'O', ox + 11, 33 + y, 18, 30, 4);
  fill(ctx, 'G', ox + 18, 40 + y, 11, 24);
  fill(ctx, 'g', ox + 18, 40 + y, 1, 24);
  fill(ctx, 'G', ox + 20, 34 + y, 2, 6);
  fill(ctx, 'Y', ox + 22, 48 + y, 4, 3);

  // Front arm, swinging opposite the front leg.
  const swing = -Math.sign(front) * 3;
  fill(ctx, 'k', ox + 16 + swing, 35 + y, 7, 22);
  fill(ctx, 'O', ox + 17 + swing, 36 + y, 5, 17);
  fill(ctx, 's', ox + 17 + swing, 53 + y, 5, 4);

  // Neck and head (profile: nose to the right).
  fill(ctx, 's', ox + 17, 27 + y, 7, 6);
  disc(ctx, 'k', ox + 20, 17 + y, 12);
  disc(ctx, 's', ox + 20, 17 + y, 11);
  fill(ctx, 's', ox + 31, 17 + y, 2, 3);
  // Hair at the back, cap with a brim to the front.
  fill(ctx, '2', ox + 9, 14 + y, 6, 10);
  disc(ctx, 'O', ox + 20, 12 + y, 12, true);
  fill(ctx, 'o', ox + 8, 11 + y, 25, 2);
  fill(ctx, 'k', ox + 26, 12 + y, 11, 2);
  fill(ctx, '8', ox + 18, 4 + y, 4, 3);
  // Eye, brow, mouth, ear.
  fill(ctx, 'k', ox + 26, 16 + y, 2, 3);
  fill(ctx, 'k', ox + 25, 14 + y, 4, 1);
  fill(ctx, 'q', ox + 27, 23 + y, 3, 1);
  fill(ctx, 'S', ox + 15, 17 + y, 3, 4);
  fill(ctx, 'p', ox + 24, 20 + y, 2, 1);
}

/** The player's three frames side by side (120×96). */
export function paintPlayerSheet(ctx: Ctx): void {
  for (let f = 0; f < PLAYER_FRAMES; f++) drawPlayer(ctx, f * PLAYER_W, f);
}
