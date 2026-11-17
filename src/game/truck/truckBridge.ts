/**
 * Connects the food truck scene (Phaser) with the React overlays. Plain TypeScript.
 *
 *   game → app   'front'      the customer now at the window (their order and the top of their
 *                             head in world pixels), or null when nobody is ordering
 *   game → app   'view'       the camera moved: world x of the screen's left edge
 *   game → app   'panel'      the side of the truck the player now faces (index into PANELS)
 *   game → app   'hover'      the thing under the cursor (to show its name), or null
 *   game → app   'use'        the player used something in the truck (clicked it, or E)
 *   app → game   'look'       turn to the side on the left (−1) or right (+1)
 *   app → game   'serve'      the front customer has been served and walks away
 *   app → game   'pause'      an overlay is open (true): time stops and the player can't move
 *   app → game   'artLabels'  show "PLACEHOLDER" labels on art that is not final (docs/ASSETS.md)
 *
 * 3D prototype only (game/truck3d):
 *   game → app   'anchor'     where the front customer's head is on screen (0–1 from the top
 *                             left), or null when it is behind the player or off screen
 *   game → app   'locked'     the mouse is captured for looking around (pointer lock)
 */
import { Emitter } from '../bridge';
import type { InteractableId } from './truckWorld';

export type FrontCustomer = { orderId: string; x: number; y: number };

type TruckEvents = {
  front: FrontCustomer | null;
  view: number;
  panel: number;
  hover: InteractableId | null;
  use: InteractableId;
  look: -1 | 1;
  serve: true;
  pause: boolean;
  artLabels: boolean;
  anchor: { x: number; y: number } | null;
  locked: boolean;
};

export class TruckBridge extends Emitter<TruckEvents> {}
