import { describe, expect, it } from 'vitest';
import { BLOCKING_TILES, CAFE_MAP, NPCS, PLAYER_START, STATION_SPOTS, TILE, TILE_COUNT, findTiles, furnitureLayer, groundLayer, walkableGrid } from './cafe';

describe('café map', () => {
  it('has rows of equal width', () => {
    const widths = new Set(CAFE_MAP.map((row) => row.length));
    expect(widths.size).toBe(1);
  });

  it('only uses known characters', () => {
    const known = new Set('#fwSKPdCRThpM.');
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
