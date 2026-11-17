/**
 * Food truck customers (GAME_DESIGN.md §14.3, §14.8) in the risograph style, drawn at three
 * distances instead of scaled (scaling would blur the pixels):
 * - 'near'  half body at the window, 128×160 (the counter hides the waist)
 * - 'mid'   full body on the path, 32×72
 * - 'far'   full body further back, 22×50
 * Two frames each: standing, and a walking bob/step.
 *
 * ⚠ PLACEHOLDER art (docs/ASSETS.md): to be replaced by final characters in Phase 7.
 */
import type { CustomerLook } from '../../sql-core/truck/orders';
import { disc, rect, RISO, soft, type Ink } from '../art/riso';

export type Distance = 'near' | 'mid' | 'far';
export const CUSTOMER_SIZES: Record<Distance, { w: number; h: number }> = {
  near: { w: 128, h: 160 },
  mid: { w: 32, h: 72 },
  far: { w: 22, h: 50 },
};
export const CUSTOMER_FRAMES = 2;

type Look = {
  skin: Ink;
  hair: Ink;
  hairStyle: 'short' | 'long' | 'cap' | 'sides';
  hat?: Ink;
  top: Ink;
  topShade: Ink;
  legs: Ink;
  extra?: 'lanyard' | 'glasses' | 'paint' | 'straps';
};

export const LOOKS: Record<CustomerLook, Look> = {
  student: { skin: 'skin1', hair: 'woodDark', hairStyle: 'short', top: 'mustard', topShade: 'mustardDark', legs: 'ink', extra: 'straps' },
  office: { skin: 'skin2', hair: 'ink', hairStyle: 'short', top: 'tealLight', topShade: 'teal', legs: 'inkSoft', extra: 'lanyard' },
  runner: { skin: 'skin3', hair: 'ink', hairStyle: 'cap', hat: 'red', top: 'teal', topShade: 'tealDark', legs: 'ink' },
  grandpa: { skin: 'skin1', hair: 'white', hairStyle: 'sides', top: 'wood', topShade: 'woodDark', legs: 'inkSoft', extra: 'glasses' },
  painter: { skin: 'skin2', hair: 'red', hairStyle: 'long', top: 'pink', topShade: 'red', legs: 'woodDark', extra: 'paint' },
};

type Ctx = CanvasRenderingContext2D;

/** Draws in "units": the half-body design is 64×80 units, drawn at u pixels per unit. */
function nearCustomer(ctx: Ctx, look: Look, ox: number, frame: number): void {
  const u = 2;
  const R = (ink: Ink, x: number, y: number, w: number, h: number) => rect(ctx, ink, ox + x * u, y * u, w * u, h * u);
  const y0 = frame === 1 ? 1 : 0;
  const cx = 32;
  const headY = 26 + y0;

  // Body with a mis-printed red edge.
  soft(ctx, 'red', ox + 7 * u + 2, (44 + y0) * u + 2, 52 * u, (36 - y0) * u - 2, 16);
  soft(ctx, 'ink', ox + 6 * u, (44 + y0) * u, 52 * u, (36 - y0) * u, 16);
  soft(ctx, look.topShade, ox + 7 * u, (45 + y0) * u, 50 * u, (35 - y0) * u, 15);
  soft(ctx, look.top, ox + 14 * u, (45 + y0) * u, 36 * u, (35 - y0) * u, 9);
  R('ink', 14, 60 + y0, 0.5, 20 - y0);
  R('ink', 49.5, 60 + y0, 0.5, 20 - y0);
  // Neck.
  R('ink', cx - 6, 37 + y0, 12, 9);
  R(look.skin, cx - 5, 37 + y0, 10, 8);
  if (look.hairStyle === 'long') soft(ctx, look.hair, ox + (cx - 16) * u, (13 + y0) * u, 32 * u, 36 * u, 12);
  // Head.
  disc(ctx, 'red', ox + cx * u + 2, headY * u + 2, 15 * u);
  disc(ctx, 'ink', ox + cx * u, headY * u, 15 * u);
  disc(ctx, look.skin, ox + cx * u, headY * u, 14 * u);
  // Hair.
  if (look.hairStyle === 'short' || look.hairStyle === 'long') {
    disc(ctx, look.hair, ox + cx * u, (headY - 3) * u, 15 * u, true);
    R(look.hair, cx - 15, headY - 3, 5, 7);
    R(look.hair, cx + 10, headY - 3, 5, 4);
    R(look.hair, cx - 9, headY - 4, 14, 3);
  } else if (look.hairStyle === 'cap') {
    disc(ctx, look.hat ?? 'red', ox + cx * u, (headY - 4) * u, 15 * u, true);
    R(look.hat ?? 'red', cx - 15, headY - 6, 30, 4);
    R('ink', cx - 17, headY - 2, 34, 2);
    R('white', cx - 2, headY - 17, 4, 3);
  } else {
    R(look.hair, cx - 15, headY - 4, 5, 11);
    R(look.hair, cx + 10, headY - 4, 5, 11);
  }
  // Face: big eyes with highlights, brows, nose, smile, cheeks.
  R('ink', cx - 9, headY + 1, 6, 1);
  R('ink', cx + 3, headY + 1, 6, 1);
  R('ink', cx - 8, headY + 3, 4, 5);
  R('ink', cx + 4, headY + 3, 4, 5);
  R('white', cx - 8, headY + 3, 1.5, 1.5);
  R('white', cx + 4, headY + 3, 1.5, 1.5);
  R(look.skin === 'skin3' ? 'ink' : 'skin3', cx - 0.5, headY + 8, 1, 2);
  R('ink', cx - 3, headY + 11.5, 6, 1);
  R('ink', cx - 4, headY + 10.5, 1, 1);
  R('ink', cx + 3, headY + 10.5, 1, 1);
  R('pink', cx - 12, headY + 7, 4, 2);
  R('pink', cx + 8, headY + 7, 4, 2);

  switch (look.extra) {
    case 'glasses':
      for (const gx of [cx - 11, cx + 2]) {
        R('ink', gx, headY + 1, 9, 1);
        R('ink', gx, headY + 8, 9, 1);
        R('ink', gx, headY + 1, 1, 8);
        R('ink', gx + 8, headY + 1, 1, 8);
      }
      R('ink', cx - 2, headY + 3, 4, 1);
      break;
    case 'lanyard':
      R('red', cx - 7, 46 + y0, 2, 18);
      R('red', cx + 5, 46 + y0, 2, 18);
      R('ink', cx - 8, 63 + y0, 16, 12);
      R('white', cx - 7, 64 + y0, 14, 10);
      R('teal', cx - 5, 66 + y0, 10, 2);
      break;
    case 'paint':
      R('mustard', 20, 56 + y0, 4, 3);
      R('teal', 38, 64 + y0, 4, 4);
      R('red', 28, 72 + y0, 5, 2);
      break;
    case 'straps':
      R('red', 16, 46 + y0, 4, 34 - y0);
      R('red', 44, 46 + y0, 4, 34 - y0);
      break;
  }
}

/** A small full-body figure on the path; `u` pixels per unit (design: 32×72 units). */
function smallCustomer(ctx: Ctx, look: Look, ox: number, u: number, frame: number): void {
  const R = (ink: Ink, x: number, y: number, w: number, h: number) =>
    rect(ctx, ink, ox + Math.round(x * u), Math.round(y * u), Math.max(1, Math.round(w * u)), Math.max(1, Math.round(h * u)));
  const step = frame === 1;
  // Legs and shoes (one leg forward while walking).
  R('ink', 9, 42, 6, 26);
  R('ink', 17, 42, 6, 26 - (step ? 3 : 0));
  R(look.legs, 10, 42, 4, 24);
  R(look.legs, 18, 42, 4, 24 - (step ? 3 : 0));
  R('ink', step ? 7 : 8, 66, 8, 4);
  R('ink', 17, step ? 63 : 66, 8, 4);
  // Body and arms.
  R('ink', 5, 18, 22, 26);
  R(look.topShade, 6, 19, 20, 24);
  R(look.top, 9, 19, 14, 24);
  R(look.skin, 6, 40, 3, 3);
  R(look.skin, 23, 40, 3, 3);
  // Head and hair.
  disc(ctx, 'ink', ox + 16 * u, 10 * u, Math.max(2, Math.round(8 * u)));
  disc(ctx, look.skin, ox + 16 * u, 10 * u, Math.max(1, Math.round(7 * u)));
  const hair = look.hairStyle === 'cap' ? (look.hat ?? 'red') : look.hair;
  if (look.hairStyle === 'sides') {
    R(hair, 8, 6, 3, 6);
    R(hair, 21, 6, 3, 6);
  } else {
    disc(ctx, hair, ox + 16 * u, 8 * u, Math.max(1, Math.round(8 * u)), true);
    if (look.hairStyle === 'long') R(hair, 8, 8, 16, 10);
  }
  R('ink', 13, 11, 1.5, 2);
  R('ink', 18, 11, 1.5, 2);
}

/** A sprite sheet for one look at one distance: two frames side by side. */
export function paintCustomerSheet(ctx: Ctx, look: CustomerLook, distance: Distance): void {
  const { w } = CUSTOMER_SIZES[distance];
  for (let f = 0; f < CUSTOMER_FRAMES; f++) {
    if (distance === 'near') nearCustomer(ctx, LOOKS[look], f * w, f);
    else smallCustomer(ctx, LOOKS[look], f * w, distance === 'mid' ? 1 : 0.68, f);
  }
}

export const CUSTOMER_COLOURS = new Set<string>(Object.values(RISO));
