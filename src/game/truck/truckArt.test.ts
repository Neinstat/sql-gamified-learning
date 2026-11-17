import { describe, expect, it } from 'vitest';
import { RISO } from '../art/riso';
import { CUSTOMER_FRAMES, CUSTOMER_SIZES, LOOKS, paintCustomerSheet, type Distance } from './customerArt';
import {
  CLOCK,
  OUTSIDE_PARALLAX,
  OUTSIDE_W,
  OUTSIDE_X,
  paintClock,
  paintInterior,
  paintPark,
  PANEL_W,
  PANELS,
  START_PANEL,
  TRUCK_H,
  TRUCK_LAYOUT,
  TRUCK_W,
  truckZoom,
  WORLD_W,
} from './truckArt';
import type { CustomerLook } from '../../sql-core/truck/orders';

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

const inks = new Set<string>(Object.values(RISO));

/** Checks every rectangle at once (dithered art draws tens of thousands of dots). */
function expectInside(rects: ReturnType<typeof recorder>['rects'], w: number, h: number) {
  expect(rects.length).toBeGreaterThan(20);
  const wrongInk = rects.filter((r) => !inks.has(r.colour)).map((r) => r.colour);
  const outside = rects.filter((r) => r.x < 0 || r.y < 0 || r.x + r.w > w || r.y + r.h > h);
  expect(wrongInk).toEqual([]);
  expect(outside).toEqual([]);
}

describe('riso palette', () => {
  it('is a small set of distinct inks', () => {
    const colours = Object.values(RISO);
    expect(colours.length).toBeLessThanOrEqual(26);
    expect(new Set(colours).size).toBe(colours.length);
  });
});

describe('truck art', () => {
  it('draws all four sides and the clock in riso inks, inside the world', () => {
    const { ctx, rects } = recorder();
    paintInterior(ctx);
    paintClock(ctx, 10, 0);
    expectInside(rects, WORLD_W, TRUCK_H);
  });

  it('draws the park in riso inks, inside its layer', () => {
    const { ctx, rects } = recorder();
    paintPark(ctx);
    expectInside(rects, OUTSIDE_W, TRUCK_H);
  });

  it('keeps every thing on its own side of the truck', () => {
    const L = TRUCK_LAYOUT;
    const sides: [keyof typeof L, number][] = [
      ['fridge', 0], ['stockShelves', 0], ['window', 1], ['tablet', 1],
      ['coffeeMachine', 2], ['menuBoard', 2], ['recipeShelf', 2], ['door', 3],
    ];
    for (const [name, side] of sides) {
      const b = L[name] as { x: number; w: number };
      expect(b.x, name).toBeGreaterThanOrEqual(side * PANEL_W);
      expect(b.x + b.w, name).toBeLessThanOrEqual((side + 1) * PANEL_W);
    }
    expect(CLOCK.cx).toBeGreaterThan(2 * PANEL_W);
    expect(WORLD_W).toBe(PANELS.length * PANEL_W);
  });

  it('keeps the park covering the window while turning to the next side', () => {
    const { window: w } = TRUCK_LAYOUT;
    // Halfway through a turn either way, the visible part of the window still shows park.
    for (const scroll of [START_PANEL * PANEL_W, (START_PANEL - 0.5) * PANEL_W, (START_PANEL + 0.5) * PANEL_W]) {
      const parkLeft = OUTSIDE_X - scroll * OUTSIDE_PARALLAX;
      const winLeft = Math.max(0, w.x - scroll);
      const winRight = Math.min(TRUCK_W, w.x + w.w - scroll);
      if (winRight <= winLeft) continue;
      expect(parkLeft).toBeLessThanOrEqual(winLeft);
      expect(parkLeft + OUTSIDE_W).toBeGreaterThanOrEqual(winRight);
    }
  });
});

describe('customers', () => {
  const looks = Object.keys(LOOKS) as CustomerLook[];
  const distances: Distance[] = ['near', 'mid', 'far'];
  it.each(looks.flatMap((l) => distances.map((d) => [l, d] as const)))('%s at %s fits its frames in riso inks', (look, distance) => {
    const { w, h } = CUSTOMER_SIZES[distance];
    const { ctx, rects } = recorder();
    paintCustomerSheet(ctx, look, distance);
    expectInside(rects, w * CUSTOMER_FRAMES, h);
    expect(rects.filter((r) => Math.floor(r.x / w) !== Math.floor((r.x + r.w - 1) / w))).toEqual([]);
  });

  it('are bigger the closer they are', () => {
    expect(CUSTOMER_SIZES.near.h).toBeGreaterThan(CUSTOMER_SIZES.mid.h);
    expect(CUSTOMER_SIZES.mid.h).toBeGreaterThan(CUSTOMER_SIZES.far.h);
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
