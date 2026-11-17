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
 *   game → app   'clock'   the truck's clock moved on (minutes since midnight, whole minutes)
 *   game → app   'patience' how much patience the customer at the window has left (0–1), or null
 *   game → app   'gaveUp'  a customer waited too long and left without buying (their order id)
 *   game → app   'closed'  the day is over: closing time (or no one left to come) and the line is empty
 *   game → app   'lensKey' the player pressed L (the app decides whether the Data Lens is on)
 *   app → game   'lens'    turn the Data Lens on or off
 *   game → app   'lensCards' where each table's card is on screen while the lens is on (empty
 *                          when it is off): 0–1 from the top left, and how far away it is (m)
 */
import type { InteractableId } from './world';

export type FrontCustomer = { orderId: string };

/** A Data Lens card on screen: its tables, where it is (0–1 from the top left), and its distance. */
export type LensCard = { id: string; tables: string[]; x: number; y: number; distance: number };

type TruckEvents = {
  front: FrontCustomer | null;
  anchor: { x: number; y: number } | null;
  hover: InteractableId | null;
  use: InteractableId;
  locked: boolean;
  serve: true;
  pause: boolean;
  clock: number;
  patience: { orderId: string; left: number } | null;
  gaveUp: string;
  closed: true;
  lensKey: true;
  lens: boolean;
  lensCards: LensCard[];
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
