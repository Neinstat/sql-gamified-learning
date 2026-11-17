import { describe, expect, it } from 'vitest';
import { CUSTOMER_SIZES } from './customerArt';
import { QUEUE, spotX } from './queue';
import { PANEL_W, PANELS, TRUCK_LAYOUT } from './truckArt';
import {
  centreInteractable,
  clampPanel,
  facingPanel,
  INTERACTABLES,
  interactableAt,
  panelScroll,
  queueSpot,
} from './truckWorld';

describe('turning around the truck', () => {
  it('faces one side at a time and stops at the ends', () => {
    expect(clampPanel(-1)).toBe(0);
    expect(clampPanel(PANELS.length)).toBe(PANELS.length - 1);
    expect(panelScroll(2)).toBe(2 * PANEL_W);
    expect(facingPanel(PANEL_W * 1.4)).toBe(1);
    expect(facingPanel(PANEL_W * 1.6)).toBe(2);
  });
});

describe('things in the truck', () => {
  it('can be found under the cursor', () => {
    for (const item of INTERACTABLES) {
      const { x, y, w, h } = item.area;
      expect(interactableAt(x + w / 2, y + h / 2)?.id).toBe(item.id);
    }
    expect(interactableAt(-10, -10)).toBeNull();
  });

  it('do not overlap', () => {
    for (const a of INTERACTABLES) {
      for (const b of INTERACTABLES) {
        if (a === b) continue;
        const apart =
          a.area.x + a.area.w <= b.area.x || b.area.x + b.area.w <= a.area.x ||
          a.area.y + a.area.h <= b.area.y || b.area.y + b.area.h <= a.area.y;
        expect(apart, `${a.id} / ${b.id}`).toBe(true);
      }
    }
  });

  it('E uses something on every side, and the tablet when facing the window', () => {
    PANELS.forEach((_, i) => expect(centreInteractable(i)).not.toBeNull());
    expect(centreInteractable(1)?.id).toBe('tablet');
  });
});

describe('the queue in the park', () => {
  it('puts the front customer at the window, big, with the counter hiding their waist', () => {
    const front = queueSpot(spotX(0));
    const { window: w, counterTop } = TRUCK_LAYOUT;
    expect(front.distance).toBe('near');
    expect(front.x - CUSTOMER_SIZES.near.w / 2).toBeGreaterThanOrEqual(w.x);
    expect(front.x + CUSTOMER_SIZES.near.w / 2).toBeLessThanOrEqual(w.x + w.w);
    expect(front.baseY).toBeGreaterThan(counterTop);
  });

  it('shows people further back smaller, inside the window', () => {
    const { window: w, counterTop } = TRUCK_LAYOUT;
    for (let s = 1; s < QUEUE.maxWaiting; s++) {
      const spot = queueSpot(spotX(s));
      const { w: sw, h: sh } = CUSTOMER_SIZES[spot.distance];
      expect(spot.distance).not.toBe('near');
      expect(spot.x - sw / 2).toBeGreaterThanOrEqual(w.x);
      // Their whole body is above the counter (their feet are on the path).
      expect(spot.baseY).toBeLessThanOrEqual(counterTop);
      expect(spot.baseY - sh).toBeGreaterThanOrEqual(w.y);
    }
  });

  it('hides people arriving and leaving behind the walls', () => {
    const { window: w } = TRUCK_LAYOUT;
    const start = queueSpot(QUEUE.enterX);
    const end = queueSpot(QUEUE.exitX);
    expect(start.x + CUSTOMER_SIZES[start.distance].w / 2).toBeLessThanOrEqual(w.x);
    expect(end.x - CUSTOMER_SIZES[end.distance].w / 2).toBeGreaterThanOrEqual(w.x + w.w);
  });
});
