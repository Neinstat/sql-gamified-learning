/**
 * Grid pathfinding for click/tap-to-walk. Pure code (no Phaser), so it is tested on its own.
 * Rooms are tiny (a few hundred tiles), so a full Dijkstra search from the player is cheap
 * and also tells us the nearest reachable tile when the player taps on furniture.
 */
export type Tile = { x: number; y: number };

const STRAIGHT = 1;
const DIAGONAL = Math.SQRT2;
const STEPS = [
  { dx: 1, dy: 0, cost: STRAIGHT },
  { dx: -1, dy: 0, cost: STRAIGHT },
  { dx: 0, dy: 1, cost: STRAIGHT },
  { dx: 0, dy: -1, cost: STRAIGHT },
  { dx: 1, dy: 1, cost: DIAGONAL },
  { dx: 1, dy: -1, cost: DIAGONAL },
  { dx: -1, dy: 1, cost: DIAGONAL },
  { dx: -1, dy: -1, cost: DIAGONAL },
];

/**
 * Tiles from `start` (exclusive) to the goal (inclusive). If `target` cannot be stood on
 * or reached, walks to the reachable tile closest to it instead. Empty when already there.
 * Diagonal steps never cut a corner, so the player never brushes past furniture.
 */
export function findPath(walkable: boolean[][], start: Tile, target: Tile): Tile[] {
  const height = walkable.length;
  const width = walkable[0]?.length ?? 0;
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height;
  const open = (x: number, y: number) => inside(x, y) && walkable[y][x];
  if (!open(start.x, start.y)) return [];

  const key = (x: number, y: number) => y * width + x;
  const dist = new Map<number, number>([[key(start.x, start.y), 0]]);
  const parent = new Map<number, number>();
  const queue: { x: number; y: number; d: number }[] = [{ ...start, d: 0 }];

  while (queue.length > 0) {
    // The grid is small: picking the closest entry by scanning is fast enough and simple.
    let best = 0;
    for (let i = 1; i < queue.length; i++) if (queue[i].d < queue[best].d) best = i;
    const { x, y, d } = queue.splice(best, 1)[0];
    if (d > (dist.get(key(x, y)) ?? Infinity)) continue;

    for (const { dx, dy, cost } of STEPS) {
      const nx = x + dx;
      const ny = y + dy;
      if (!open(nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (!open(x + dx, y) || !open(x, y + dy))) continue;
      const nd = d + cost;
      if (nd < (dist.get(key(nx, ny)) ?? Infinity)) {
        dist.set(key(nx, ny), nd);
        parent.set(key(nx, ny), key(x, y));
        queue.push({ x: nx, y: ny, d: nd });
      }
    }
  }

  // Goal: the target itself if reachable, otherwise the reachable tile nearest to it.
  let goal = key(start.x, start.y);
  let goalScore = [Infinity, Infinity];
  for (const [k, d] of dist) {
    const gx = k % width;
    const gy = Math.floor(k / width);
    const score = [Math.hypot(gx - target.x, gy - target.y), d];
    if (score[0] < goalScore[0] - 1e-9 || (Math.abs(score[0] - goalScore[0]) < 1e-9 && score[1] < goalScore[1])) {
      goal = k;
      goalScore = score;
    }
  }

  const path: Tile[] = [];
  for (let k = goal; k !== key(start.x, start.y); k = parent.get(k)!) {
    path.push({ x: k % width, y: Math.floor(k / width) });
  }
  return path.reverse();
}
