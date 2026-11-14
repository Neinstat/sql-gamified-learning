/**
 * The only connection between the game world (Phaser) and the HTML overlays (React).
 * Plain TypeScript: neither side's library is imported here.
 *
 *   game → app   'ready'     the world has started: send it the current quest
 *   game → app   'interact'  the player talked to an NPC or used a station (its id)
 *   app → game   'overlay'   an overlay opened (true) or closed (false); the world
 *                            ignores input while one is open
 *   app → game   'quest'     where the player should go next (a "!" is shown there), or null
 *   app → game   'zoom'      zoom in (+1) or out (−1) one step
 *   app → game   'rooms'     which rooms are open (the others stay padlocked)
 *   app → game   'labels'    room names for the signs by the doors, in the player's language
 *   app → game   'upgrades'  café upgrades the player has bought (ids from app/growth.ts)
 *   game → app   'room'      the player walked into another room (for the café map)
 */
export type InteractTarget = { kind: 'npc' | 'station'; id: string };

/** Same ids as ROOMS in rooms/cafe.ts (kept here so the bridge imports nothing). */
export type BridgeRoomId = 'back-office' | 'front' | 'kitchen' | 'storeroom';
export type RoomLabels = { names: Record<BridgeRoomId, string> };

type Events = {
  ready: true;
  interact: InteractTarget;
  overlay: boolean;
  quest: InteractTarget | null;
  zoom: 1 | -1;
  rooms: BridgeRoomId[];
  labels: RoomLabels;
  upgrades: string[];
  room: BridgeRoomId;
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
