import { describe, expect, it } from 'vitest';
import { findLevel } from '../levels';
import { ORDERS_ID } from './locales/id/orders';
import { orderLine, PROTOTYPE_ORDERS } from './orders';

describe('prototype truck orders', () => {
  it('have unique ids and point at free-standing levels (not cases)', () => {
    expect(new Set(PROTOTYPE_ORDERS.map((o) => o.id)).size).toBe(PROTOTYPE_ORDERS.length);
    for (const order of PROTOTYPE_ORDERS) {
      const level = findLevel(order.levelId);
      expect(level, order.levelId).toBeDefined();
      expect(level && 'solution' in level).toBe(true);
    }
  });

  it('are translated to Indonesian, with English as the fallback', () => {
    for (const order of PROTOTYPE_ORDERS) expect(ORDERS_ID[order.id], order.id).toBeTruthy();
    expect(Object.keys(ORDERS_ID).sort()).toEqual(PROTOTYPE_ORDERS.map((o) => o.id).sort());
    const order = PROTOTYPE_ORDERS[0];
    expect(orderLine(order, 'en')).toBe(order.line);
    expect(orderLine({ ...order, id: 'untranslated' }, 'id')).toBe(order.line);
  });

  it('use a different customer for every order', () => {
    expect(new Set(PROTOTYPE_ORDERS.map((o) => o.look)).size).toBe(PROTOTYPE_ORDERS.length);
  });
});
