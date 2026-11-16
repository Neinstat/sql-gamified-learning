import { describe, expect, it } from 'vitest';
import { PALETTE } from '../art/palette';
import { LOOKS, paintCustomerSheet, paintPlayerSheet, CUSTOMER_FRAMES, CUSTOMER_H, CUSTOMER_W, PLAYER_FRAMES, PLAYER_H, PLAYER_W } from './customerArt';
import { CLOCK, OUTSIDE_W, paintClock, paintInterior, paintOutside, TRUCK_H, TRUCK_LAYOUT, truckZoom, WORLD_W } from './truckArt';
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

const palette = new Set<string>(Object.values(PALETTE));

function expectInside(rects: ReturnType<typeof recorder>['rects'], w: number, h: number) {
  expect(rects.length).toBeGreaterThan(20);
  for (const r of rects) {
    expect(palette.has(r.colour), r.colour).toBe(true);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
    expect(r.x + r.w).toBeLessThanOrEqual(w);
    expect(r.y + r.h).toBeLessThanOrEqual(h);
  }
}

describe('truck art', () => {
  it('draws the interior and clock in palette colours inside the world', () => {
    const { ctx, rects } = recorder();
    paintInterior(ctx);
    paintClock(ctx, 10, 0);
    expectInside(rects, WORLD_W, TRUCK_H);
  });

  it('draws the street in palette colours inside its layer', () => {
    const { ctx, rects } = recorder();
    paintOutside(ctx);
    expectInside(rects, OUTSIDE_W, TRUCK_H);
  });

  it('lines things up along the back wall without overlaps, from fridge to door', () => {
    const L = TRUCK_LAYOUT;
    const order = [L.fridge, L.window, L.prepCounter, L.recipeShelf, L.door];
    for (let i = 1; i < order.length; i++) expect(order[i - 1].x + order[i - 1].w).toBeLessThan(order[i].x);
    expect(L.door.x + L.door.w).toBeLessThan(WORLD_W - 16);
    expect(L.menuBoard.x + L.menuBoard.w).toBeLessThan(L.recipeShelf.x);
    expect(CLOCK.cy + CLOCK.r).toBeLessThan(L.coffeeMachine.y);
    // The tablet sits on the window sill.
    expect(L.tablet.y + L.tablet.h).toBe(L.window.y + L.window.h);
  });
});

describe('characters', () => {
  it.each(Object.keys(LOOKS) as CustomerLook[])('customer %s fits its frames in palette colours', (look) => {
    const { ctx, rects } = recorder();
    paintCustomerSheet(ctx, look);
    expectInside(rects, CUSTOMER_W * CUSTOMER_FRAMES, CUSTOMER_H);
    // No frame spills into the next one.
    for (const r of rects) expect(Math.floor(r.x / CUSTOMER_W)).toBe(Math.floor((r.x + r.w - 1) / CUSTOMER_W));
  });

  it('the player fits its frames in palette colours', () => {
    const { ctx, rects } = recorder();
    paintPlayerSheet(ctx);
    expectInside(rects, PLAYER_W * PLAYER_FRAMES, PLAYER_H);
    for (const r of rects) expect(Math.floor(r.x / PLAYER_W)).toBe(Math.floor((r.x + r.w - 1) / PLAYER_W));
  });

  it('is big: the player is about a third of the screen tall', () => {
    expect(PLAYER_H / TRUCK_H).toBeGreaterThan(0.3);
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
