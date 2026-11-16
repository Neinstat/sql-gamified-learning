/**
 * Connects the food truck scene (Phaser) with the React overlays. Plain TypeScript.
 *
 *   game → app   'front'   the customer now at the window (their order and head position in
 *                          scene pixels), or null when nobody is ordering
 *   app → game   'serve'   the front customer has been served and walks away
 *   game → app   'tablet'  the player clicked the tablet on the counter
 *   app → game   'pause'   the tablet is open (true): time stops and nobody moves
 */
import { Emitter } from '../bridge';

export type FrontCustomer = { orderId: string; x: number; y: number };

type TruckEvents = {
  front: FrontCustomer | null;
  serve: true;
  tablet: true;
  pause: boolean;
};

export class TruckBridge extends Emitter<TruckEvents> {}
