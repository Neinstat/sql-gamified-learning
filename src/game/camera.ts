/** Camera rules, kept free of Phaser so they can be tested. */

/** Zoom the player can pick with − / +. Whole numbers keep pixels square and sharp. */
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
/** The automatic zoom never goes below this (pixels stay big and readable). */
const AUTO_MIN_ZOOM = 2;

/**
 * Automatic zoom: if the whole room fits at 2× or more (desktop), show all of it;
 * otherwise (phones) fill the screen and let the camera follow the player.
 */
export function autoZoom(viewW: number, viewH: number, roomW: number, roomH: number): number {
  const fit = Math.floor(Math.min(viewW / roomW, viewH / roomH));
  const fill = Math.floor(Math.max(viewW / roomW, viewH / roomH));
  return clampZoom(fit >= AUTO_MIN_ZOOM ? fit : Math.max(fill, AUTO_MIN_ZOOM));
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom)));
}

type Rect = { x: number; y: number; width: number; height: number };

/**
 * Where to put an arrow pointing at `target` when it is outside the visible `view`
 * (world pixels): on the view's edge, `margin` inside it, with the angle (radians) to
 * the target. null when the target is already visible.
 */
export function edgePointer(
  view: Rect,
  target: { x: number; y: number },
  margin: number,
): { x: number; y: number; angle: number } | null {
  const inside =
    target.x >= view.x && target.x <= view.x + view.width && target.y >= view.y && target.y <= view.y + view.height;
  if (inside) return null;

  const cx = view.x + view.width / 2;
  const cy = view.y + view.height / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;
  // Walk from the centre towards the target until the margin-inset box is reached.
  const halfW = Math.max(view.width / 2 - margin, 0);
  const halfH = Math.max(view.height / 2 - margin, 0);
  const scale = Math.min(dx === 0 ? Infinity : halfW / Math.abs(dx), dy === 0 ? Infinity : halfH / Math.abs(dy));
  return { x: cx + dx * scale, y: cy + dy * scale, angle: Math.atan2(dy, dx) };
}
