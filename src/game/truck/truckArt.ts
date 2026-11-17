/**
 * The food truck, first person (GAME_DESIGN.md §14.8): a panorama of four sides, each one screen
 * wide — fridge & stock, the serving window, the kitchen, the back door. Through the window: the
 * park the truck is parked in. Drawn in the risograph style (art/riso.ts) with plain canvas calls,
 * so it needs no Phaser and is tested.
 *
 * ⚠ Every drawing here is a PLACEHOLDER (docs/ASSETS.md) until final art is chosen in Phase 7.
 */
import { dither, disc, line, printBox, rect, RISO, soft, type Ink } from '../art/riso';

/** The screen (base resolution); each side of the truck is one screen wide. */
export const TRUCK_W = 480;
export const TRUCK_H = 270;
export const PANEL_W = TRUCK_W;
export const PANELS = ['fridge', 'window', 'kitchen', 'door'] as const;
export type PanelId = (typeof PANELS)[number];
export const WORLD_W = PANEL_W * PANELS.length;
/** The game starts looking out of the serving window. */
export const START_PANEL = 1;

/** Largest whole-number zoom that fits (sharp pixels); smaller screens get a fractional fit. */
export function truckZoom(width: number, height: number): number {
  const fit = Math.min(width / TRUCK_W, height / TRUCK_H);
  return fit >= 1 ? Math.floor(fit) : fit;
}

type Box = { x: number; y: number; w: number; h: number };

/** Where things are, in world pixels. */
export const TRUCK_LAYOUT = {
  /** The serving window (see-through) and the counter in front of it. */
  window: { x: 520, y: 24, w: 400, h: 162 },
  counterTop: 186,
  tablet: { x: 816, y: 156, w: 84, h: 44 },
  fridge: { x: 52, y: 18, w: 196, h: 246 },
  stockShelves: { x: 276, y: 40, w: 176, h: 200 },
  coffeeMachine: { x: 986, y: 96, w: 128, h: 90 },
  menuBoard: { x: 1146, y: 18, w: 146, h: 112 },
  recipeShelf: { x: 1312, y: 70, w: 112, h: 56 },
  door: { x: 1598, y: 16, w: 164, h: 254 },
} as const satisfies Record<string, Box | number>;

/** The wall clock above the coffee machine (its hands show the time of day). */
export const CLOCK = { cx: 1050, cy: 54, r: 20 } as const;

type Ctx = CanvasRenderingContext2D;

// ── The park outside the window (its own layer, moves slower: parallax) ─────────────────

export const OUTSIDE_W = 1100;
export const OUTSIDE_PARALLAX = 0.55;
/** Where the park layer sits so it is centred in the window when looking out of it. */
export const OUTSIDE_X = Math.round(TRUCK_W / 2 - OUTSIDE_W / 2 + START_PANEL * PANEL_W * OUTSIDE_PARALLAX);
/** The horizon line in the park. */
const HORIZON = 120;

/** The path customers queue on, as [y, centre x, width] from the horizon down (park pixels). */
const PATH: readonly [number, number, number][] = [
  [128, 330, 8],
  [152, 398, 30],
  [172, 462, 52],
  [270, 560, 150],
];

function pathAt(y: number): { cx: number; w: number } {
  for (let i = 1; i < PATH.length; i++) {
    const [y1, c1, w1] = PATH[i - 1];
    const [y2, c2, w2] = PATH[i];
    if (y <= y2) {
      const t = (y - y1) / (y2 - y1);
      return { cx: c1 + (c2 - c1) * t, w: w1 + (w2 - w1) * t };
    }
  }
  const [, c, w] = PATH[PATH.length - 1];
  return { cx: c, w };
}

function bench(ctx: Ctx, x: number, y: number, scale: number): void {
  const w = Math.round(40 * scale);
  const h = Math.max(2, Math.round(4 * scale));
  rect(ctx, 'ink', x, y - 10 * scale, w, h);
  rect(ctx, 'wood', x + 1, y - 10 * scale + 1, w - 2, Math.max(1, h - 2));
  rect(ctx, 'ink', x, y - 4 * scale, w, h);
  rect(ctx, 'wood', x + 1, y - 4 * scale + 1, w - 2, Math.max(1, h - 2));
  rect(ctx, 'ink', x + 3 * scale, y - 4 * scale, Math.max(1, 2 * scale), 6 * scale);
  rect(ctx, 'ink', x + w - 5 * scale, y - 4 * scale, Math.max(1, 2 * scale), 6 * scale);
}

function picnicTable(ctx: Ctx, x: number, y: number): void {
  // Umbrella.
  rect(ctx, 'ink', x + 29, y - 52, 2, 40);
  for (let i = 0; i < 6; i++) {
    const ink: Ink = i % 2 === 0 ? 'red' : 'white';
    rect(ctx, ink, x + 2 + i * 9, y - 60 + Math.abs(2.5 - i) * 2, 9, 8 - Math.abs(2.5 - i) * 2);
  }
  line(ctx, 'ink', x + 2, y - 52, x + 30, y - 62);
  line(ctx, 'ink', x + 30, y - 62, x + 56, y - 52);
  // Table and benches.
  rect(ctx, 'ink', x, y - 14, 60, 4);
  rect(ctx, 'wood', x + 1, y - 13, 58, 2);
  rect(ctx, 'ink', x + 8, y - 10, 3, 12);
  rect(ctx, 'ink', x + 49, y - 10, 3, 12);
  rect(ctx, 'ink', x - 6, y - 4, 72, 3);
  rect(ctx, 'woodDark', x - 5, y - 3, 70, 1);
}

function lampPost(ctx: Ctx, x: number, groundY: number, height: number): void {
  rect(ctx, 'ink', x, groundY - height, 2, height);
  rect(ctx, 'ink', x - 4, groundY - height - 4, 10, 4);
  rect(ctx, 'mustard', x - 3, groundY - height - 1, 8, 3);
  dither(ctx, 'mustard', x - 8, groundY - height + 2, 18, 6, 'light');
}

export function paintPark(ctx: Ctx): void {
  const W = OUTSIDE_W;
  // Dusk sky in dithered bands.
  rect(ctx, 'lilac', 0, 0, W, 44);
  rect(ctx, 'peach', 0, 44, W, 50);
  dither(ctx, 'lilac', 0, 44, W, 14, 'half');
  dither(ctx, 'lilac', 0, 58, W, 10, 'light');
  rect(ctx, 'paper', 0, 94, W, HORIZON - 94);
  dither(ctx, 'peach', 0, 94, W, 12, 'half');
  dither(ctx, 'peach', 0, 106, W, 8, 'light');
  // Sun on the horizon, with a mis-printed red rim.
  disc(ctx, 'red', 742, HORIZON - 1, 24, true);
  disc(ctx, 'mustard', 741, HORIZON - 2, 22, true);
  dither(ctx, 'white', 730, HORIZON - 18, 22, 10, 'light');
  // Far-away city: faded silhouettes.
  for (let i = 0, x = 0; x < W - 8; i++) {
    const w = Math.min(18 + ((i * 13) % 22), W - x);
    const h = 16 + ((i * 29) % 38);
    rect(ctx, 'inkSoft', x, HORIZON - h, w, h);
    dither(ctx, 'lilac', x, HORIZON - h, w, h, 'half');
    if (i % 4 === 1) rect(ctx, 'inkSoft', x + w / 2, HORIZON - h - 8, 1, 8);
    for (let wy = HORIZON - h + 4; wy < HORIZON - 4; wy += 6) {
      for (let wx = x + 3; wx < x + w - 3; wx += 5) if ((wx * 7 + wy) % 5 === 0) rect(ctx, 'mustard', wx, wy, 2, 2);
    }
    x += w + 2;
  }
  // Tree line.
  for (let x = 20; x < W - 20; x += 26) {
    const r = 12 + ((x * 3) % 7);
    disc(ctx, 'tealDark', x, HORIZON + 4, r);
    dither(ctx, 'teal', x - r, HORIZON + 4 - r, r * 2, r, 'half');
  }
  // Lawn with mowing stripes.
  rect(ctx, 'grass', 0, HORIZON + 8, W, TRUCK_H - HORIZON - 8);
  for (let y = HORIZON + 8, i = 0; y < TRUCK_H; i++) {
    const h = 4 + i * 2;
    if (i % 2 === 1) dither(ctx, 'grassDark', 0, y, W, h, 'half');
    y += h;
  }
  // The winding path where customers queue.
  for (let y = PATH[0][0]; y < TRUCK_H; y++) {
    const { cx, w } = pathAt(y);
    rect(ctx, 'ink', cx - w / 2 - 1, y, w + 2, 1);
    rect(ctx, 'paperShade', cx - w / 2, y, w, 1);
  }
  dither(ctx, 'paper', 470, 200, 160, 70, 'light');
  // Park furniture: empty for now — they fill up with visitors when business is good (Phase 7).
  bench(ctx, 170, 140, 0.6);
  bench(ctx, 230, 146, 0.7);
  bench(ctx, 840, 142, 0.6);
  picnicTable(ctx, 660, 186);
  picnicTable(ctx, 880, 214);
  picnicTable(ctx, 120, 222);
  // Lamp posts and string lights.
  lampPost(ctx, 300, 160, 70);
  lampPost(ctx, 620, 150, 66);
  lampPost(ctx, 960, 176, 90);
  for (const [x1, x2, sag] of [[301, 621, 14], [621, 961, 18]] as const) {
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = x1 + (x2 - x1) * t;
      const y = 90 + (x1 === 301 ? 0 : -6) + Math.sin(t * Math.PI) * sag + t * (x1 === 301 ? 0 : 0);
      rect(ctx, 'ink', x, y, 1, 1);
      if (i % 2 === 0) rect(ctx, i % 4 === 0 ? 'mustard' : 'red', x - 1, y + 1, 3, 3);
    }
  }
  // Flower beds.
  for (const [x, y] of [[40, 200], [960, 236], [380, 230]] as const) {
    soft(ctx, 'grassDark', x, y, 50, 16, 5);
    for (let i = 0; i < 8; i++) rect(ctx, i % 2 ? 'pink' : 'white', x + 4 + i * 6, y + 2 + (i % 3) * 3, 2, 2);
  }
}

// ── Inside the truck ───────────────────────────────────────────────────────────────────

function wallsAndCorners(ctx: Ctx): void {
  // Cream wall with a teal lower band and a dark ceiling strip.
  rect(ctx, 'paper', 0, 0, WORLD_W, TRUCK_H);
  dither(ctx, 'paperShade', 0, 0, WORLD_W, 60, 'light');
  rect(ctx, 'teal', 0, 200, WORLD_W, TRUCK_H - 200);
  dither(ctx, 'tealDark', 0, 236, WORLD_W, 34, 'half');
  rect(ctx, 'ink', 0, 199, WORLD_W, 1);
  rect(ctx, 'ink', 0, 0, WORLD_W, 8);
  rect(ctx, 'red', 0, 8, WORLD_W, 1);
  // Corners between the sides: a shadow so turning reads as turning.
  for (let i = 1; i < PANELS.length; i++) {
    const x = i * PANEL_W;
    rect(ctx, 'ink', x - 1, 0, 2, TRUCK_H);
    dither(ctx, 'paperShade', x + 1, 8, 14, 191, 'half');
    dither(ctx, 'tealDark', x + 1, 200, 14, 70, 'half');
  }
}

/** The counter that runs under the window and through the kitchen. */
function counter(ctx: Ctx, x: number, w: number): void {
  const top = TRUCK_LAYOUT.counterTop;
  rect(ctx, 'ink', x, top, w, 2);
  rect(ctx, 'white', x, top + 2, w, 8);
  dither(ctx, 'paperShade', x, top + 6, w, 4, 'half');
  rect(ctx, 'ink', x, top + 10, w, 2);
  rect(ctx, 'wood', x, top + 12, w, TRUCK_H - top - 12);
  for (let cx = x + 8; cx + 80 <= x + w; cx += 92) {
    printBox(ctx, 'wood', cx, top + 22, 80, TRUCK_H - top - 30, false);
    dither(ctx, 'woodDark', cx + 1, top + 23, 78, 10, 'half');
    rect(ctx, 'mustard', cx + 68, top + 44, 4, 12);
  }
}

function sticker(ctx: Ctx, ink: Ink, x: number, y: number, w: number, h: number): void {
  printBox(ctx, ink, x, y, w, h);
  rect(ctx, 'white', x + 3, y + 3, w - 6, 2);
  rect(ctx, 'white', x + 3, y + 7, (w - 6) / 2, 2);
}

function fridgeSide(ctx: Ctx): void {
  const f = TRUCK_LAYOUT.fridge;
  printBox(ctx, 'tealLight', f.x, f.y, f.w, f.h);
  rect(ctx, 'white', f.x + 4, f.y + 4, f.w - 8, 4);
  // Glass door full of stock.
  printBox(ctx, 'white', f.x + 12, f.y + 18, f.w - 24, f.h - 50, false);
  dither(ctx, 'tealLight', f.x + 13, f.y + 19, f.w - 26, f.h - 52, 'light');
  const items: Ink[] = ['white', 'mustard', 'pink', 'red', 'white', 'teal', 'mustard'];
  for (let s = 0; s < 4; s++) {
    const sy = f.y + 66 + s * 46;
    rect(ctx, 'inkSoft', f.x + 14, sy, f.w - 28, 3);
    for (let i = 0; i < 7; i++) {
      const ink = items[(i + s * 2) % items.length];
      const bx = f.x + 20 + i * 22;
      const tall = 30 + ((i + s) % 3) * 4;
      printBox(ctx, ink, bx, sy - tall, 16, tall, false);
      rect(ctx, 'ink', bx + 4, sy - tall - 4, 8, 4);
      rect(ctx, ink === 'white' ? 'teal' : 'white', bx + 3, sy - tall + 10, 10, 6);
    }
  }
  rect(ctx, 'ink', f.x + f.w - 20, f.y + 60, 6, 70);
  rect(ctx, 'mustard', f.x + f.w - 19, f.y + 61, 4, 68);
  // Feet.
  rect(ctx, 'ink', f.x + 12, f.y + f.h - 8, 20, 8);
  rect(ctx, 'ink', f.x + f.w - 32, f.y + f.h - 8, 20, 8);
  // Stock shelves with boxes and coffee sacks.
  const s = TRUCK_LAYOUT.stockShelves;
  for (let i = 0; i < 3; i++) {
    const sy = s.y + 58 + i * 66;
    rect(ctx, 'ink', s.x, sy, s.w, 6);
    rect(ctx, 'woodDark', s.x + 1, sy + 1, s.w - 2, 4);
    let bx = s.x + 6;
    for (let j = 0; bx < s.x + s.w - 30; j++) {
      const w = 30 + ((i + j) % 3) * 8;
      const h = 34 + ((i * 2 + j) % 3) * 6;
      if ((i + j) % 3 === 2) {
        // A coffee sack with a red stamp.
        soft(ctx, 'ink', bx, sy - h, w, h, 8);
        soft(ctx, 'wood', bx + 1, sy - h + 1, w - 2, h - 1, 7);
        disc(ctx, 'red', bx + w / 2, sy - h / 2, 6);
        disc(ctx, 'wood', bx + w / 2, sy - h / 2, 3);
      } else {
        printBox(ctx, 'mustard', bx, sy - h, w, h, false);
        dither(ctx, 'mustardDark', bx + 1, sy - h + 1, w - 2, 6, 'half');
        rect(ctx, 'ink', bx + 5, sy - h + 14, w - 10, 2);
      }
      bx += w + 4;
    }
  }
  // Stock clipboard pinned to the wall.
  printBox(ctx, 'white', 410, 6 + 12, 34, 40);
  rect(ctx, 'ink', 420, 14, 14, 6);
  for (let i = 0; i < 5; i++) rect(ctx, i === 2 ? 'red' : 'inkSoft', 415, 26 + i * 5, 24, 2);
}

function windowSide(ctx: Ctx): void {
  const w = TRUCK_LAYOUT.window;
  // Frame with a mis-printed edge.
  rect(ctx, 'red', w.x - 7, w.y - 7, w.w + 16, w.h + 9);
  rect(ctx, 'ink', w.x - 8, w.y - 8, w.w + 16, w.h + 8);
  // Rolled-up shutter.
  rect(ctx, 'inkSoft', w.x, w.y, w.w, 10);
  for (let x = w.x; x < w.x + w.w; x += 5) rect(ctx, 'ink', x, w.y + 1, 1, 8);
  // Stickers beside the window.
  sticker(ctx, 'red', 486, 40, 26, 30);
  sticker(ctx, 'mustard', 490, 110, 22, 22);
  sticker(ctx, 'teal', 928, 60, 26, 26);
  counter(ctx, 480, PANEL_W);
}

/** Things standing on the window counter, drawn after the window is cut out. */
function windowCounterItems(ctx: Ctx): void {
  const top = TRUCK_LAYOUT.counterTop;
  // Tip jar.
  printBox(ctx, 'tealLight', 540, top - 34, 28, 34, false);
  dither(ctx, 'white', 541, top - 33, 26, 32, 'light');
  rect(ctx, 'mustard', 543, top - 14, 22, 12);
  disc(ctx, 'mustard', 552, top - 16, 3);
  rect(ctx, 'red', 538, top - 38, 32, 5);
  // Napkins and a little potted plant.
  printBox(ctx, 'inkSoft', 580, top - 18, 30, 18, false);
  rect(ctx, 'white', 584, top - 24, 22, 7);
  printBox(ctx, 'red', 770, top - 16, 20, 16, false);
  disc(ctx, 'grassDark', 780, top - 22, 9);
  disc(ctx, 'grass', 777, top - 25, 5);
  // Tablet (POS) on a stand.
  const t = TRUCK_LAYOUT.tablet;
  rect(ctx, 'ink', t.x + t.w / 2 - 8, t.y + t.h - 10, 16, 10);
  printBox(ctx, 'ink', t.x, t.y, t.w, t.h - 10);
  rect(ctx, 'tealDark', t.x + 4, t.y + 4, t.w - 8, t.h - 18);
  rect(ctx, 'mustard', t.x + 8, t.y + 8, 24, 3);
  rect(ctx, 'tealLight', t.x + 8, t.y + 14, 52, 2);
  rect(ctx, 'tealLight', t.x + 8, t.y + 19, 40, 2);
  rect(ctx, 'pink', t.x + 8, t.y + 24, 18, 2);
}

function kitchenSide(ctx: Ctx): void {
  counter(ctx, 960, PANEL_W);
  // A retro red espresso machine.
  const c = TRUCK_LAYOUT.coffeeMachine;
  printBox(ctx, 'red', c.x, c.y + 14, c.w, c.h - 14);
  soft(ctx, 'ink', c.x + 6, c.y, c.w - 12, 16, 6);
  soft(ctx, 'paperShade', c.x + 7, c.y + 1, c.w - 14, 15, 5);
  dither(ctx, 'redDark', c.x + 1, c.y + c.h - 20, c.w - 2, 19, 'half');
  disc(ctx, 'ink', c.x + c.w / 2, c.y + 34, 11);
  disc(ctx, 'white', c.x + c.w / 2, c.y + 34, 9);
  line(ctx, 'red', c.x + c.w / 2, c.y + 34, c.x + c.w / 2 + 5, c.y + 29);
  for (const gx of [c.x + 18, c.x + c.w - 38]) {
    rect(ctx, 'ink', gx, c.y + 52, 20, 10);
    rect(ctx, 'paperShade', gx + 2, c.y + 53, 16, 6);
    printBox(ctx, 'white', gx + 3, c.y + 68, 14, 16, false);
    rect(ctx, 'woodDark', gx + 4, c.y + 70, 12, 3);
  }
  // Steam.
  for (let i = 0; i < 3; i++) dither(ctx, 'white', c.x + 20 + i * 8, c.y - 16 - i * 4, 6, 12, 'light');
  // The menu board.
  const m = TRUCK_LAYOUT.menuBoard;
  rect(ctx, 'red', m.x - 3, m.y - 3, m.w + 8, m.h + 8);
  rect(ctx, 'woodDark', m.x - 4, m.y - 4, m.w + 8, m.h + 8);
  rect(ctx, 'ink', m.x, m.y, m.w, m.h);
  rect(ctx, 'mustard', m.x + 16, m.y + 10, m.w - 32, 5);
  for (let i = 0; i < 7; i++) {
    const ly = m.y + 26 + i * 11;
    rect(ctx, 'paper', m.x + 10, ly, 46 + ((i * 17) % 34), 3);
    rect(ctx, i % 3 === 0 ? 'pink' : 'tealLight', m.x + m.w - 26, ly, 16, 3);
  }
  // Recipe binders on a wall shelf, and hanging utensils.
  const r = TRUCK_LAYOUT.recipeShelf;
  const inks: Ink[] = ['red', 'teal', 'mustard', 'red', 'inkSoft', 'teal', 'pink'];
  let bx = r.x + 4;
  for (let i = 0; bx < r.x + r.w - 12; i++) {
    const bw = 12 + (i % 2) * 4;
    printBox(ctx, inks[i % inks.length], bx, r.y + 6 + (i % 3) * 2, bw, r.h - 12 - (i % 3) * 2, false);
    rect(ctx, 'white', bx + 3, r.y + 16, bw - 6, 6);
    bx += bw + 2;
  }
  rect(ctx, 'ink', r.x - 4, r.y + r.h - 6, r.w + 8, 6);
  rect(ctx, 'woodDark', r.x - 3, r.y + r.h - 5, r.w + 6, 4);
  rect(ctx, 'ink', 1310, 150, 114, 2);
  for (let i = 0; i < 5; i++) {
    const ux = 1320 + i * 22;
    rect(ctx, 'ink', ux, 152, 2, 14);
    if (i % 2 === 0) disc(ctx, 'inkSoft', ux + 1, 172, 6);
    else rect(ctx, 'inkSoft', ux - 2, 166, 6, 14);
  }
  // Jars on the counter.
  for (let i = 0; i < 3; i++) {
    const jx = 1150 + i * 40;
    printBox(ctx, 'white', jx, 150, 28, 36, false);
    rect(ctx, (['mustard', 'woodDark', 'pink'] as const)[i], jx + 2, 162, 24, 22);
    rect(ctx, 'red', jx - 1, 146, 30, 5);
  }
}

function doorSide(ctx: Ctx): void {
  // Floor shows here (no counter).
  rect(ctx, 'wood', 1440, 230, PANEL_W, 40);
  for (let x = 1440; x < 1920; x += 30) rect(ctx, 'woodDark', x, 230, 1, 40);
  rect(ctx, 'ink', 1440, 229, PANEL_W, 1);
  dither(ctx, 'woodDark', 1440, 230, PANEL_W, 8, 'half');
  // The back door.
  const d = TRUCK_LAYOUT.door;
  rect(ctx, 'red', d.x - 5, d.y - 5, d.w + 12, d.h + 5);
  rect(ctx, 'ink', d.x - 6, d.y - 6, d.w + 12, d.h + 6);
  rect(ctx, 'inkSoft', d.x, d.y, d.w, d.h);
  dither(ctx, 'ink', d.x, d.y + d.h - 60, d.w, 60, 'light');
  printBox(ctx, 'peach', d.x + 34, d.y + 22, d.w - 68, 70, false);
  dither(ctx, 'lilac', d.x + 35, d.y + 23, d.w - 70, 30, 'half');
  rect(ctx, 'grass', d.x + 35, d.y + 76, d.w - 70, 15);
  rect(ctx, 'ink', d.x + d.w / 2, d.y + 22, 1, 70);
  // "Staff only" stripe sign and the handle.
  printBox(ctx, 'mustard', d.x + 40, d.y + 104, d.w - 80, 18);
  for (let x = d.x + 44; x < d.x + d.w - 46; x += 8) rect(ctx, 'ink', x, d.y + 110, 4, 6);
  rect(ctx, 'ink', d.x + d.w - 26, d.y + 140, 12, 26);
  rect(ctx, 'mustard', d.x + d.w - 24, d.y + 142, 8, 22);
  // Coat hook with a spare apron.
  rect(ctx, 'ink', 1500, 60, 40, 4);
  rect(ctx, 'ink', 1512, 64, 3, 8);
  soft(ctx, 'ink', 1500, 70, 30, 80, 6);
  soft(ctx, 'teal', 1501, 71, 28, 78, 5);
  rect(ctx, 'mustard', 1508, 100, 14, 10);
  // Calendar and a bin.
  printBox(ctx, 'white', 1800, 40, 60, 66);
  rect(ctx, 'red', 1801, 41, 58, 12);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) rect(ctx, r === 1 && c === 3 ? 'red' : 'inkSoft', 1806 + c * 11, 60 + r * 11, 6, 6);
  printBox(ctx, 'tealDark', 1800, 200, 54, 62);
  dither(ctx, 'ink', 1801, 201, 52, 10, 'half');
}

/** The wall clock (hands at the given time). */
export function paintClock(ctx: Ctx, hour: number, minute: number): void {
  const { cx, cy, r } = CLOCK;
  disc(ctx, 'red', cx + 1, cy + 1, r + 1);
  disc(ctx, 'ink', cx, cy, r + 1);
  disc(ctx, 'white', cx, cy, r - 2);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rect(ctx, i % 3 === 0 ? 'ink' : 'inkSoft', cx + Math.sin(a) * (r - 6), cy - Math.cos(a) * (r - 6), i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
  }
  const hourAngle = (((hour % 12) + minute / 60) / 12) * Math.PI * 2;
  const minuteAngle = (minute / 60) * Math.PI * 2;
  line(ctx, 'ink', cx, cy, Math.round(cx + Math.sin(hourAngle) * 8), Math.round(cy - Math.cos(hourAngle) * 8));
  line(ctx, 'red', cx, cy, Math.round(cx + Math.sin(minuteAngle) * 13), Math.round(cy - Math.cos(minuteAngle) * 13));
  rect(ctx, 'ink', cx - 1, cy - 1, 3, 3);
}

/** All four sides of the truck (WORLD_W × TRUCK_H), with the window cut out (see-through). */
export function paintInterior(ctx: Ctx): void {
  const w = TRUCK_LAYOUT.window;
  wallsAndCorners(ctx);
  fridgeSide(ctx);
  windowSide(ctx);
  kitchenSide(ctx);
  doorSide(ctx);
  ctx.clearRect(w.x, w.y + 10, w.w, w.h - 10);
  windowCounterItems(ctx);
}

/** For tests: every colour the art may use. */
export const ART_COLOURS = new Set<string>(Object.values(RISO));
