import { describe, expect, it } from 'vitest';
import { placeOnScreen, stackBoxes, type Placed } from './overlayLayout';

describe('placeOnScreen', () => {
  it('centres the box on its anchor when there is room', () => {
    expect(placeOnScreen(640, 288, 1280)).toEqual({ centre: 640, tail: 0 });
  });

  it('keeps the full width near the right edge, sliding left with the tail still on the anchor', () => {
    // The bug: at 94% across the screen the bubble had squeezed to 76 px wide.
    const anchor = 0.94 * 1280;
    const { centre, tail } = placeOnScreen(anchor, 288, 1280);
    expect(centre + 144).toBeLessThanOrEqual(1280);
    expect(centre + tail).toBeCloseTo(anchor);
  });

  it('does the same at the left edge, and never lets the tail leave the box', () => {
    const { centre, tail } = placeOnScreen(5, 288, 1280);
    expect(centre - 144).toBeGreaterThanOrEqual(0);
    expect(Math.abs(tail)).toBeLessThanOrEqual(144 - 18);
  });

  it('centres the box when the view is narrower than it', () => {
    expect(placeOnScreen(100, 400, 300).centre).toBe(150);
  });
});

describe('stackBoxes', () => {
  const box = (id: string, centre: number, bottom: number): Placed => ({ id, centre, bottom, width: 240, height: 120 });
  const overlap = (a: Placed, b: Placed) =>
    Math.abs(a.centre - b.centre) < (a.width + b.width) / 2 && a.bottom > b.bottom - b.height && a.bottom - a.height < b.bottom;

  it('leaves boxes that do not overlap where they are', () => {
    const boxes = [box('a', 200, 400), box('b', 800, 400)];
    expect(stackBoxes(boxes)).toEqual(boxes);
  });

  it('moves overlapping boxes up until none overlaps, keeping the lowest in place', () => {
    const boxes = [box('tablet', 700, 330), box('customer', 600, 360), box('third', 650, 340)];
    const out = stackBoxes(boxes);
    expect(out.find((b) => b.id === 'customer')!.bottom).toBe(360);
    for (const a of out) for (const b of out) if (a !== b) expect(overlap(a, b), `${a.id}/${b.id}`).toBe(false);
    expect(out.map((b) => b.id)).toEqual(['tablet', 'customer', 'third']);
  });
});
