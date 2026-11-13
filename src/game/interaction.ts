/** Who the player can talk to right now. Pure code, tested on its own. */
export type Interactable = { id: string; x: number; y: number };

/** Talk range in world pixels: the player must stand on a tile touching the target's tile. */
export const INTERACT_RANGE = 24;

/** The closest target within range of `from` (the player's feet), or null. */
export function nearestInteractable<T extends Interactable>(
  from: { x: number; y: number },
  targets: readonly T[],
  range = INTERACT_RANGE,
): T | null {
  let best: T | null = null;
  let bestDistance = range;
  for (const target of targets) {
    const distance = Math.hypot(target.x - from.x, target.y - from.y);
    if (distance <= bestDistance) {
      best = target;
      bestDistance = distance;
    }
  }
  return best;
}
