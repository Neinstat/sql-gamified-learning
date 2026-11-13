import { LOOKS, type Look } from './placeholderSprites';
import { grandmaPortrait } from './art/grandma';

/**
 * Placeholder 64×64 dialogue portraits, drawn in code — no third-party art.
 * Plain canvas drawing (no Phaser), so the React dialogue box can use it too.
 */
export const PORTRAIT_SIZE = 64;

type Ctx = CanvasRenderingContext2D;
const r = (ctx: Ctx, c: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
};

const BG = '#f3e6cc';
const BG_DARK = '#e6d3b0';
const EYE = '#2b211c';
const MOUTH = '#a8554a';
const CHEEK = '#eaa592';
const GLASS = '#c08a3e';

function drawFace(ctx: Ctx, L: Look) {
  r(ctx, BG, 0, 0, 64, 64);
  r(ctx, BG_DARK, 0, 48, 64, 16);

  // Shoulders and neck.
  r(ctx, L.top, 10, 50, 44, 14);
  r(ctx, L.top, 14, 47, 36, 4);
  r(ctx, L.front, 26, 48, 2, 16);
  r(ctx, L.front, 36, 48, 2, 16);
  r(ctx, L.skin, 27, 42, 10, 8);

  // Hair behind the face.
  r(ctx, L.hair, 15, 14, 34, 26);
  // Face.
  r(ctx, L.skin, 19, 17, 26, 26);
  r(ctx, L.skin, 17, 22, 30, 16);
  // Fringe.
  r(ctx, L.hair, 18, 12, 28, 7);
  r(ctx, L.hairLight, 22, 12, 12, 2);
  if (L.bun) {
    r(ctx, L.hair, 25, 3, 14, 10);
    r(ctx, L.hairLight, 28, 4, 6, 2);
  }
  if (L.cap) {
    r(ctx, L.cap, 16, 6, 32, 10);
    r(ctx, L.cap, 12, 15, 40, 3);
  }

  // Eyes, cheeks, smile.
  r(ctx, EYE, 24, 27, 3, 4);
  r(ctx, EYE, 37, 27, 3, 4);
  r(ctx, CHEEK, 20, 33, 4, 2);
  r(ctx, CHEEK, 40, 33, 4, 2);
  r(ctx, MOUTH, 28, 37, 8, 2);
  r(ctx, MOUTH, 27, 36, 1, 1);
  r(ctx, MOUTH, 36, 36, 1, 1);

  if (L.glasses) {
    for (const x of [21, 34]) {
      r(ctx, GLASS, x, 24, 9, 1);
      r(ctx, GLASS, x, 32, 9, 1);
      r(ctx, GLASS, x, 24, 1, 9);
      r(ctx, GLASS, x + 8, 24, 1, 9);
    }
    r(ctx, GLASS, 30, 27, 4, 1);
  }
}

/** A data URL for the character's portrait: final art when there is some, else a placeholder (Grandma's look is the fallback). */
export function characterPortrait(character: string): string {
  // Grandma already has her final portrait (GAME_DESIGN.md §3).
  if (character === 'grandma') return grandmaPortrait();
  const canvas = document.createElement('canvas');
  canvas.width = PORTRAIT_SIZE;
  canvas.height = PORTRAIT_SIZE;
  const look = character in LOOKS ? LOOKS[character as keyof typeof LOOKS] : LOOKS.grandma;
  drawFace(canvas.getContext('2d')!, look);
  return canvas.toDataURL();
}
