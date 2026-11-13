import { describe, expect, it } from 'vitest';
import { facingFor, moveVector, steerTowards } from './movement';

const none = { up: false, down: false, left: false, right: false };

describe('moveVector', () => {
  it('stands still with no keys or opposite keys', () => {
    expect(moveVector(none)).toEqual({ x: 0, y: 0 });
    expect(moveVector({ ...none, left: true, right: true })).toEqual({ x: 0, y: 0 });
  });

  it('walks straight', () => {
    expect(moveVector({ ...none, up: true })).toEqual({ x: 0, y: -1 });
    expect(moveVector({ ...none, right: true })).toEqual({ x: 1, y: 0 });
  });

  it('is not faster diagonally', () => {
    const v = moveVector({ ...none, down: true, left: true });
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1);
  });
});

describe('facingFor', () => {
  it('keeps facing while standing', () => {
    expect(facingFor({ x: 0, y: 0 }, 'up')).toBe('up');
  });

  it('turns to the walking direction', () => {
    expect(facingFor({ x: -1, y: 0 }, 'down')).toBe('left');
    expect(facingFor({ x: 0, y: 1 }, 'left')).toBe('down');
  });

  it('keeps a facing that is still part of a diagonal', () => {
    expect(facingFor({ x: 0.7, y: -0.7 }, 'up')).toBe('up');
    expect(facingFor({ x: 0.7, y: -0.7 }, 'right')).toBe('right');
    expect(facingFor({ x: 0.7, y: -0.7 }, 'down')).toBe('right');
  });
});

describe('steerTowards', () => {
  it('points at the waypoint with length 1', () => {
    const { vector, arrived } = steerTowards({ x: 0, y: 0 }, { x: 30, y: 40 }, 1.2);
    expect(arrived).toBe(false);
    expect(vector.x).toBeCloseTo(0.6);
    expect(vector.y).toBeCloseTo(0.8);
  });

  it('arrives when the next step would reach the waypoint', () => {
    expect(steerTowards({ x: 0, y: 0 }, { x: 2, y: 0 }, 2.4).arrived).toBe(true);
    expect(steerTowards({ x: 0, y: 0 }, { x: 0, y: 0 }, 0).arrived).toBe(true);
  });
});
