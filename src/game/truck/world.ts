/**
 * The food truck world (GAME_DESIGN.md §14.8): sizes in metres, where the
 * player may walk, the things they can use, aiming at them, and the queue path in the park.
 * Pure logic (no Three.js), tested on its own.
 *
 * Axes: x along the truck (left −, right +), y up (truck floor = 0), z towards the back wall (+).
 * The serving window is in the front wall (z = −DEPTH/2) and looks out over the park.
 */
import type { TruckObjectId } from '../../sql-core/truck/objects';
import { QUEUE } from './queue';

/** Things in the truck the player can use (which tables each one sees: sql-core/truck/objects.ts). */
export type InteractableId = TruckObjectId;

export type Vec3 = { x: number; y: number; z: number };
export type Box3 = { min: Vec3; max: Vec3 };

const box = (x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): Box3 => ({
  min: { x: Math.min(x1, x2), y: Math.min(y1, y2), z: Math.min(z1, z2) },
  max: { x: Math.max(x1, x2), y: Math.max(y1, y2), z: Math.max(z1, z2) },
});

/** The inside of the truck. */
export const TRUCK = { length: 6, depth: 2.4, height: 2.4 } as const;
const HX = TRUCK.length / 2;
const HZ = TRUCK.depth / 2;

/** Eye height of the player. */
export const EYE_Y = 1.6;
/** Walking speed (m/s) and how far the player can reach to use something (m). */
export const WALK_SPEED = 2.2;
export const REACH = 1.7;

/** The park ground is lower than the truck floor; customers' heads show in the window. */
export const GROUND_Y = -0.35;

export const LAYOUT = {
  window: box(-1.5, 1.05, -HZ - 0.05, 1.5, 2.05, -HZ + 0.05),
  frontCounter: box(-1.8, 0, -HZ, 1.8, 1.0, -HZ + 0.45),
  tablet: box(0.7, 1.0, -HZ + 0.12, 1.06, 1.26, -HZ + 0.3),
  tipJar: box(-1.3, 1.0, -HZ + 0.15, -1.12, 1.22, -HZ + 0.33),
  fridge: box(-HX, 0, -HZ + 0.05, -HX + 0.75, 2.0, -0.2),
  stockShelves: box(-HX, 0, 0.05, -HX + 0.55, 2.0, HZ),
  backCounter: box(-1.6, 0, HZ - 0.45, 1.8, 0.95, HZ),
  coffeeMachine: box(-1.25, 0.95, HZ - 0.4, -0.6, 1.5, HZ - 0.05),
  menuBoard: box(-0.1, 1.35, HZ - 0.05, 1.0, 2.1, HZ),
  recipeShelf: box(1.15, 1.42, HZ - 0.3, 1.75, 1.78, HZ),
  door: box(HX - 0.05, 0, -0.5, HX, 2.1, 0.5),
} as const;

/** Clock on the back wall, above the coffee machine. */
export const CLOCK3D = { x: -0.92, y: 1.9, z: HZ - 0.02, r: 0.16 } as const;

/** Where the player's eye may go (keeps them off counters and out of walls). */
export const WALK = { minX: -HX + 0.95, maxX: HX - 0.4, minZ: -HZ + 0.7, maxZ: HZ - 0.7 } as const;
/** The player starts in the middle, facing the window. */
export const START = { x: 0, z: 0.1, yaw: 0 } as const;

export const INTERACTABLE_BOXES: readonly { id: InteractableId; box: Box3 }[] = [
  { id: 'tablet', box: LAYOUT.tablet },
  { id: 'fridge', box: LAYOUT.fridge },
  { id: 'fridge', box: LAYOUT.stockShelves },
  { id: 'menu-board', box: LAYOUT.menuBoard },
  { id: 'recipe-shelf', box: LAYOUT.recipeShelf },
  { id: 'back-door', box: LAYOUT.door },
];

export function clampWalk(x: number, z: number): { x: number; z: number } {
  return {
    x: Math.min(WALK.maxX, Math.max(WALK.minX, x)),
    z: Math.min(WALK.maxZ, Math.max(WALK.minZ, z)),
  };
}

/** The direction the eye looks in, from yaw (turning; 0 = towards the window) and pitch (up +). */
export function lookDirection(yaw: number, pitch: number): Vec3 {
  const c = Math.cos(pitch);
  return { x: -Math.sin(yaw) * c, y: Math.sin(pitch), z: -Math.cos(yaw) * c };
}

/**
 * One step of WASD walking: forward/back along the view (ignoring pitch), strafe sideways.
 * Diagonals are not faster.
 */
export function walkStep(
  at: { x: number; z: number },
  yaw: number,
  keys: { forward: boolean; back: boolean; left: boolean; right: boolean },
  seconds: number,
): { x: number; z: number } {
  const f = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0);
  const s = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const length = Math.hypot(f, s);
  if (length === 0) return at;
  const step = (WALK_SPEED * seconds) / length;
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  // Right is the forward direction turned a quarter to the right.
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  return clampWalk(at.x + (fx * f + rx * s) * step, at.z + (fz * f + rz * s) * step);
}

/** Distance along a ray to a box (slab method), or null when it misses. */
export function rayBox(origin: Vec3, dir: Vec3, b: Box3): number | null {
  let tMin = 0;
  let tMax = Infinity;
  for (const axis of ['x', 'y', 'z'] as const) {
    const o = origin[axis];
    const d = dir[axis];
    if (Math.abs(d) < 1e-9) {
      if (o < b.min[axis] || o > b.max[axis]) return null;
      continue;
    }
    let t1 = (b.min[axis] - o) / d;
    let t2 = (b.max[axis] - o) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }
  return tMin;
}

/** The thing under the crosshair, within reach. */
export function aimedInteractable(eye: Vec3, dir: Vec3): InteractableId | null {
  let best: { id: InteractableId; t: number } | null = null;
  for (const { id, box: b } of INTERACTABLE_BOXES) {
    const t = rayBox(eye, dir, b);
    if (t !== null && t <= REACH && (!best || t < best.t)) best = { id, t };
  }
  return best?.id ?? null;
}

// ── The queue in the park ───────────────────────────────────────────────────────────

/** Waypoints on the park ground, in queue progress units (queue.ts). */
export const QUEUE_PATH_3D: readonly { at: number; x: number; z: number }[] = [
  { at: QUEUE.enterX, x: -8, z: -11 },
  { at: QUEUE.frontX - 2 * QUEUE.gap, x: -2.4, z: -4.6 },
  { at: QUEUE.frontX - QUEUE.gap, x: -1.0, z: -2.9 },
  { at: QUEUE.frontX, x: 0.5, z: -HZ - 0.55 },
  { at: QUEUE.exitX, x: 6, z: -4 },
];

/** Where a customer stands, and which way they face (yaw; 0 = looking towards −z). */
export function queuePosition(progress: number): { x: number; z: number; yaw: number } {
  const path = QUEUE_PATH_3D;
  const p = Math.min(path[path.length - 1].at, Math.max(path[0].at, progress));
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (p <= b.at) {
      const t = (p - a.at) / (b.at - a.at);
      // Face the direction of walking (atan2 of the step; 0 = −z).
      const yaw = Math.atan2(-(b.x - a.x), -(b.z - a.z));
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, yaw };
    }
  }
  const last = path[path.length - 1];
  return { x: last.x, z: last.z, yaw: 0 };
}

/** Customers waiting face the truck (towards +z, i.e. yaw π). */
export const FACING_TRUCK = Math.PI;
