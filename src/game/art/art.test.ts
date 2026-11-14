import { describe, expect, it } from 'vitest';
import { isPaletteKey, PALETTE, TRANSPARENT } from './palette';
import { TILE_GRIDS } from './tiles';
import { GRANDMA_GRIDS, grandmaFrame, grandmaPortraitGrid } from './grandma';
import { BARISTA_GRIDS, baristaFrame, baristaPortraitGrid } from './barista';
import { CHAR_H, CHAR_W, FACINGS, FRAMES_PER_FACING } from '../placeholderSprites';

const onlyPalette = (grid: readonly string[]) =>
  grid.flatMap((row) => [...row]).filter((ch) => ch !== TRANSPARENT && !isPaletteKey(ch));

describe('palette', () => {
  it('stays small (about 32 colours) with valid hex values', () => {
    const colours = Object.values(PALETTE);
    expect(colours.length).toBeLessThanOrEqual(34);
    for (const c of colours) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    expect(new Set(colours).size).toBe(colours.length);
  });
});

describe('tileset', () => {
  it('has a drawing for every tile', async () => {
    const { TILE_DRAWN } = await import('./tiles');
    const { TILE_COUNT } = await import('../rooms/cafe');
    expect(TILE_DRAWN).toBe(TILE_COUNT);
  });
});

describe('tile art', () => {
  it.each(Object.entries(TILE_GRIDS))('%s fits in one 16×16 tile and uses palette colours only', (_name, grid) => {
    expect(grid.length).toBeLessThanOrEqual(16);
    for (const row of grid) expect(row).toHaveLength(16);
    expect(onlyPalette(grid)).toEqual([]);
  });
});

const CHARACTERS = [
  { name: 'Grandma', frame: grandmaFrame, grids: GRANDMA_GRIDS, portrait: grandmaPortraitGrid },
  { name: 'Barista', frame: baristaFrame, grids: BARISTA_GRIDS, portrait: baristaPortraitGrid },
];

describe.each(CHARACTERS)('$name', ({ frame, grids, portrait }) => {
  it('has a full 16×32 frame for every facing and step', () => {
    for (const facing of FACINGS) {
      for (let step = 0; step < FRAMES_PER_FACING; step++) {
        const f = frame(facing, step);
        expect(f).toHaveLength(CHAR_H);
        for (const row of f) expect(row).toHaveLength(CHAR_W);
        expect(onlyPalette(f)).toEqual([]);
      }
    }
  });

  it('only uses palette colours in every grid', () => {
    for (const grid of Object.values(grids)) expect(onlyPalette(grid.flat())).toEqual([]);
  });

  it('has a 64×64 portrait in palette colours', () => {
    const p = portrait();
    expect(p).toHaveLength(64);
    for (const row of p) expect(row).toHaveLength(64);
    expect(onlyPalette(p)).toEqual([]);
  });
});
