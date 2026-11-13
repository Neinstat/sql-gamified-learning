/**
 * Placeholder player sprite (16×32 per frame), drawn in code — no third-party art.
 * Frames in a single row: for each facing (down, up, side) → stand, step A, step B.
 * "side" faces left; facing right is the same frame flipped.
 */
export const CHAR_W = 16;
export const CHAR_H = 32;
export const FACINGS = ['down', 'up', 'side'] as const;
export const FRAMES_PER_FACING = 3;

const P = {
  shadow: 'rgba(0,0,0,0.22)',
  hair: '#5a3a26',
  hairLight: '#74503a',
  skin: '#f1c9a5',
  eye: '#2b211c',
  shirt: '#3f8a86',
  apron: '#f3e6cc',
  pants: '#4a4258',
  shoe: '#2b211c',
} as const;

type Ctx = CanvasRenderingContext2D;
const r = (ctx: Ctx, c: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
};

/** step: 0 = standing, 1 = left foot forward, 2 = right foot forward. */
function legsFront(ctx: Ctx, step: number) {
  const lift = (leg: number) => (step === leg ? 1 : 0);
  r(ctx, P.pants, 4, 27 - lift(1), 3, 3);
  r(ctx, P.pants, 9, 27 - lift(2), 3, 3);
  r(ctx, P.shoe, 4, 30 - lift(1), 3, 2);
  r(ctx, P.shoe, 9, 30 - lift(2), 3, 2);
}

function drawDown(ctx: Ctx, step: number) {
  r(ctx, P.shadow, 3, 30, 10, 2);
  legsFront(ctx, step);
  r(ctx, P.pants, 4, 23, 8, 4);
  r(ctx, P.shirt, 3, 16, 10, 7);
  r(ctx, P.shirt, 2, 17, 1, 4);
  r(ctx, P.shirt, 13, 17, 1, 4);
  r(ctx, P.skin, 2, 21, 1, 2);
  r(ctx, P.skin, 13, 21, 1, 2);
  r(ctx, P.apron, 5, 17, 6, 8);
  r(ctx, P.skin, 6, 15, 4, 1);
  r(ctx, P.skin, 4, 9, 8, 6);
  r(ctx, P.eye, 6, 11, 1, 2);
  r(ctx, P.eye, 9, 11, 1, 2);
  r(ctx, P.hair, 4, 6, 8, 4);
  r(ctx, P.hairLight, 5, 6, 4, 1);
  r(ctx, P.hair, 3, 8, 1, 5);
  r(ctx, P.hair, 12, 8, 1, 5);
}

function drawUp(ctx: Ctx, step: number) {
  r(ctx, P.shadow, 3, 30, 10, 2);
  legsFront(ctx, step);
  r(ctx, P.pants, 4, 23, 8, 4);
  r(ctx, P.shirt, 3, 16, 10, 7);
  r(ctx, P.shirt, 2, 17, 1, 4);
  r(ctx, P.shirt, 13, 17, 1, 4);
  r(ctx, P.skin, 2, 21, 1, 2);
  r(ctx, P.skin, 13, 21, 1, 2);
  r(ctx, P.apron, 7, 18, 2, 1);
  r(ctx, P.skin, 6, 15, 4, 1);
  r(ctx, P.hair, 3, 6, 10, 9);
  r(ctx, P.hairLight, 5, 7, 5, 1);
}

function drawSide(ctx: Ctx, step: number) {
  r(ctx, P.shadow, 3, 30, 10, 2);
  if (step === 0) {
    r(ctx, P.pants, 6, 23, 5, 7);
    r(ctx, P.shoe, 5, 30, 5, 2);
  } else {
    const [a, b] = step === 1 ? [4, 9] : [9, 4];
    r(ctx, P.pants, 6, 23, 5, 4);
    r(ctx, P.pants, a, 27, 3, 3);
    r(ctx, P.pants, b, 27, 3, 2);
    r(ctx, P.shoe, a - 1, 30, 4, 2);
    r(ctx, P.shoe, b - 1, 29, 4, 2);
  }
  r(ctx, P.shirt, 5, 16, 7, 7);
  r(ctx, P.apron, 4, 17, 2, 7);
  r(ctx, P.shirt, 7, 17, 3, 4);
  r(ctx, P.skin, 7, 21, 2, 2);
  r(ctx, P.skin, 7, 15, 3, 1);
  r(ctx, P.skin, 4, 9, 7, 6);
  r(ctx, P.eye, 5, 11, 1, 2);
  r(ctx, P.hair, 4, 6, 8, 3);
  r(ctx, P.hair, 9, 8, 3, 6);
  r(ctx, P.hairLight, 6, 6, 4, 1);
}

const DRAW = { down: drawDown, up: drawUp, side: drawSide } as const;

/** Frame index for a facing and step, matching the order in the sheet. */
export function frameIndex(facing: (typeof FACINGS)[number], step: number): number {
  return FACINGS.indexOf(facing) * FRAMES_PER_FACING + step;
}

export function drawPlaceholderPlayer(canvas: HTMLCanvasElement): void {
  canvas.width = FACINGS.length * FRAMES_PER_FACING * CHAR_W;
  canvas.height = CHAR_H;
  const ctx = canvas.getContext('2d')!;
  for (const facing of FACINGS) {
    for (let step = 0; step < FRAMES_PER_FACING; step++) {
      ctx.save();
      ctx.translate(frameIndex(facing, step) * CHAR_W, 0);
      DRAW[facing](ctx, step);
      ctx.restore();
    }
  }
}
