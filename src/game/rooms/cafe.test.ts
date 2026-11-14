import { describe, expect, it } from 'vitest';
import { findPath } from '../pathfinding';
import {
  BLOCKING_TILES,
  CAFE_MAP,
  NPCS,
  PLAYER_START,
  ROOMS,
  STATION_SPOTS,
  TILE,
  TILE_COUNT,
  doorToward,
  lockedDoors,
  openRooms,
  roomAt,
  UPGRADE_LAYOUT,
  upgradePlacements,
  findTiles, furnitureLayer, groundLayer, walkableGrid } from './cafe';

describe('café map', () => {
  it('has rows of equal width', () => {
    const widths = new Set(CAFE_MAP.map((row) => row.length));
    expect(widths.size).toBe(1);
  });

  it('only uses known characters', () => {
    const known = new Set('#fwSKPdCRThpM.,123HVIFWQBJDZUxmnL');
    for (const row of CAFE_MAP) for (const ch of row) expect(known.has(ch), `unknown "${ch}"`).toBe(true);
  });

  it('is closed by walls except for the door', () => {
    const last = CAFE_MAP.length - 1;
    const width = CAFE_MAP[0].length;
    expect(CAFE_MAP[0]).toBe('#'.repeat(width));
    for (const row of CAFE_MAP) expect(row[0] + row[width - 1]).toBe('##');
    expect([...CAFE_MAP[last]].filter((ch) => ch !== '#').join('')).toBe('dd');
  });

  it('has one menu board and one cash register', () => {
    expect(findTiles('M')).toHaveLength(1);
    expect(findTiles('R')).toHaveLength(1);
  });

  it('turns each chair towards its table', () => {
    const furniture = furnitureLayer();
    CAFE_MAP.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch !== 'h') return;
        expect(furniture[y][x]).toBe(row[x - 1] === 'T' ? TILE.chairFlipped : TILE.chair);
      }),
    );
  });

  it('builds layers that only use tiles from the tileset', () => {
    for (const layer of [groundLayer(), furnitureLayer()]) {
      for (const index of layer.flat()) expect(index).toBeLessThan(TILE_COUNT);
    }
  });
});

describe('player start', () => {
  it('is on a walkable floor tile', () => {
    const x = Math.floor(PLAYER_START.x);
    const y = Math.floor(PLAYER_START.y);
    expect(BLOCKING_TILES).not.toContain(groundLayer()[y][x]);
    expect(furnitureLayer()[y][x]).toBe(-1);
  });
});

describe('NPCs', () => {
  it('stand on floor, block their own tile, and can be walked up to', () => {
    const walkable = walkableGrid();
    for (const { tile } of NPCS) {
      expect(furnitureLayer()[tile.y][tile.x]).toBe(-1);
      expect(walkable[tile.y][tile.x]).toBe(false);
      const neighbours = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => walkable[tile.y + dy][tile.x + dx]);
      expect(neighbours.length).toBeGreaterThan(0);
    }
  });
});

describe('stations', () => {
  it('each sit on exactly one tile that the player can stand next to', () => {
    const walkable = walkableGrid();
    for (const { mapChar } of STATION_SPOTS) {
      const tiles = findTiles(mapChar);
      expect(tiles).toHaveLength(1);
      const [{ x, y }] = tiles;
      expect([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => walkable[y + dy][x + dx])).toBe(true);
    }
  });
});

describe('rooms', () => {
  it('are separated by walls, with exactly one doorway between neighbours', () => {
    for (const room of ROOMS) {
      for (const wallX of [room.left, room.right]) {
        const column = CAFE_MAP.map((row) => row[wallX]);
        const gaps = column.filter((ch) => ch !== '#');
        const isOuter = wallX === 0 || wallX === CAFE_MAP[0].length - 1;
        expect(gaps.length, `wall at x=${wallX}`).toBe(isOuter ? 0 : 1);
        if (!isOuter) expect('123').toContain(gaps[0]);
      }
    }
  });

  it('puts the NPCs, the player start and the first stations in the front room', () => {
    for (const npc of NPCS) expect(roomAt(npc.tile.x)).toBe(npc.id === 'supplier' ? 'storeroom' : 'front');
    expect(roomAt(PLAYER_START.x)).toBe('front');
    expect(roomAt(findTiles('M')[0].x)).toBe('front');
    expect(roomAt(findTiles('R')[0].x)).toBe('front');
    expect(roomAt(findTiles('Q')[0].x)).toBe('kitchen');
    expect(roomAt(findTiles('L')[0].x)).toBe('storeroom');
    expect(roomAt(findTiles('Z')[0].x)).toBe('back-office');
  });

  it('open chapter by chapter, and locked doors block the way', () => {
    expect(openRooms(3)).toEqual(['front']);
    expect(openRooms(4)).toEqual(['front', 'kitchen']);
    expect(openRooms(5)).toEqual(['back-office', 'front', 'kitchen', 'storeroom']);
    const book = findTiles('Q')[0];
    const goal = { x: book.x, y: book.y + 1 };
    const reaches = (locked: string[]) =>
      findPath(walkableGrid(CAFE_MAP, locked), { x: PLAYER_START.x, y: PLAYER_START.y }, goal).at(-1);
    expect(reaches(lockedDoors(openRooms(3)))).not.toEqual(goal);
    expect(reaches(lockedDoors(openRooms(4)))).toEqual(goal);
  });

  it('points to the right doorway when the goal is in another room', () => {
    expect(doorToward('front', 'kitchen')).toEqual(findTiles('2')[0]);
    expect(doorToward('front', 'storeroom')).toEqual(findTiles('2')[0]);
    expect(doorToward('storeroom', 'front')).toEqual(findTiles('3')[0]);
    expect(doorToward('front', 'back-office')).toEqual(findTiles('1')[0]);
    expect(doorToward('front', 'front')).toBeNull();
  });
});

describe('café upgrades', () => {
  it('keep every NPC and station reachable from the street door, with everything bought', () => {
    const placements = upgradePlacements(Object.keys(UPGRADE_LAYOUT));
    const walkable = walkableGrid(CAFE_MAP, [], placements);
    const start = { x: PLAYER_START.x, y: PLAYER_START.y };
    const reachableNextTo = (tile: { x: number; y: number }) =>
      [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const goal = { x: tile.x + dx, y: tile.y + dy };
        if (!walkable[goal.y]?.[goal.x]) return false;
        const end = findPath(walkable, start, goal).at(-1) ?? start;
        return end.x === goal.x && end.y === goal.y;
      });
    for (const npc of NPCS) expect(reachableNextTo(npc.tile), npc.id).toBe(true);
    for (const { mapChar } of STATION_SPOTS) expect(reachableNextTo(findTiles(mapChar)[0]), mapChar).toBe(true);
  });

  it('only place things on free front-room floor', () => {
    for (const { x, y } of upgradePlacements(Object.keys(UPGRADE_LAYOUT))) {
      if (x === 15 && y === 9) continue; // the fancy board replaces the menu board
      expect(CAFE_MAP[y][x], `${x},${y}`).toBe('.');
      expect(roomAt(x)).toBe('front');
      expect(NPCS.some((n) => n.tile.x === x && n.tile.y === y)).toBe(false);
    }
  });
});
