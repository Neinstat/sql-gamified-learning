import { describe, expect, it } from 'vitest';
import { RISO } from './riso';

describe('riso inks', () => {
  it('are a small set of distinct colours', () => {
    const colours = Object.values(RISO);
    expect(colours.length).toBeLessThanOrEqual(26);
    expect(new Set(colours).size).toBe(colours.length);
    for (const c of colours) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });
});
