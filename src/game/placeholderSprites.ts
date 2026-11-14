/**
 * Placeholder character sprites (16×32 per frame), drawn in code — no third-party art.
 * Frames in a single row: for each facing (down, up, side) → stand, step A, step B.
 * "side" faces left; facing right is the same frame flipped.
 */
export const CHAR_W = 16;
export const CHAR_H = 32;
export const FACINGS = ['down', 'up', 'side'] as const;
export const FRAMES_PER_FACING = 3;

/** How a character looks: colours plus a few shape options. */
export type Look = {
  hair: string;
  hairLight: string;
  skin: string;
  top: string;
  /** Apron (player) or cardigan trim (Grandma). */
  front: string;
  legs: string;
  shoe: string;
  bun?: boolean;
  glasses?: boolean;
  skirt?: boolean;
  /** A cap with a brim, in this colour. */
  cap?: string;
};

export const LOOKS = {
  player: {
    hair: '#5a3a26',
    hairLight: '#74503a',
    skin: '#f1c9a5',
    top: '#3f8a86',
    front: '#f3e6cc',
    legs: '#4a4258',
    shoe: '#2b211c',
  },
  grandma: {
    hair: '#c9c4cf',
    hairLight: '#ebe8ef',
    skin: '#eec3a0',
    top: '#8a6aa8',
    front: '#b79ad0',
    legs: '#5b4a6e',
    shoe: '#4a3328',
    bun: true,
    glasses: true,
    skirt: true,
  },
  barista: {
    hair: '#2e2420',
    hairLight: '#4a3a33',
    skin: '#c98e68',
    top: '#f3e6cc',
    front: '#4f6f52',
    legs: '#2f3b35',
    shoe: '#2b211c',
  },
  regular: {
    hair: '#8a5a3b',
    hairLight: '#a87650',
    skin: '#f0c8a8',
    top: '#b5643c',
    front: '#d98a5f',
    legs: '#3f4f6e',
    shoe: '#5b4033',
    cap: '#3f6f8a',
  },
  // Not drawn with this look any more (final art in art/supplier.ts); kept so every character has one.
  supplier: {
    hair: '#4a2c22',
    hairLight: '#6e4430',
    skin: '#d39c74',
    top: '#f6e7c8',
    front: '#75853d',
    legs: '#75853d',
    shoe: '#6e4430',
  },
} satisfies Record<string, Look>;

const SHADOW = 'rgba(0,0,0,0.22)';
const EYE = '#2b211c';
const GLASS = '#c08a3e';

type Ctx = CanvasRenderingContext2D;
const r = (ctx: Ctx, c: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
};

/** step: 0 = standing, 1 = left foot forward, 2 = right foot forward. */
function legsFront(ctx: Ctx, L: Look, step: number) {
  const lift = (leg: number) => (step === leg ? 1 : 0);
  if (L.skirt) {
    r(ctx, L.legs, 3, 22, 10, 7);
    r(ctx, L.shoe, 4, 29 + (step === 1 ? 0 : 1), 3, 2);
    r(ctx, L.shoe, 9, 29 + (step === 2 ? 0 : 1), 3, 2);
    return;
  }
  r(ctx, L.legs, 4, 23, 8, 4);
  r(ctx, L.legs, 4, 27 - lift(1), 3, 3);
  r(ctx, L.legs, 9, 27 - lift(2), 3, 3);
  r(ctx, L.shoe, 4, 30 - lift(1), 3, 2);
  r(ctx, L.shoe, 9, 30 - lift(2), 3, 2);
}

function torsoFront(ctx: Ctx, L: Look) {
  r(ctx, L.top, 3, 16, 10, 7);
  r(ctx, L.top, 2, 17, 1, 4);
  r(ctx, L.top, 13, 17, 1, 4);
  r(ctx, L.skin, 2, 21, 1, 2);
  r(ctx, L.skin, 13, 21, 1, 2);
  r(ctx, L.skin, 6, 15, 4, 1);
}

function drawDown(ctx: Ctx, L: Look, step: number) {
  r(ctx, SHADOW, 3, 30, 10, 2);
  legsFront(ctx, L, step);
  torsoFront(ctx, L);
  if (L.skirt) {
    r(ctx, L.front, 5, 16, 1, 7);
    r(ctx, L.front, 10, 16, 1, 7);
  } else {
    r(ctx, L.front, 5, 17, 6, 8);
  }
  r(ctx, L.skin, 4, 9, 8, 6);
  r(ctx, EYE, 6, 11, 1, 2);
  r(ctx, EYE, 9, 11, 1, 2);
  if (L.glasses) {
    r(ctx, GLASS, 5, 10, 3, 1);
    r(ctx, GLASS, 8, 10, 3, 1);
    r(ctx, GLASS, 5, 13, 6, 1);
  }
  r(ctx, L.hair, 4, 6, 8, 3);
  r(ctx, L.hairLight, 5, 6, 4, 1);
  r(ctx, L.hair, 3, 8, 1, 5);
  r(ctx, L.hair, 12, 8, 1, 5);
  if (L.bun) {
    r(ctx, L.hair, 6, 3, 4, 3);
    r(ctx, L.hairLight, 7, 3, 2, 1);
  }
  if (L.cap) {
    r(ctx, L.cap, 4, 4, 8, 4);
    r(ctx, L.cap, 3, 8, 10, 1);
  }
}

function drawUp(ctx: Ctx, L: Look, step: number) {
  r(ctx, SHADOW, 3, 30, 10, 2);
  legsFront(ctx, L, step);
  torsoFront(ctx, L);
  if (!L.skirt) r(ctx, L.front, 7, 18, 2, 1);
  r(ctx, L.hair, 3, 6, 10, 9);
  r(ctx, L.hairLight, 5, 7, 5, 1);
  if (L.bun) {
    r(ctx, L.hair, 5, 3, 6, 4);
    r(ctx, L.hairLight, 6, 4, 3, 1);
  }
  if (L.cap) r(ctx, L.cap, 3, 4, 10, 5);
}

function drawSide(ctx: Ctx, L: Look, step: number) {
  r(ctx, SHADOW, 3, 30, 10, 2);
  if (L.skirt) {
    r(ctx, L.legs, 5, 22, 7, 7);
    r(ctx, L.shoe, step === 1 ? 3 : 4, 29, 4, 2);
    r(ctx, L.shoe, step === 2 ? 9 : 8, 29, 3, 2);
  } else if (step === 0) {
    r(ctx, L.legs, 6, 23, 5, 7);
    r(ctx, L.shoe, 5, 30, 5, 2);
  } else {
    const [a, b] = step === 1 ? [4, 9] : [9, 4];
    r(ctx, L.legs, 6, 23, 5, 4);
    r(ctx, L.legs, a, 27, 3, 3);
    r(ctx, L.legs, b, 27, 3, 2);
    r(ctx, L.shoe, a - 1, 30, 4, 2);
    r(ctx, L.shoe, b - 1, 29, 4, 2);
  }
  r(ctx, L.top, 5, 16, 7, 7);
  r(ctx, L.front, 4, 17, 2, L.skirt ? 5 : 7);
  r(ctx, L.top, 7, 17, 3, 4);
  r(ctx, L.skin, 7, 21, 2, 2);
  r(ctx, L.skin, 7, 15, 3, 1);
  r(ctx, L.skin, 4, 9, 7, 6);
  r(ctx, EYE, 5, 11, 1, 2);
  if (L.glasses) r(ctx, GLASS, 4, 10, 3, 1);
  r(ctx, L.hair, 4, 6, 8, 3);
  r(ctx, L.hair, 9, 8, 3, 6);
  r(ctx, L.hairLight, 6, 6, 4, 1);
  if (L.bun) {
    r(ctx, L.hair, 10, 4, 4, 4);
    r(ctx, L.hairLight, 11, 4, 2, 1);
  }
  if (L.cap) {
    r(ctx, L.cap, 4, 4, 8, 4);
    r(ctx, L.cap, 1, 7, 5, 1);
  }
}

const DRAW = { down: drawDown, up: drawUp, side: drawSide } as const;

/** Frame index for a facing and step, matching the order in the sheet. */
export function frameIndex(facing: (typeof FACINGS)[number], step: number): number {
  return FACINGS.indexOf(facing) * FRAMES_PER_FACING + step;
}

export function drawPlaceholderCharacter(canvas: HTMLCanvasElement, look: Look): void {
  canvas.width = FACINGS.length * FRAMES_PER_FACING * CHAR_W;
  canvas.height = CHAR_H;
  const ctx = canvas.getContext('2d')!;
  for (const facing of FACINGS) {
    for (let step = 0; step < FRAMES_PER_FACING; step++) {
      ctx.save();
      ctx.translate(frameIndex(facing, step) * CHAR_W, 0);
      DRAW[facing](ctx, look, step);
      ctx.restore();
    }
  }
}
