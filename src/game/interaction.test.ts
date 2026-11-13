import { describe, expect, it } from 'vitest';
import { nearestInteractable } from './interaction';

const grandma = { id: 'grandma', x: 100, y: 100 };
const board = { id: 'menu-board', x: 140, y: 100 };

describe('nearestInteractable', () => {
  it('finds a target on the next tile, including diagonally', () => {
    expect(nearestInteractable({ x: 116, y: 100 }, [grandma])).toBe(grandma);
    expect(nearestInteractable({ x: 116, y: 116 }, [grandma])).toBe(grandma);
  });

  it('ignores targets two tiles away', () => {
    expect(nearestInteractable({ x: 132, y: 100 }, [grandma])).toBeNull();
  });

  it('picks the closest of several', () => {
    expect(nearestInteractable({ x: 124, y: 100 }, [grandma, board])).toBe(board);
  });
});
