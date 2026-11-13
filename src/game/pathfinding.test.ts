import { describe, expect, it } from 'vitest';
import { findPath, type Tile } from './pathfinding';
import { walkableGrid } from './rooms/cafe';

/** '.' = walkable, '#' = blocked. */
const grid = (rows: string[]) => rows.map((row) => [...row].map((ch) => ch === '.'));
const last = (path: Tile[]) => path[path.length - 1];

describe('findPath', () => {
  it('is empty when already at the target', () => {
    expect(findPath(grid(['...']), { x: 1, y: 0 }, { x: 1, y: 0 })).toEqual([]);
  });

  it('walks straight along a corridor', () => {
    expect(findPath(grid(['....']), { x: 0, y: 0 }, { x: 3, y: 0 })).toEqual([
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
  });

  it('goes around a wall', () => {
    const g = grid(['.#.', '.#.', '...']);
    const path = findPath(g, { x: 0, y: 0 }, { x: 2, y: 0 });
    expect(last(path)).toEqual({ x: 2, y: 0 });
    for (const t of path) expect(g[t.y][t.x]).toBe(true);
  });

  it('never cuts a corner diagonally', () => {
    const g = grid(['.#', '..']);
    const path = findPath(g, { x: 0, y: 0 }, { x: 1, y: 1 });
    expect(path).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ]);
  });

  it('stops next to a blocked target (like a table)', () => {
    // Several tiles touch the table; the one that is quickest to reach wins.
    const path = findPath(grid(['.....', '..#..']), { x: 0, y: 0 }, { x: 2, y: 1 });
    expect(last(path)).toEqual({ x: 1, y: 1 });
  });

  it('gets as close as possible to an unreachable area', () => {
    const path = findPath(grid(['..#.']), { x: 0, y: 0 }, { x: 3, y: 0 });
    expect(last(path)).toEqual({ x: 1, y: 0 });
  });

  it('finds a way behind the café counter', () => {
    // From the door to the cash register's side of the counter.
    const path = findPath(walkableGrid(), { x: 10, y: 10 }, { x: 6, y: 3 });
    expect(last(path)).toEqual({ x: 6, y: 3 });
  });
});
