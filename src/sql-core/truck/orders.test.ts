import { describe, expect, it } from 'vitest';
import { isCase } from '../levels';
import { ORDERS_ID } from './locales/id/orders';
import { findOrderLevel } from './levels';
import { orderLine, PROTOTYPE_ORDERS } from './orders';

describe('prototype truck orders', () => {
  it('have unique ids and point at plain requests (not cases), in both languages', () => {
    expect(new Set(PROTOTYPE_ORDERS.map((o) => o.id)).size).toBe(PROTOTYPE_ORDERS.length);
    for (const order of PROTOTYPE_ORDERS) {
      for (const lang of ['en', 'id'] as const) {
        const level = findOrderLevel(order.levelId, lang);
        expect(level, `${order.levelId} (${lang})`).toBeDefined();
        expect(level && isCase(level)).toBe(false);
      }
    }
  });

  it('are translated to Indonesian, with English as the fallback', () => {
    expect(Object.keys(ORDERS_ID).sort()).toEqual(PROTOTYPE_ORDERS.map((o) => o.id).sort());
    const order = PROTOTYPE_ORDERS[0];
    expect(orderLine(order, 'en')).toBe(order.line);
    expect(orderLine({ ...order, id: 'untranslated' }, 'id')).toBe(order.line);
  });
});
