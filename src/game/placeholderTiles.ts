import { TILE, TILE_COUNT, TILE_SIZE } from './rooms/cafe';

/**
 * Placeholder tileset, drawn in code (no image files, no third-party art).
 * Replaced by real pixel art later — see GAME_DESIGN.md §3 "Gaya visual & aset".
 */
const C = {
  floorA: '#c8955f',
  floorB: '#b98552',
  floorLine: '#9c6b3e',
  wall: '#5b4033',
  wallTop: '#6e4f3f',
  face: '#e8d6b9',
  faceShade: '#d4bf9c',
  glass: '#9fd0e0',
  glassShine: '#d9f1f7',
  frame: '#7a5638',
  counter: '#8a5a3b',
  counterTop: '#d9b48a',
  metal: '#6d7a80',
  metalDark: '#3e4a50',
  screen: '#7fd6a4',
  table: '#a56f45',
  tableTop: '#c98b57',
  chair: '#7b4e30',
  pot: '#b7613a',
  leaf: '#5f9b4c',
  leafDark: '#3f7334',
  board: '#2f3b35',
  chalk: '#f2efe6',
  chalkAccent: '#f0c75e',
  shelf: '#7a5638',
  jar: '#e6c07b',
  cup: '#fbf7ef',
  mat: '#a64b3b',
  matLine: '#c4705c',
} as const;

type Draw = (ctx: CanvasRenderingContext2D) => void;

const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

const floor: Draw = (ctx) => {
  rect(ctx, C.floorA, 0, 0, 16, 16);
  rect(ctx, C.floorB, 0, 8, 16, 8);
  rect(ctx, C.floorLine, 0, 7, 16, 1);
  rect(ctx, C.floorLine, 0, 15, 16, 1);
  rect(ctx, C.floorLine, 5, 0, 1, 7);
  rect(ctx, C.floorLine, 11, 8, 1, 7);
};

const TILES: Record<number, Draw> = {
  [TILE.floor]: floor,
  [TILE.wall]: (ctx) => {
    rect(ctx, C.wall, 0, 0, 16, 16);
    rect(ctx, C.wallTop, 1, 1, 14, 14);
  },
  [TILE.wallFace]: (ctx) => {
    rect(ctx, C.face, 0, 0, 16, 16);
    rect(ctx, C.faceShade, 0, 12, 16, 4);
    rect(ctx, C.frame, 0, 11, 16, 1);
  },
  [TILE.window]: (ctx) => {
    TILES[TILE.wallFace](ctx);
    rect(ctx, C.frame, 2, 1, 12, 10);
    rect(ctx, C.glass, 3, 2, 10, 8);
    rect(ctx, C.glassShine, 4, 3, 2, 4);
    rect(ctx, C.frame, 7, 2, 2, 8);
  },
  [TILE.counter]: (ctx) => {
    rect(ctx, C.counter, 0, 3, 16, 13);
    rect(ctx, C.counterTop, 0, 0, 16, 5);
    rect(ctx, C.floorLine, 0, 15, 16, 1);
  },
  [TILE.register]: (ctx) => {
    TILES[TILE.counter](ctx);
    rect(ctx, C.metalDark, 3, 0, 10, 7);
    rect(ctx, C.metal, 4, 1, 8, 5);
    rect(ctx, C.screen, 5, 2, 6, 2);
  },
  [TILE.table]: (ctx) => {
    rect(ctx, C.table, 2, 3, 12, 11);
    rect(ctx, C.tableTop, 2, 3, 12, 8);
    rect(ctx, C.cup, 6, 5, 4, 3);
  },
  [TILE.chair]: (ctx) => {
    rect(ctx, C.chair, 4, 5, 8, 8);
    rect(ctx, C.tableTop, 5, 6, 6, 4);
  },
  [TILE.plant]: (ctx) => {
    rect(ctx, C.pot, 4, 10, 8, 6);
    rect(ctx, C.leafDark, 3, 2, 10, 9);
    rect(ctx, C.leaf, 4, 1, 8, 7);
    rect(ctx, C.leaf, 2, 5, 3, 3);
    rect(ctx, C.leaf, 11, 5, 3, 3);
  },
  [TILE.menuBoard]: (ctx) => {
    rect(ctx, C.frame, 2, 0, 12, 13);
    rect(ctx, C.board, 3, 1, 10, 11);
    rect(ctx, C.chalkAccent, 4, 2, 8, 1);
    rect(ctx, C.chalk, 4, 5, 5, 1);
    rect(ctx, C.chalk, 4, 7, 6, 1);
    rect(ctx, C.chalk, 4, 9, 4, 1);
    rect(ctx, C.frame, 3, 13, 2, 3);
    rect(ctx, C.frame, 11, 13, 2, 3);
  },
  [TILE.shelf]: (ctx) => {
    rect(ctx, C.shelf, 1, 4, 14, 1);
    rect(ctx, C.shelf, 1, 9, 14, 1);
    rect(ctx, C.jar, 2, 1, 3, 3);
    rect(ctx, C.cup, 7, 2, 3, 2);
    rect(ctx, C.jar, 11, 6, 3, 3);
    rect(ctx, C.cup, 3, 7, 3, 2);
  },
  [TILE.coffeeMachine]: (ctx) => {
    rect(ctx, C.metalDark, 2, 1, 12, 10);
    rect(ctx, C.metal, 3, 2, 10, 4);
    rect(ctx, C.screen, 9, 3, 3, 1);
    rect(ctx, C.metalDark, 6, 6, 4, 3);
    rect(ctx, C.cup, 6, 9, 4, 2);
  },
  [TILE.doorMat]: (ctx) => {
    floor(ctx);
    rect(ctx, C.mat, 1, 2, 14, 12);
    rect(ctx, C.matLine, 3, 4, 10, 1);
    rect(ctx, C.matLine, 3, 11, 10, 1);
  },
};

/** Draws every tile side by side into a canvas of TILE_COUNT × 1 tiles. */
export function drawPlaceholderTileset(canvas: HTMLCanvasElement): void {
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
