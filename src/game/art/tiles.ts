import { TILE, TILE_COUNT, TILE_SIZE } from '../rooms/cafe';
import { fill, paintGrid } from './palette';

/**
 * The café tileset in the final autumn style (GAME_DESIGN.md §3).
 *
 * - Table, chair, potted plant, counter and painting: from Kenney's "Roguelike Indoors" pack
 *   (CC0, see CREDITS.md), recoloured to our palette.
 * - Floor, walls, window, shelf, coffee machine, cash register, menu board, door mat, doors and
 *   the kitchen (floor, stove, sink, fridge, work table, recipe book, pans), the back office (bookshelf,
 *   filing cabinet, desk, computer) and the storeroom (shelves, crates, milk crates, sacks, ledger): our own.
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

/** Cream and stone kitchen tiles in a checkerboard, with thin grout lines. */
function kitchenFloor(ctx: Ctx) {
  fill(ctx, 'z', 0, 0, 16, 16);
  fill(ctx, '7', 0, 0, 8, 8);
  fill(ctx, '7', 8, 8, 8, 8);
  fill(ctx, 'X', 0, 15, 16, 1);
  fill(ctx, 'X', 15, 0, 1, 16);
}

/** An open doorway in a side wall: floorboards between two door posts. */
function doorway(ctx: Ctx) {
  floor(ctx);
  fill(ctx, '2', 0, 0, 2, 16);
  fill(ctx, '2', 14, 0, 2, 16);
  fill(ctx, '1', 0, 0, 16, 1);
  fill(ctx, '1', 0, 15, 16, 1);
}

/** A closed plank door with a padlock: that room isn't open yet. */
function doorLocked(ctx: Ctx) {
  fill(ctx, '1', 0, 0, 16, 16);
  fill(ctx, '3', 2, 1, 12, 14);
  for (const x of [5, 8, 11]) fill(ctx, '2', x, 1, 1, 14);
  fill(ctx, '2', 2, 4, 12, 1);
  fill(ctx, '2', 2, 11, 12, 1);
  // Padlock.
  fill(ctx, 'k', 5, 5, 6, 6);
  fill(ctx, 'Y', 6, 7, 4, 3);
  fill(ctx, 'k', 6, 4, 1, 2);
  fill(ctx, 'k', 9, 4, 1, 2);
  fill(ctx, 'k', 7, 3, 2, 1);
  fill(ctx, 'r', 7, 8, 2, 1);
}

/** A cast-iron stove with two burners and a pot. */
function stove(ctx: Ctx) {
  fill(ctx, 'k', 0, 0, 16, 15);
  fill(ctx, 'n', 1, 1, 14, 13);
  fill(ctx, 'N', 1, 1, 14, 6);
  for (const x of [2, 9]) {
    fill(ctx, 'x', x, 2, 5, 4);
    fill(ctx, 'k', x + 1, 3, 3, 2);
  }
  fill(ctx, 'o', 9, 1, 5, 4);
  fill(ctx, 'O', 10, 1, 3, 1);
  fill(ctx, 'x', 2, 9, 12, 1);
  fill(ctx, 'O', 3, 11, 2, 1);
  fill(ctx, 'O', 11, 11, 2, 1);
}

/** A stone counter with a sink and a tap. */
function sink(ctx: Ctx) {
  paintGrid(ctx, COUNTER);
  fill(ctx, 'x', 3, 1, 10, 5);
  fill(ctx, 'c', 4, 2, 8, 3);
  fill(ctx, 'C', 5, 2, 3, 1);
  fill(ctx, 'x', 7, 0, 2, 2);
}

/** A cream fridge with a chrome handle. */
function fridge(ctx: Ctx) {
  fill(ctx, 'k', 1, 0, 14, 16);
  fill(ctx, '8', 2, 0, 12, 15);
  fill(ctx, '7', 11, 0, 3, 15);
  fill(ctx, 'X', 2, 6, 12, 1);
  fill(ctx, 'x', 3, 2, 1, 3);
  fill(ctx, 'x', 3, 8, 1, 4);
  fill(ctx, 'y', 9, 2, 2, 2);
}

/** A wooden work table with a cutting board and a mixing bowl. */
function workTable(ctx: Ctx) {
  fill(ctx, '2', 0, 1, 16, 14);
  fill(ctx, '5', 0, 1, 16, 10);
  fill(ctx, '4', 0, 10, 16, 1);
  fill(ctx, '6', 2, 3, 6, 5);
  fill(ctx, 'l', 3, 4, 2, 1);
  fill(ctx, 'O', 5, 5, 2, 1);
  fill(ctx, 'B', 10, 3, 5, 5);
  fill(ctx, 'p', 11, 4, 3, 2);
  fill(ctx, '2', 1, 13, 2, 2);
  fill(ctx, '2', 13, 13, 2, 2);
}

/** Grandma's recipe book, open on a wooden stand. */
function recipeBook(ctx: Ctx) {
  fill(ctx, '2', 7, 9, 2, 6);
  fill(ctx, '2', 4, 14, 8, 2);
  fill(ctx, 'k', 1, 2, 14, 8);
  fill(ctx, 'B', 1, 2, 14, 8);
  fill(ctx, '8', 2, 3, 6, 6);
  fill(ctx, '7', 8, 3, 6, 6);
  for (const y of [4, 6]) {
    fill(ctx, 'X', 3, y, 4, 1);
    fill(ctx, 'X', 9, y, 4, 1);
  }
  fill(ctx, 'o', 11, 1, 1, 9);
}

/** Copper pans hanging on the kitchen wall. */
function pans(ctx: Ctx) {
  wallFace(ctx);
  fill(ctx, '2', 1, 1, 14, 1);
  for (const [x, w] of [[2, 5], [9, 6]]) {
    fill(ctx, 'x', x + Math.floor(w / 2), 2, 1, 2);
    fill(ctx, 'k', x, 4, w, w - 1);
    fill(ctx, 'O', x + 1, 4, w - 2, w - 2);
    fill(ctx, 'y', x + 1, 4, 1, 1);
  }
}

/** Books on a wall shelf in the back office. */
function bookshelf(ctx: Ctx) {
  wallFace(ctx);
  fill(ctx, '2', 1, 0, 14, 10);
  for (const y of [1, 5]) {
    const colours = ['B', 'G', 'y', 'N', 'o', 'l', '8'] as const;
    colours.forEach((c, i) => fill(ctx, c, 2 + i * 2, y, 2, 3));
    fill(ctx, '3', 1, y + 3, 14, 1);
  }
}

/** A wooden filing cabinet with three drawers. */
function filingCabinet(ctx: Ctx) {
  fill(ctx, 'k', 2, 0, 12, 16);
  fill(ctx, '4', 3, 0, 10, 15);
  for (const y of [1, 6, 11]) {
    fill(ctx, '3', 3, y + 3, 10, 1);
    fill(ctx, 'Y', 7, y + 1, 2, 1);
  }
}

/** A wooden desk with papers. */
function desk(ctx: Ctx) {
  fill(ctx, '2', 0, 2, 16, 13);
  fill(ctx, '4', 0, 2, 16, 9);
  fill(ctx, '3', 0, 10, 16, 1);
  fill(ctx, '8', 3, 4, 5, 4);
  fill(ctx, 'X', 4, 5, 3, 1);
  fill(ctx, '2', 1, 13, 2, 3);
  fill(ctx, '2', 13, 13, 2, 3);
}

/** Grandma's old computer on the desk: a cream monitor with a green screen. */
function computer(ctx: Ctx) {
  desk(ctx);
  fill(ctx, 'k', 2, 0, 12, 9);
  fill(ctx, '7', 3, 0, 10, 8);
  fill(ctx, 'g', 4, 1, 8, 5);
  fill(ctx, 'L', 5, 2, 4, 1);
  fill(ctx, 'l', 5, 4, 6, 1);
  fill(ctx, 'X', 4, 9, 8, 2);
  fill(ctx, 'z', 5, 9, 6, 1);
}

/** Storeroom shelves on the wall, with jars and sacks. */
function storeShelf(ctx: Ctx) {
  wallFace(ctx);
  fill(ctx, '3', 0, 4, 16, 1);
  fill(ctx, '3', 0, 9, 16, 1);
  fill(ctx, 'y', 2, 1, 3, 3);
  fill(ctx, '8', 7, 1, 3, 3);
  fill(ctx, 'O', 11, 2, 3, 2);
  fill(ctx, '6', 1, 6, 5, 3);
  fill(ctx, '6', 9, 6, 5, 3);
  fill(ctx, '5', 2, 6, 3, 1);
}

/** A wooden crate. */
function crate(ctx: Ctx) {
  fill(ctx, 'k', 1, 2, 14, 13);
  fill(ctx, '4', 2, 3, 12, 11);
  fill(ctx, '3', 2, 6, 12, 1);
  fill(ctx, '3', 2, 10, 12, 1);
  fill(ctx, '5', 2, 3, 12, 1);
  fill(ctx, '2', 3, 4, 1, 9);
  fill(ctx, '2', 12, 4, 1, 9);
}

/** A crate of milk bottles: mostly empty in October. */
function milkCrate(ctx: Ctx) {
  fill(ctx, 'k', 1, 4, 14, 11);
  fill(ctx, 'N', 2, 5, 12, 9);
  fill(ctx, 'c', 2, 5, 12, 2);
  fill(ctx, '8', 3, 1, 3, 5);
  fill(ctx, 'B', 3, 1, 3, 1);
  fill(ctx, 'n', 7, 4, 3, 2);
  fill(ctx, 'n', 11, 4, 2, 2);
}

/** A sack of flour. */
function sack(ctx: Ctx) {
  fill(ctx, 'k', 3, 2, 10, 13);
  fill(ctx, '6', 4, 3, 8, 11);
  fill(ctx, '7', 5, 4, 4, 6);
  fill(ctx, '3', 6, 1, 4, 2);
  fill(ctx, 'o', 6, 8, 4, 2);
}

/** The stock ledger, open on a stand: a green book. */
function ledger(ctx: Ctx) {
  fill(ctx, '2', 7, 9, 2, 6);
  fill(ctx, '2', 4, 14, 8, 2);
  fill(ctx, 'k', 1, 2, 14, 8);
  fill(ctx, 'G', 1, 2, 14, 8);
  fill(ctx, '8', 2, 3, 6, 6);
  fill(ctx, '7', 8, 3, 6, 6);
  for (const y of [4, 5, 6, 7]) {
    fill(ctx, 'X', 3, y, 4, 1);
    fill(ctx, 'X', 9, y, 3, 1);
  }
  fill(ctx, 'o', 12, 1, 1, 9);
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
  [TILE.doorway]: doorway,
  [TILE.doorLocked]: doorLocked,
  [TILE.kitchenFloor]: kitchenFloor,
  [TILE.stove]: stove,
  [TILE.sink]: sink,
  [TILE.fridge]: fridge,
  [TILE.workTable]: workTable,
  [TILE.recipeBook]: recipeBook,
  [TILE.pans]: pans,
  [TILE.bookshelf]: bookshelf,
  [TILE.filingCabinet]: filingCabinet,
  [TILE.desk]: desk,
  [TILE.computer]: computer,
  [TILE.storeShelf]: storeShelf,
  [TILE.crate]: crate,
  [TILE.milkCrate]: milkCrate,
  [TILE.sack]: sack,
  [TILE.ledger]: ledger,
};

/** How many tiles have a drawing (must equal TILE_COUNT; a test checks it). */
export const TILE_DRAWN = Object.keys(TILES).length;

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
