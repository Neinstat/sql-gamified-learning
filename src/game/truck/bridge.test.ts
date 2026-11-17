import { describe, expect, it } from 'vitest';
import { TruckBridge } from './bridge';

describe('TruckBridge', () => {
  it('delivers events to listeners until they unsubscribe', () => {
    const bridge = new TruckBridge();
    const seen: (string | null)[] = [];
    const off = bridge.on('hover', (id) => seen.push(id));
    bridge.emit('hover', 'tablet');
    off();
    bridge.emit('hover', 'fridge');
    expect(seen).toEqual(['tablet']);
  });

  it('lets a listener unsubscribe while an event is being delivered', () => {
    const bridge = new TruckBridge();
    let calls = 0;
    const off = bridge.on('pause', () => {
      calls++;
      off();
    });
    bridge.on('pause', () => calls++);
    bridge.emit('pause', true);
    bridge.emit('pause', false);
    expect(calls).toBe(3);
  });
});
