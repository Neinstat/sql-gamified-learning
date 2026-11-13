/**
 * The café's front room, drawn as text: one character = one 16×16 tile.
 * Pure data — no Phaser here, so it can be tested on its own.
 *
 *   #  wall          f  wall face      w  window       S  shelf
 *   K  coffee machine                  .  floor        d  door mat
 *   C  counter       R  cash register  T  table        h  chair
 *   p  plant         M  menu board
 */
export const CAFE_MAP = [
  '####################',
  '#ffSKSffffwwffffwwf#',
  '#..................#',
  '#..................#',
  '#CCCCCRCC.....p....#',
  '#..................#',
  '#...........hTh....#',
  '#..hTh.............#',
  '#..........hTh.....#',
  '#....M.............#',
  '#p................p#',
  '#########dd#########',
] as const;

export const TILE_SIZE = 16;

/** Tile index in the tileset texture, in drawing order. */
export const TILE = {
  floor: 0,
  wall: 1,
  wallFace: 2,
  window: 3,
  counter: 4,
  register: 5,
  table: 6,
  chair: 7,
  plant: 8,
  menuBoard: 9,
  shelf: 10,
  coffeeMachine: 11,
  doorMat: 12,
} as const;

export const TILE_COUNT = Object.keys(TILE).length;

/** Ground layer: what is under everything (floor or wall). */
const GROUND: Record<string, number> = {
  '#': TILE.wall,
  f: TILE.wallFace,
  w: TILE.window,
  S: TILE.wallFace,
  K: TILE.wallFace,
  d: TILE.doorMat,
};

/** Furniture layer: objects drawn on top of the ground. */
const FURNITURE: Record<string, number> = {
  C: TILE.counter,
  R: TILE.register,
  T: TILE.table,
  h: TILE.chair,
  p: TILE.plant,
  M: TILE.menuBoard,
  S: TILE.shelf,
  K: TILE.coffeeMachine,
};

/** Tiles the player cannot walk through. Chairs and the door mat are walkable. */
export const BLOCKING_TILES: readonly number[] = [
  TILE.wall,
  TILE.wallFace,
  TILE.window,
  TILE.counter,
  TILE.register,
  TILE.table,
  TILE.plant,
  TILE.menuBoard,
  TILE.shelf,
  TILE.coffeeMachine,
];

/** Where the player appears: just inside the door (tile coordinates, can be fractional). */
export const PLAYER_START = { x: 10, y: 10 };

/** -1 = empty cell (Phaser's convention for "no tile"). */
export function groundLayer(map: readonly string[] = CAFE_MAP): number[][] {
  return map.map((row) => [...row].map((ch) => GROUND[ch] ?? TILE.floor));
}

export function furnitureLayer(map: readonly string[] = CAFE_MAP): number[][] {
  return map.map((row) => [...row].map((ch) => FURNITURE[ch] ?? -1));
}

/** Where a character appears in the map, as tile coordinates. */
export function findTiles(ch: string, map: readonly string[] = CAFE_MAP): { x: number; y: number }[] {
  return map.flatMap((row, y) => [...row].flatMap((c, x) => (c === ch ? [{ x, y }] : [])));
}

/** true where the player can stand: neither the ground nor the furniture blocks it. */
export function walkableGrid(map: readonly string[] = CAFE_MAP): boolean[][] {
  const ground = groundLayer(map);
  const furniture = furnitureLayer(map);
  return ground.map((row, y) =>
    row.map((g, x) => !BLOCKING_TILES.includes(g) && !BLOCKING_TILES.includes(furniture[y][x])),
  );
}
