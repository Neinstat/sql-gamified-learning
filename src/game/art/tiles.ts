import { TILE, TILE_COUNT, TILE_SIZE } from '../rooms/cafe';
import { fill, paintGrid } from './palette';

/**
 * The café tileset in the final autumn style (GAME_DESIGN.md §3).
 *
 * - Table, chair, potted plant, counter and painting: from Kenney's "Roguelike Indoors" pack
 *   (CC0, see CREDITS.md), recoloured to our palette.
 * - Floor, walls, window, shelf, coffee machine, cash register, menu board and door mat: our own.
 */

// --- From Kenney "Roguelike Indoors" (CC0), recoloured ---------------------------------------

/** Round café table (sheet tile 7,0). */
const TABLE = [
  '.....222222.....',
  '...2255555522...',
  '..255555555552..',
  '.25555555555552.',
  '.25555555555552.',
  '2555555555555552',
  '2555555555555552',
  '2555555555555552',
  '2555555555555552',
  '2455555555555542',
  '2455555555555542',
  '.24555555555542.',
  '..244555555442..',
  '..242444444242..',
  '..242222222242..',
  '..242......242..',
];

/** Chair facing right, back on the left (sheet tile 2,2). Mirrored for the other side of a table. */
const CHAIR = [
  '................',
  '................',
  '................',
  '...2222.........',
  '...2552.........',
  '...2552.........',
  '...2552.........',
  '...2552222222...',
  '...2445555552...',
  '...244ooooo52...',
  '...244ooooo52...',
  '...244ooooo52...',
  '...2445555552...',
  '...2444444442...',
  '...2422222242...',
  '...242....242...',
];

/** Potted plant (sheet tile 16,0), now in a terracotta pot. */
const PLANT = [
  '........GGG.....',
  '.......GLLG.....',
  '......GLLG......',
  '...GGGGLlG......',
  '...GLLGllG......',
  '....GLlllGGG....',
  '....GLlllLLG....',
  '....GllllLG.....',
  '....GlllllG.....',
  '.....GlllG......',
  '....oOOOOOo.....',
  '....5777775.....',
  '.....oOOOo......',
  '.....oOOOo......',
  '......ooo.......',
  '................',
];

/** Counter with a stone top and a drawer (sheet tile 1,12). */
const COUNTER = [
  'xxxxxxxxxxxxxxxx',
  'XXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXX',
  'zzzzzzzzzzzzzzzz',
  '4444444444444444',
  '4555555555555554',
  '4544444444444454',
  '4544444224444454',
  '4544444444444454',
  '4555555555555554',
  '4444444444444444',
  '2222222222222222',
  '................',
];

/** A framed autumn painting (sheet tile 19,13), hung above the wall rail. */
const PAINTING = [
  '33....3333....33',
  '3733337777333373',
  '.37777777777773.',
  '.36yyyyyOOyyy63.',
  '.36yyyyyOyyyy63.',
  '.36yyyOOOOyyy63.',
  '.36yyOOOOOOyy63.',
  '.36yyOOOOOOyy63.',
  '.36yyOOOOOOyy63.',
  '.36yyyOOOOyyy63.',
  '.36777777777763.',
  '3733333773333373',
  '33.....33.....33',
];

// --- Our own ---------------------------------------------------------------------------------

/** A pair of windows looking out on autumn trees. Drawn over the wall. */
const WINDOW = [
  '................',
  '..333333333333..',
  '..3CCCC33CCCC3..',
  '..3C8CC33C8CC3..',
  '..3CCCC33CCCC3..',
  '..3cCCc33cCCc3..',
  '..3yOyc33cyOy3..',
  '..3OyOy33yOyO3..',
  '..333333333333..',
  '.55555555555555.',
  '.33333333333333.',
];

/** Wall shelf with jars and cups. */
const SHELF = [
  '................',
  '..Y......8...O..',
  '.yYy....878.oOo.',
  '.yyy....777.ooo.',
  '3333333333333333',
  '2222222222222222',
  '.2............2.',
  '..88..B...8..L..',
  '.8778.BB.878.lL.',
  '.7777.Bb.777.ll.',
  '3333333333333333',
  '2222222222222222',
  '.2............2.',
];

/** A rust-red espresso machine with a chrome panel and two cups. */
const COFFEE_MACHINE = [
  '................',
  '...kkkkkkkkkk...',
  '...kooooooook...',
  '...kOOOOOOOOk...',
  '...kozXXXXzok...',
  '...kozXYYXzok...',
  '...kozXXXXzok...',
  '...kooooooook...',
  '...kkxxkkxxkk...',
  '....kxk..kxk....',
  '................',
  '.....88...88....',
  '....k87k.k87k...',
  '...kkkkkkkkkkk..',
  '...kXXXXXXXXXk..',
  '...kkkkkkkkkkk..',
];

/** An olive cash register, drawn on a counter. */
const REGISTER = [
  '....kkkkkkk.....',
  '....kmmmmmk.....',
  '....kkkkkkk.....',
  '...kGlllllGk....',
  '...kl7l7l7lk....',
  '...kl7l7l7lk....',
  '..kkGGGGGGGkk...',
  '..k333333333k...',
];

/** A standing chalkboard with today's menu. */
const MENU_BOARD = [
  '..kkkkkkkkkkkk..',
  '..k3333333333k..',
  '..k3gggggggg3k..',
  '..k3gYYYYYgg3k..',
  '..k3gggggggg3k..',
  '..k3g88g8ggg3k..',
  '..k3gggggg8g3k..',
  '..k3g888gggg3k..',
  '..k3gggggggg3k..',
  '..k3g88g88gg3k..',
  '..k3gggggggg3k..',
  '..k3333333333k..',
  '..kkkkkkkkkkkk..',
  '...k3k....k3k...',
  '...k3k....k3k...',
  '...kkk....kkk...',
];

type Ctx = CanvasRenderingContext2D;

/** Wooden planks: four boards per tile, joints staggered, a little grain. Kept calm so people stand out. */
function floor(ctx: Ctx) {
  const joints = [5, 12, 2, 9];
  const grain = [10, 3, 8, 14];
  joints.forEach((joint, band) => {
    const y = band * 4;
    fill(ctx, '4', 0, y, 16, 3);
    fill(ctx, '3', 0, y + 3, 16, 1);
    fill(ctx, '3', joint, y, 1, 3);
    fill(ctx, '5', grain[band], y + 1, 2, 1);
  });
}

/** The top of a wall, seen from above. */
function wallTop(ctx: Ctx) {
  fill(ctx, '1', 0, 0, 16, 16);
  fill(ctx, '2', 0, 0, 16, 1);
}

/** Cream striped wallpaper above a wooden rail and wainscot. */
function wallFace(ctx: Ctx) {
  fill(ctx, '7', 0, 0, 16, 9);
  fill(ctx, '6', 0, 0, 1, 9);
  fill(ctx, '6', 8, 0, 1, 9);
  fill(ctx, 'y', 4, 3, 1, 1);
  fill(ctx, 'y', 12, 6, 1, 1);
  fill(ctx, '5', 0, 9, 16, 1);
  fill(ctx, '3', 0, 10, 16, 5);
  fill(ctx, '2', 0, 11, 1, 4);
  fill(ctx, '2', 8, 11, 1, 4);
  fill(ctx, '2', 0, 15, 16, 1);
}

/** A woven rust doormat on the floor. */
function doorMat(ctx: Ctx) {
  floor(ctx);
  fill(ctx, 'k', 1, 2, 14, 12);
  fill(ctx, 'o', 2, 3, 12, 10);
  fill(ctx, 'y', 3, 4, 10, 1);
  fill(ctx, 'y', 3, 11, 10, 1);
  fill(ctx, 'O', 4, 6, 8, 1);
  fill(ctx, 'O', 4, 9, 8, 1);
}

const grid = (g: readonly string[], x = 0, y = 0, flip = false) => (ctx: Ctx) => paintGrid(ctx, g, x, y, flip);
const both =
  (...draws: ((ctx: Ctx) => void)[]) =>
  (ctx: Ctx) =>
    draws.forEach((draw) => draw(ctx));

const TILES: Record<number, (ctx: Ctx) => void> = {
  [TILE.floor]: floor,
  [TILE.wall]: wallTop,
  [TILE.wallFace]: wallFace,
  [TILE.window]: both(wallFace, grid(WINDOW)),
  [TILE.counter]: grid(COUNTER),
  [TILE.register]: both(grid(COUNTER), grid(REGISTER)),
  [TILE.table]: grid(TABLE),
  [TILE.chair]: grid(CHAIR),
  [TILE.chairFlipped]: grid(CHAIR, 0, 0, true),
  [TILE.plant]: grid(PLANT),
  [TILE.menuBoard]: grid(MENU_BOARD),
  [TILE.shelf]: grid(SHELF),
  [TILE.coffeeMachine]: grid(COFFEE_MACHINE),
  [TILE.doorMat]: doorMat,
  [TILE.painting]: both(wallFace, grid(PAINTING)),
};

/** Every pixel-art grid in this file, for tests (equal rows, palette colours only). */
export const TILE_GRIDS = { TABLE, CHAIR, PLANT, COUNTER, PAINTING, WINDOW, SHELF, COFFEE_MACHINE, REGISTER, MENU_BOARD };

/** Draws every tile side by side into a canvas of TILE_COUNT × 1 tiles. */
export function drawTileset(canvas: HTMLCanvasElement): void {
  canvas.width = TILE_COUNT * TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < TILE_COUNT; i++) {
    ctx.save();
    ctx.translate(i * TILE_SIZE, 0);
    TILES[i](ctx);
    ctx.restore();
  }
}
