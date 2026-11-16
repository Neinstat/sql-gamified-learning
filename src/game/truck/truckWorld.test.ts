import { describe, expect, it } from 'vitest';
import { TRUCK_LAYOUT, WORLD_W } from './truckArt';
import {
  clampToFloor,
  FLOOR,
  INTERACTABLES,
  moveVector,
  nearestInteractable,
  standingSpot,
  stepTowards,
  USE_RANGE_X,
} from './truckWorld';

describe('the truck floor', () => {
  it('keeps the player inside the truck and in front of the back wall', () => {
    expect(clampToFloor({ x: -50, y: 0 })).toEqual({ x: FLOOR.minX, y: FLOOR.minY });
    expect(clampToFloor({ x: 5000, y: 999 })).toEqual({ x: FLOOR.maxX, y: FLOOR.maxY });
    expect(FLOOR.minY).toBeGreaterThan(TRUCK_LAYOUT.floorTop);
    expect(FLOOR.maxX).toBeLessThan(WORLD_W);
  });

  it('walks diagonally no faster than straight', () => {
    const d = moveVector({ up: true, down: false, left: false, right: true });
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(1);
    expect(moveVector({ up: true, down: true, left: true, right: true })).toEqual({ x: 0, y: 0 });
  });

  it('click-walks towards a target and arrives exactly', () => {
    let at = { x: 100, y: 200 };
    let arrived = false;
    for (let i = 0; i < 100 && !arrived; i++) ({ at, arrived } = stepTowards(at, { x: 160, y: 230 }, 0.05));
    expect(arrived).toBe(true);
    expect(at).toEqual({ x: 160, y: 230 });
  });
});

describe('things in the truck', () => {
  it('can each be reached and used from their standing spot', () => {
    for (const item of INTERACTABLES) expect(nearestInteractable(standingSpot(item))?.id).toBe(item.id);
  });

  it('are far enough apart that only one is in reach at a time', () => {
    const xs = INTERACTABLES.map((i) => i.x).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThan(USE_RANGE_X * 2);
  });

  it('cannot be used from the front of the floor or from far away', () => {
    const tablet = INTERACTABLES.find((i) => i.id === 'tablet')!;
    expect(nearestInteractable({ x: tablet.x, y: FLOOR.maxY })).toBeNull();
    expect(nearestInteractable({ x: tablet.x + USE_RANGE_X + 1, y: FLOOR.minY })).toBeNull();
  });
});
