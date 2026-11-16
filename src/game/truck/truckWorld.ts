/**
 * Walking around the truck (GAME_DESIGN.md §14.8): the floor the player may stand on, the things
 * they can use, and movement. Pure logic in world pixels, tested without Phaser.
 */
import { TRUCK_LAYOUT, WORLD_W } from './truckArt';

/** The floor band the player's feet stay inside (A/D: x, W/S: y). */
export const FLOOR = { minX: 36, maxX: WORLD_W - 36, minY: 184, maxY: 256 } as const;
/** Walking speed in pixels per second. */
export const PLAYER_SPEED = 96;
/** The player can use something when their feet are this close (horizontally)… */
export const USE_RANGE_X = 34;
/** …and no further from the back wall than this. */
export const USE_MAX_Y = 214;

export type InteractableId = 'fridge' | 'tablet' | 'menu-board' | 'recipe-shelf' | 'back-door';

export type Interactable = {
  id: InteractableId;
  /** Where the player stands to use it (world x), and where the "E" prompt floats (y). */
  x: number;
  promptY: number;
};

const centre = (r: { x: number; w: number }) => Math.round(r.x + r.w / 2);

export const INTERACTABLES: readonly Interactable[] = [
  { id: 'fridge', x: centre(TRUCK_LAYOUT.fridge), promptY: TRUCK_LAYOUT.fridge.y - 10 },
  { id: 'tablet', x: centre(TRUCK_LAYOUT.tablet), promptY: TRUCK_LAYOUT.tablet.y - 12 },
  { id: 'menu-board', x: centre(TRUCK_LAYOUT.menuBoard), promptY: TRUCK_LAYOUT.menuBoard.y + TRUCK_LAYOUT.menuBoard.h + 14 },
  { id: 'recipe-shelf', x: centre(TRUCK_LAYOUT.recipeShelf), promptY: TRUCK_LAYOUT.recipeShelf.y - 10 },
  { id: 'back-door', x: centre(TRUCK_LAYOUT.door), promptY: TRUCK_LAYOUT.door.y - 12 },
];

export type Point = { x: number; y: number };

export function clampToFloor(p: Point): Point {
  return {
    x: Math.min(FLOOR.maxX, Math.max(FLOOR.minX, p.x)),
    y: Math.min(FLOOR.maxY, Math.max(FLOOR.minY, p.y)),
  };
}

/** The closest thing the player can use from where they stand, if any. */
export function nearestInteractable(feet: Point): Interactable | null {
  if (feet.y > USE_MAX_Y) return null;
  let best: Interactable | null = null;
  for (const item of INTERACTABLES) {
    const d = Math.abs(item.x - feet.x);
    if (d <= USE_RANGE_X && (!best || d < Math.abs(best.x - feet.x))) best = item;
  }
  return best;
}

/** Keys held this frame → a direction (diagonals are not faster). */
export function moveVector(keys: { up: boolean; down: boolean; left: boolean; right: boolean }): Point {
  const x = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const y = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  const length = Math.hypot(x, y);
  return length === 0 ? { x: 0, y: 0 } : { x: x / length, y: y / length };
}

/** One step towards `target` (click/tap to walk); returns the new position and whether it arrived. */
export function stepTowards(from: Point, target: Point, seconds: number): { at: Point; arrived: boolean } {
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const distance = Math.hypot(dx, dy);
  const step = PLAYER_SPEED * seconds;
  if (distance <= step) return { at: { ...target }, arrived: true };
  return { at: { x: from.x + (dx / distance) * step, y: from.y + (dy / distance) * step }, arrived: false };
}

/** Where to stand to use something: right in front of it, close to the wall. */
export function standingSpot(item: Interactable): Point {
  return clampToFloor({ x: item.x, y: FLOOR.minY + 6 });
}
