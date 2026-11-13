import { describe, expect, it } from 'vitest';
import { autoZoom, clampZoom, edgePointer } from './camera';

const ROOM = [320, 192] as const;

describe('autoZoom', () => {
  it('shows the whole room on a desktop screen', () => {
    expect(autoZoom(800, 500, ...ROOM)).toBe(2);
    expect(autoZoom(1280, 700, ...ROOM)).toBe(3);
  });

  it('fills a phone screen instead of leaving empty bands', () => {
    expect(autoZoom(375, 717, ...ROOM)).toBe(3);
  });

  it('stays within the allowed range', () => {
    expect(autoZoom(4000, 3000, ...ROOM)).toBe(4);
    expect(autoZoom(200, 200, ...ROOM)).toBe(2);
  });
});

describe('clampZoom', () => {
  it('keeps the zoom a whole number between 1 and 4', () => {
    expect(clampZoom(0)).toBe(1);
    expect(clampZoom(2.4)).toBe(2);
    expect(clampZoom(9)).toBe(4);
  });
});

describe('edgePointer', () => {
  const view = { x: 0, y: 0, width: 100, height: 60 };

  it('is null when the target is on screen', () => {
    expect(edgePointer(view, { x: 50, y: 30 }, 8)).toBeNull();
  });

  it('sits on the edge towards an off-screen target', () => {
    const right = edgePointer(view, { x: 300, y: 30 }, 8)!;
    expect(right.x).toBeCloseTo(92);
    expect(right.y).toBeCloseTo(30);
    expect(right.angle).toBeCloseTo(0);

    const above = edgePointer(view, { x: 50, y: -100 }, 8)!;
    expect(above.y).toBeCloseTo(8);
    expect(above.angle).toBeCloseTo(-Math.PI / 2);
  });

  it('stays inside the view for a diagonal target', () => {
    const p = edgePointer(view, { x: -500, y: 500 }, 8)!;
    expect(p.x).toBeGreaterThanOrEqual(8);
    expect(p.y).toBeLessThanOrEqual(52);
  });
});
