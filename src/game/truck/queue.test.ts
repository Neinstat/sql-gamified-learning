import { describe, expect, it } from 'vitest';
import { PROTOTYPE_ORDERS } from '../../sql-core/truck/orders';
import { QUEUE, spotX, TruckQueue } from './queue';

const settle = (q: TruckQueue, seconds = 20) => {
  for (let i = 0; i < seconds * 10; i++) q.update(0.1);
};

/** Lets each customer in as soon as there is room, like the scene does. */
const joinAll = (q: TruckQueue, ids: string[]) => {
  for (const id of ids) {
    while (!q.canJoin()) q.update(0.1);
    q.join(id);
  }
};

describe('TruckQueue', () => {
  it('walks a new customer to the window, where they can order', () => {
    const q = new TruckQueue();
    q.join('a');
    expect(q.front()).toBeNull();
    settle(q);
    expect(q.front()?.orderId).toBe('a');
    expect(q.front()?.x).toBe(spotX(0));
  });

  it('lines people up behind each other without overlapping', () => {
    const q = new TruckQueue();
    joinAll(q, ['a', 'b', 'c']);
    for (let i = 0; i < 200; i++) {
      q.update(0.1);
      for (let s = 1; s < q.line.length; s++) {
        expect(q.line[s - 1].x - q.line[s].x).toBeGreaterThanOrEqual(QUEUE.gap - 0.001);
      }
    }
    expect(q.line.map((c) => c.x)).toEqual([spotX(0), spotX(1), spotX(2)]);
    expect(q.line.every((c) => c.state === 'waiting')).toBe(true);
  });

  it('lets everyone step forward after the front customer is served', () => {
    const q = new TruckQueue();
    joinAll(q, ['a', 'b', 'c']);
    settle(q);
    expect(q.serveFront()?.orderId).toBe('a');
    expect(q.front()).toBeNull();
    settle(q);
    expect(q.front()?.orderId).toBe('b');
    expect(q.line.map((c) => c.x)).toEqual([spotX(0), spotX(1)]);
  });

  it('walks served customers out of sight and reports them once', () => {
    const q = new TruckQueue();
    q.join('a');
    settle(q);
    q.serveFront();
    const gone: string[] = [];
    for (let i = 0; i < 200; i++) gone.push(...q.update(0.1).map((c) => c.orderId));
    expect(gone).toEqual(['a']);
    expect(q.leaving).toEqual([]);
  });

  it('keeps the line short', () => {
    const q = new TruckQueue();
    joinAll(q, Array.from({ length: QUEUE.maxWaiting }, (_, i) => `c${i}`));
    settle(q);
    expect(q.join('extra')).toBeNull();
  });

  it('does not let two people appear on top of each other', () => {
    const q = new TruckQueue();
    q.join('a');
    expect(q.join('b')).toBeNull();
  });

  it('cannot serve someone who has not reached the window', () => {
    const q = new TruckQueue();
    q.join('a');
    expect(q.serveFront()).toBeNull();
  });

});

describe('giving up', () => {
  it('lets anyone in the line leave, walking back, and the others close the gap', () => {
    const q = new TruckQueue();
    for (const id of ['a', 'b', 'c']) {
      while (!q.canJoin()) q.update(0.1);
      q.join(id);
    }
    for (let i = 0; i < 200; i++) q.update(0.1);
    const middle = q.line[1];
    q.giveUp(middle);
    expect(q.line.map((c) => c.orderId)).toEqual(['a', 'c']);
    const gone: string[] = [];
    let lowest = middle.x;
    for (let i = 0; i < 200; i++) {
      gone.push(...q.update(0.1).map((c) => c.orderId));
      lowest = Math.min(lowest, middle.x);
    }
    expect(gone).toEqual(['b']);
    expect(lowest).toBe(QUEUE.enterX);
    expect(q.line.map((c) => c.x)).toEqual([spotX(0), spotX(1)]);
  });
});

describe('the prototype day', () => {
  it('never puts two people who look the same in the queue at once', () => {
    for (let i = 0; i + QUEUE.maxWaiting <= PROTOTYPE_ORDERS.length; i++) {
      const looks = PROTOTYPE_ORDERS.slice(i, i + QUEUE.maxWaiting).map((o) => o.look);
      expect(new Set(looks).size, looks.join(', ')).toBe(looks.length);
    }
  });
});
