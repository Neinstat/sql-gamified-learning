/**
 * The only connection between the game world (Phaser) and the HTML overlays (React).
 * Plain TypeScript: neither side's library is imported here.
 *
 *   game → app   'interact'  the player talked to an NPC or used a station (its id)
 *   app → game   'overlay'   an overlay opened (true) or closed (false); the world
 *                            ignores input while one is open
 */
export type InteractTarget = { kind: 'npc' | 'station'; id: string };

type Events = {
  interact: InteractTarget;
  overlay: boolean;
};

type Listener<T> = (payload: T) => void;

export class GameBridge {
  // Typed by on()/emit(); stored loosely inside.
  private listeners = new Map<keyof Events, Set<Listener<never>>>();

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) this.listeners.set(event, (set = new Set()));
    set.add(listener as Listener<never>);
    return () => set.delete(listener as Listener<never>);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    for (const listener of [...(this.listeners.get(event) ?? [])]) (listener as Listener<Events[K]>)(payload);
  }
}
