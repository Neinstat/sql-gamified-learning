import { describe, expect, it } from 'vitest';
import { CAFE_MAP, TILE_COUNT, findTiles, furnitureLayer, groundLayer } from './cafe';

describe('café map', () => {
  it('has rows of equal width', () => {
    const widths = new Set(CAFE_MAP.map((row) => row.length));
    expect(widths.size).toBe(1);
  });

  it('only uses known characters', () => {
    const known = new Set('#fwSKdCRThpM.');
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

  it('builds layers that only use tiles from the tileset', () => {
    for (const layer of [groundLayer(), furnitureLayer()]) {
      for (const index of layer.flat()) expect(index).toBeLessThan(TILE_COUNT);
    }
  });
});
