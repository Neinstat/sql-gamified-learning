/**
 * Connects the food truck scene (Phaser) with the React overlays. Plain TypeScript.
 *
 *   game → app   'front'      the customer now at the window (their order and the top of their
 *                             head in world pixels), or null when nobody is ordering
 *   game → app   'view'       the camera moved: world x of the screen's left edge
 *   game → app   'use'        the player used something in the truck (E, or clicked it)
 *   app → game   'serve'      the front customer has been served and walks away
 *   app → game   'pause'      an overlay is open (true): time stops and the player can't move
 *   app → game   'artLabels'  show "PLACEHOLDER" labels on art that is not final (docs/ASSETS.md)
 */
import { Emitter } from '../bridge';
import type { InteractableId } from './truckWorld';

export type FrontCustomer = { orderId: string; x: number; y: number };

type TruckEvents = {
  front: FrontCustomer | null;
  view: number;
  use: InteractableId;
  serve: true;
  pause: boolean;
  artLabels: boolean;
};

export class TruckBridge extends Emitter<TruckEvents> {}
