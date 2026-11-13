import { describe, expect, it } from 'vitest';
import { GameBridge } from './bridge';

describe('GameBridge', () => {
  it('delivers events to listeners until they unsubscribe', () => {
    const bridge = new GameBridge();
    const seen: boolean[] = [];
    const off = bridge.on('overlay', (open) => seen.push(open));
    bridge.emit('overlay', true);
    off();
    bridge.emit('overlay', false);
    expect(seen).toEqual([true]);
  });

  it('keeps events apart', () => {
    const bridge = new GameBridge();
    const talks: string[] = [];
    bridge.on('interact', (t) => talks.push(t.id));
    bridge.emit('overlay', true);
    bridge.emit('interact', { kind: 'npc', id: 'grandma' });
    expect(talks).toEqual(['grandma']);
  });
});
