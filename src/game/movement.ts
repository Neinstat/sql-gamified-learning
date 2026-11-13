/** Walking rules, kept free of Phaser so they can be tested. */
export type Facing = 'down' | 'up' | 'left' | 'right';
export type DirectionInput = { up: boolean; down: boolean; left: boolean; right: boolean };

/** Walking speed in world pixels per second (about 4.5 tiles a second). */
export const WALK_SPEED = 72;

/** Direction of travel with length 1 (or 0 when standing), so diagonals are not faster. */
export function moveVector(input: DirectionInput): { x: number; y: number } {
  const x = Number(input.right) - Number(input.left);
  const y = Number(input.down) - Number(input.up);
  const length = Math.hypot(x, y);
  return length === 0 ? { x: 0, y: 0 } : { x: x / length, y: y / length };
}

/**
 * Which way the character looks. While walking diagonally the current facing is kept
 * if it is still one of the two directions, so the sprite does not flicker.
 */
export function facingFor(vector: { x: number; y: number }, current: Facing): Facing {
  const options: Facing[] = [];
  if (vector.x < 0) options.push('left');
  if (vector.x > 0) options.push('right');
  if (vector.y < 0) options.push('up');
  if (vector.y > 0) options.push('down');
  if (options.length === 0 || options.includes(current)) return current;
  return options[0];
}

/**
 * Heading towards a waypoint. `arrived` is true once the next step would reach or pass
 * it, so the walker never overshoots and wobbles, even when frames are slow.
 */
export function steerTowards(
  from: { x: number; y: number },
  to: { x: number; y: number },
  stepLength: number,
): { vector: { x: number; y: number }; arrived: boolean } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= Math.max(stepLength, 0.5)) return { vector: { x: 0, y: 0 }, arrived: true };
  return { vector: { x: dx / distance, y: dy / distance }, arrived: false };
}
