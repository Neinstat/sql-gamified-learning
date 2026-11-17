/**
 * The only connection between the food truck (Three.js) and the HTML overlays (React).
 * Plain TypeScript: neither side's library is imported here.
 *
 *   game → app   'front'   the customer now at the window (their order), or null
 *   game → app   'anchor'  where that customer's head is on screen (0–1 from the top left), or
 *                          null when it is behind the player or off screen (for the speech bubble)
 *   game → app   'hover'   the thing under the crosshair (to show its name), or null
 *   game → app   'use'     the player used something (E, or a click while looking around)
 *   game → app   'locked'  the mouse is captured for looking around (pointer lock)
 *   app → game   'serve'   the front customer has been served and walks away
 *   app → game   'pause'   an overlay is open (true): time stops and the player can't move
 */
import type { InteractableId } from './world';

export type FrontCustomer = { orderId: string };

type TruckEvents = {
  front: FrontCustomer | null;
  anchor: { x: number; y: number } | null;
  hover: InteractableId | null;
  use: InteractableId;
  locked: boolean;
  serve: true;
  pause: boolean;
};

type Listener<T> = (payload: T) => void;

/** A tiny typed event emitter. */
export class Emitter<Events extends Record<string, unknown>> {
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

export class TruckBridge extends Emitter<TruckEvents> {}
