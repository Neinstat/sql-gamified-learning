/**
 * Placing HTML boxes (the order bubble, Data Lens cards) over the 3D view. Pure functions in
 * screen pixels, tested on their own.
 *
 * A box is anchored on a point in the world (a customer's head, an object). It keeps a fixed
 * width — it never squeezes into a narrow column near the edge of the screen — and slides
 * sideways to stay on screen; its tail still points at the anchor.
 */

/** Where a box of `width` goes for an anchor at `anchorX`: its centre, and the tail's offset. */
export function placeOnScreen(anchorX: number, width: number, viewWidth: number, margin = 12): { centre: number; tail: number } {
  const half = width / 2;
  const min = half + margin;
  const max = viewWidth - half - margin;
  // A view narrower than the box: just centre it.
  const centre = min > max ? viewWidth / 2 : Math.min(max, Math.max(min, anchorX));
  // The tail stays inside the box, away from its rounded corners.
  const reach = Math.max(0, half - 18);
  return { centre, tail: Math.min(reach, Math.max(-reach, anchorX - centre)) };
}

export type Placed = { id: string; centre: number; bottom: number; width: number; height: number };

/**
 * Moves boxes up until none overlaps another. `bottom` is the box's lower edge (its anchor); boxes
 * nearer the bottom of the screen stay put, and the others move up out of their way.
 */
export function stackBoxes(boxes: readonly Placed[], gap = 8): Placed[] {
  const placed: Placed[] = [];
  for (const box of [...boxes].sort((a, b) => b.bottom - a.bottom)) {
    let bottom = box.bottom;
    let moved = true;
    while (moved) {
      moved = false;
      for (const other of placed) {
        const overlapsX = Math.abs(box.centre - other.centre) < (box.width + other.width) / 2 + gap;
        const overlapsY = bottom > other.bottom - other.height - gap && bottom - box.height < other.bottom + gap;
        if (overlapsX && overlapsY) {
          bottom = other.bottom - other.height - gap;
          moved = true;
        }
      }
    }
    placed.push({ ...box, bottom });
  }
  return boxes.map((b) => placed.find((p) => p.id === b.id)!);
}
