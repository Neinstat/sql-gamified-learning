/**
 * Food truck customers (GAME_DESIGN.md §14.3, §14.8): new characters, front view, 32×48,
 * built from simple shapes in palette colours. Two frames: standing, and a walking step.
 */
import type { CustomerLook } from '../../sql-core/truck/orders';
import { fill, PALETTE, type PaletteKey } from '../art/palette';

export const CUSTOMER_W = 32;
export const CUSTOMER_H = 48;
export const CUSTOMER_FRAMES = 2;

type Look = {
  skin: PaletteKey;
  hair: PaletteKey;
  hairStyle: 'short' | 'long' | 'cap' | 'sides';
  /** Cap colour for `cap`. */
  hat?: PaletteKey;
  top: PaletteKey;
  topShade: PaletteKey;
  legs: PaletteKey;
  /** Small extras drawn last. */
  extra?: 'tie' | 'lanyard' | 'glasses' | 'paint' | 'straps';
};

export const LOOKS: Record<CustomerLook, Look> = {
  student: { skin: 's', hair: '1', hairStyle: 'short', top: 'O', topShade: 'o', legs: 'n', extra: 'straps' },
  office: { skin: 'S', hair: 'k', hairStyle: 'short', top: 'c', topShade: 'N', legs: 'x', extra: 'lanyard' },
  runner: { skin: 'q', hair: 'k', hairStyle: 'cap', hat: 'B', top: 'L', topShade: 'l', legs: 'G' },
  grandpa: { skin: 's', hair: 'X', hairStyle: 'sides', top: '3', topShade: '2', legs: 'x', extra: 'glasses' },
  painter: { skin: 'S', hair: 'r', hairStyle: 'long', top: 'm', topShade: 'L', legs: '2', extra: 'paint' },
};

type Ctx = CanvasRenderingContext2D;

function disc(ctx: Ctx, key: PaletteKey, cx: number, cy: number, r: number, onlyTop = false): void {
  ctx.fillStyle = PALETTE[key];
  for (let y = -r; y <= (onlyTop ? 0 : r); y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
  }
}

/** Draws one frame with its top-left corner at (ox, 0). */
function drawFrame(ctx: Ctx, look: Look, ox: number, frame: number): void {
  const walking = frame === 1;
  const bob = walking ? 1 : 0;
  const y0 = bob;
  const cx = ox + 16;

  // Legs and shoes (one leg lifted while walking).
  const legTop = 36 + y0;
  fill(ctx, 'k', ox + 9, legTop, 14, 10 - y0);
  fill(ctx, look.legs, ox + 10, legTop, 5, 9 - y0 - (walking ? 1 : 0));
  fill(ctx, look.legs, ox + 17, legTop, 5, 9 - y0);
  fill(ctx, 'k', ox + 9, 45 - (walking ? 1 : 0), 7, 3);
  fill(ctx, 'k', ox + 16, 45, 7, 3);

  // Arms with hands.
  fill(ctx, 'k', ox + 4, 19 + y0, 5, 17);
  fill(ctx, 'k', ox + 23, 19 + y0, 5, 17);
  fill(ctx, look.topShade, ox + 5, 20 + y0, 3, 13);
  fill(ctx, look.topShade, ox + 24, 20 + y0, 3, 13);
  fill(ctx, look.skin, ox + 5, 33 + y0, 3, 2);
  fill(ctx, look.skin, ox + 24, 33 + y0, 3, 2);

  // Body.
  fill(ctx, 'k', ox + 8, 18 + y0, 16, 19);
  fill(ctx, look.top, ox + 9, 19 + y0, 14, 17);
  fill(ctx, look.topShade, ox + 9, 33 + y0, 14, 3);

  // Neck and head.
  fill(ctx, look.skin, cx - 2, 16 + y0, 4, 3);
  if (look.hairStyle === 'long') fill(ctx, look.hair, cx - 8, 6 + y0, 16, 16);
  disc(ctx, 'k', cx, 10 + y0, 7);
  disc(ctx, look.skin, cx, 10 + y0, 6);

  // Hair.
  if (look.hairStyle === 'short' || look.hairStyle === 'long') {
    disc(ctx, look.hair, cx, 8 + y0, 7, true);
    fill(ctx, look.hair, cx - 7, 8 + y0, 3, 3);
    fill(ctx, look.hair, cx + 5, 8 + y0, 3, 2);
  } else if (look.hairStyle === 'cap') {
    disc(ctx, look.hat ?? 'B', cx, 8 + y0, 7, true);
    fill(ctx, look.hat ?? 'B', cx - 7, 7 + y0, 15, 2);
    fill(ctx, 'k', cx - 8, 9 + y0, 17, 1);
    fill(ctx, '8', cx - 1, 3 + y0, 2, 2);
  } else {
    fill(ctx, look.hair, cx - 7, 7 + y0, 3, 6);
    fill(ctx, look.hair, cx + 5, 7 + y0, 3, 6);
  }

  // Face.
  fill(ctx, 'k', cx - 3, 11 + y0, 1, 2);
  fill(ctx, 'k', cx + 2, 11 + y0, 1, 2);
  fill(ctx, 'q', cx - 1, 14 + y0, 3, 1);
  fill(ctx, 'p', cx - 5, 13 + y0, 1, 1);
  fill(ctx, 'p', cx + 4, 13 + y0, 1, 1);

  // Extras.
  switch (look.extra) {
    case 'glasses':
      fill(ctx, 'k', cx - 5, 10 + y0, 4, 1);
      fill(ctx, 'k', cx + 1, 10 + y0, 4, 1);
      fill(ctx, 'k', cx - 1, 10 + y0, 2, 1);
      break;
    case 'lanyard':
      fill(ctx, 'Y', cx - 3, 19 + y0, 1, 7);
      fill(ctx, 'Y', cx + 2, 19 + y0, 1, 7);
      fill(ctx, '8', cx - 3, 26 + y0, 6, 4);
      break;
    case 'tie':
      fill(ctx, 'r', cx - 1, 19 + y0, 2, 10);
      break;
    case 'paint':
      fill(ctx, 'O', ox + 11, 24 + y0, 2, 2);
      fill(ctx, 'B', ox + 18, 28 + y0, 2, 2);
      fill(ctx, 'c', ox + 14, 31 + y0, 2, 1);
      break;
    case 'straps':
      fill(ctx, 'r', ox + 10, 19 + y0, 2, 14);
      fill(ctx, 'r', ox + 20, 19 + y0, 2, 14);
      break;
  }
}

/** Both frames side by side (64×48). */
export function paintCustomerSheet(ctx: Ctx, look: CustomerLook): void {
  for (let f = 0; f < CUSTOMER_FRAMES; f++) drawFrame(ctx, LOOKS[look], f * CUSTOMER_W, f);
}
