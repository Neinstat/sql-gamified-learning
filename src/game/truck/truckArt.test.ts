import { describe, expect, it } from 'vitest';
import { PALETTE } from '../art/palette';
import { paintClock, paintInterior, paintOutside, TRUCK_H, TRUCK_LAYOUT, TRUCK_W, truckZoom } from './truckArt';

/** A fake canvas that records every rectangle drawn. */
function recorder() {
  const rects: { colour: string; x: number; y: number; w: number; h: number }[] = [];
  const ctx = {
    fillStyle: '',
    fillRect(x: number, y: number, w: number, h: number) {
      rects.push({ colour: this.fillStyle, x, y, w, h });
    },
    clearRect() {},
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, rects };
}

const palette = new Set<string>(Object.values(PALETTE));

describe('truck scene art', () => {
  it('uses palette colours only and stays inside the 480×270 canvas', () => {
    const { ctx, rects } = recorder();
    paintOutside(ctx);
    paintInterior(ctx);
    paintClock(ctx, 10, 0);
    expect(rects.length).toBeGreaterThan(100);
    for (const r of rects) {
      expect(palette.has(r.colour)).toBe(true);
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(TRUCK_W);
      expect(r.y + r.h).toBeLessThanOrEqual(TRUCK_H);
    }
  });

  it('keeps the window, door and clock apart', () => {
    const { window: win, door, clock, menuBoard } = TRUCK_LAYOUT;
    expect(win.x + win.w).toBeLessThan(menuBoard.x);
    expect(menuBoard.x + menuBoard.w).toBeLessThan(door.x);
    expect(clock.cy + clock.r).toBeLessThan(menuBoard.y);
    expect(door.x + door.w).toBeLessThanOrEqual(TRUCK_W);
  });
});

describe('truckZoom', () => {
  it('picks the largest whole-number zoom that fits', () => {
    expect(truckZoom(1920, 1080)).toBe(4);
    expect(truckZoom(1440, 900)).toBe(3);
    expect(truckZoom(1000, 600)).toBe(2);
  });

  it('shrinks to fit on small screens', () => {
    expect(truckZoom(375, 667)).toBeCloseTo(375 / 480);
  });
});
