/**
 * The whole café, drawn as text: one character = one 16×16 tile.
 * Four rooms in a row (GAME_DESIGN.md §3): back office | front room | kitchen | storeroom.
 * Pure data — no Phaser here, so it can be tested on its own.
 *
 *   #  wall          f  wall face      w  window       P  painting
 *   .  wood floor    ,  kitchen tiles  d  door mat (street door)
 *   1 2 3  doorways between rooms (locked until the room opens, see ROOMS)
 *   Front room:  S shelf  K coffee machine  C counter  R cash register  T table  h chair  p plant  M menu board
 *   Kitchen:     H pans on the wall  V stove  I sink  F fridge  W work table  Q recipe book
 */
export const CAFE_MAP = [
  '######################################################',
  '#ffPfwwfff#ffSKSffPfwwffPfwwf#ffHffwwffHff#ffffwwffff#',
  '#.........#..................#,,,VVI,,,,FF#..........#',
  '#.........1..................2,,,,,,,,,,,,#..........#',
  '#.........#CCCCCRCC.....p....#,,,,,,,,,,,,#..........#',
  '#.........#..................#,,,WWWW,,,,,#..........#',
  '#.........#...........hTh....#,,,,,,,,,,,,#..........#',
  '#.........#..hTh.............#,,,,,,Q,,,,,#..........#',
  '#.........#..........hTh.....#,,,,,,,,,,,,3..........#',
  '#.........#....M.............#,,,,,,,,,,,,#..........#',
  '#.........#p................p#,,,,,,,,,,,,#..........#',
  '###################dd#################################',
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
  /** A chair on the right of a table, facing it (the chair art mirrored). */
  chairFlipped: 13,
  painting: 14,
  /** An open doorway in a side wall. */
  doorway: 15,
  /** A closed, padlocked door: the room behind it isn't open yet. */
  doorLocked: 16,
  kitchenFloor: 17,
  stove: 18,
  sink: 19,
  fridge: 20,
  workTable: 21,
  recipeBook: 22,
  pans: 23,
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
  P: TILE.painting,
  '1': TILE.doorway,
  '2': TILE.doorway,
  '3': TILE.doorway,
  ',': TILE.kitchenFloor,
  H: TILE.pans,
  V: TILE.kitchenFloor,
  I: TILE.kitchenFloor,
  F: TILE.kitchenFloor,
  W: TILE.kitchenFloor,
  Q: TILE.kitchenFloor,
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
  V: TILE.stove,
  I: TILE.sink,
  F: TILE.fridge,
  W: TILE.workTable,
  Q: TILE.recipeBook,
};

/** Tiles the player cannot walk through. Chairs and the door mat are walkable. */
export const BLOCKING_TILES: readonly number[] = [
  TILE.wall,
  TILE.wallFace,
  TILE.window,
  TILE.painting,
  TILE.counter,
  TILE.register,
  TILE.table,
  TILE.plant,
  TILE.menuBoard,
  TILE.shelf,
  TILE.coffeeMachine,
  TILE.doorLocked,
  TILE.pans,
  TILE.stove,
  TILE.sink,
  TILE.fridge,
  TILE.workTable,
  TILE.recipeBook,
];

/** People standing in the room (tile coordinates). They block the tile they stand on. */
export const NPCS = [
  { id: 'grandma', tile: { x: 21, y: 4 }, facing: 'down' },
  // Behind the counter, by the shelf (clear of the back office door sign).
  { id: 'barista', tile: { x: 16, y: 2 }, facing: 'down' },
  // A regular by the window table.
  { id: 'regular', tile: { x: 26, y: 6 }, facing: 'left' },
] as const;

/** Stations (SQL consoles), placed on furniture tiles. */
export const STATION_SPOTS = [
  { id: 'menu-board', mapChar: 'M' },
  { id: 'cash-register', mapChar: 'R' },
  { id: 'recipe-book', mapChar: 'Q' },
] as const;

/** Where the player appears: just inside the street door (tile coordinates, can be fractional). */
export const PLAYER_START = { x: 20, y: 10 };

export type RoomId = 'back-office' | 'front' | 'kitchen' | 'storeroom';

/**
 * The rooms, west to east. `left`/`right` are the x of their side walls (shared with the
 * neighbour). A room opens with the chapter that first needs it; its doorway (`door`) stays
 * padlocked until then.
 */
export const ROOMS: readonly { id: RoomId; left: number; right: number; opensAtChapter: number; door?: string }[] = [
  { id: 'back-office', left: 0, right: 10, opensAtChapter: 5, door: '1' },
  { id: 'front', left: 10, right: 29, opensAtChapter: 0 },
  { id: 'kitchen', left: 29, right: 42, opensAtChapter: 4, door: '2' },
  { id: 'storeroom', left: 42, right: 53, opensAtChapter: 5, door: '3' },
];

/** The room a tile is in; a doorway in a shared wall belongs to neither (null). */
export function roomAt(tileX: number): RoomId | null {
  return ROOMS.find((r) => tileX > r.left && tileX < r.right)?.id ?? null;
}

/** Rooms open by the time the player reaches `chapter`. */
export function openRooms(chapter: number): RoomId[] {
  return ROOMS.filter((r) => chapter >= r.opensAtChapter).map((r) => r.id);
}

/** The doorway to walk to when heading from one room towards another (rooms are in a row). */
export function doorToward(from: RoomId, to: RoomId): { x: number; y: number } | null {
  const a = ROOMS.findIndex((r) => r.id === from);
  const b = ROOMS.findIndex((r) => r.id === to);
  if (a === b || a < 0 || b < 0) return null;
  const wallX = b > a ? ROOMS[a].right : ROOMS[a].left;
  for (const room of ROOMS) {
    const tile = room.door ? findTiles(room.door)[0] : undefined;
    if (tile?.x === wallX) return tile;
  }
  return null;
}

/** Doorways that are padlocked, as map characters, given the open rooms. */
export function lockedDoors(open: readonly RoomId[]): string[] {
  return ROOMS.filter((r) => r.door && !open.includes(r.id)).map((r) => r.door!);
}

/** -1 = empty cell (Phaser's convention for "no tile"). */
export function groundLayer(map: readonly string[] = CAFE_MAP): number[][] {
  return map.map((row) => [...row].map((ch) => GROUND[ch] ?? TILE.floor));
}

export function furnitureLayer(map: readonly string[] = CAFE_MAP): number[][] {
  return map.map((row) =>
    [...row].map((ch, x) => {
      // Chairs face the table: one with the table on its left is mirrored.
      if (ch === 'h' && row[x - 1] === 'T') return TILE.chairFlipped;
      return FURNITURE[ch] ?? -1;
    }),
  );
}

/** Where a character appears in the map, as tile coordinates. */
export function findTiles(ch: string, map: readonly string[] = CAFE_MAP): { x: number; y: number }[] {
  return map.flatMap((row, y) => [...row].flatMap((c, x) => (c === ch ? [{ x, y }] : [])));
}

/** true where the player can stand: neither the ground nor the furniture blocks it, nor a locked door. */
export function walkableGrid(map: readonly string[] = CAFE_MAP, locked: readonly string[] = []): boolean[][] {
  const ground = groundLayer(map);
  const furniture = furnitureLayer(map);
  return ground.map((row, y) =>
    row.map(
      (g, x) =>
        !BLOCKING_TILES.includes(g) &&
        !BLOCKING_TILES.includes(furniture[y][x]) &&
        !locked.includes(map[y][x]) &&
        !NPCS.some((npc) => npc.tile.x === x && npc.tile.y === y),
    ),
  );
}

/** The room an NPC or station is in (for the café map and the "!" by the door). */
export function roomOfTarget(kind: 'npc' | 'station', id: string): RoomId | null {
  if (kind === 'npc') {
    const npc = NPCS.find((n) => n.id === id);
    return npc ? roomAt(npc.tile.x) : null;
  }
  const spot = STATION_SPOTS.find((s) => s.id === id);
  const tile = spot ? findTiles(spot.mapChar)[0] : undefined;
  return tile ? roomAt(tile.x) : null;
}
