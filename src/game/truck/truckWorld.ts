/**
 * Looking around the truck in first person (GAME_DESIGN.md §14.8): which side you face, the
 * things you can use on each side, and where queueing customers stand in the park. Pure logic in
 * world pixels, tested without Phaser.
 */
import type { Distance } from './customerArt';
import { QUEUE } from './queue';
import { PANEL_W, PANELS, TRUCK_LAYOUT, type PanelId } from './truckArt';

export type InteractableId = 'fridge' | 'tablet' | 'menu-board' | 'recipe-shelf' | 'back-door';

export type Interactable = {
  id: InteractableId;
  panel: PanelId;
  /** Clickable area in world pixels. */
  area: { x: number; y: number; w: number; h: number };
};

const L = TRUCK_LAYOUT;

export const INTERACTABLES: readonly Interactable[] = [
  { id: 'fridge', panel: 'fridge', area: { x: L.fridge.x, y: L.fridge.y, w: L.stockShelves.x + L.stockShelves.w - L.fridge.x, h: L.fridge.h } },
  { id: 'tablet', panel: 'window', area: L.tablet },
  { id: 'menu-board', panel: 'kitchen', area: L.menuBoard },
  { id: 'recipe-shelf', panel: 'kitchen', area: L.recipeShelf },
  { id: 'back-door', panel: 'door', area: L.door },
];

/** Camera scroll that faces a side. */
export function panelScroll(index: number): number {
  return clampPanel(index) * PANEL_W;
}

export function clampPanel(index: number): number {
  return Math.min(PANELS.length - 1, Math.max(0, index));
}

/** The side whose middle is closest to the screen's middle. */
export function facingPanel(scrollX: number): number {
  return clampPanel(Math.round(scrollX / PANEL_W));
}

export function interactableAt(x: number, y: number): Interactable | null {
  return (
    INTERACTABLES.find(({ area: a }) => x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h) ?? null
  );
}

/** What E uses: the thing on the side you face that is closest to the middle of the screen. */
export function centreInteractable(panelIndex: number): Interactable | null {
  const panel = PANELS[clampPanel(panelIndex)];
  const middle = panelScroll(panelIndex) + PANEL_W / 2;
  let best: Interactable | null = null;
  for (const item of INTERACTABLES) {
    if (item.panel !== panel) continue;
    const d = Math.abs(item.area.x + item.area.w / 2 - middle);
    if (!best || d < Math.abs(best.area.x + best.area.w / 2 - middle)) best = item;
  }
  return best;
}

// ── Where customers stand ────────────────────────────────────────────────────────────

export type QueueSpot = { x: number; baseY: number; distance: Distance };

/**
 * Waypoints from the far end of the park path to the window and off to the side, in queue
 * progress units (queue.ts). In between, people walk in a straight line; their sprite switches
 * size halfway between two waypoints of different distances.
 */
export const QUEUE_PATH: readonly (QueueSpot & { at: number })[] = [
  { at: QUEUE.enterX, x: 470, baseY: 150, distance: 'far' },
  { at: QUEUE.frontX - 2 * QUEUE.gap, x: 572, baseY: 154, distance: 'far' },
  { at: QUEUE.frontX - QUEUE.gap, x: 636, baseY: 176, distance: 'mid' },
  { at: QUEUE.frontX, x: 724, baseY: 226, distance: 'near' },
  { at: QUEUE.exitX, x: 1000, baseY: 226, distance: 'near' },
];

export function queueSpot(progress: number): QueueSpot {
  const path = QUEUE_PATH;
  if (progress <= path[0].at) return path[0];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (progress <= b.at) {
      const t = (progress - a.at) / (b.at - a.at);
      return {
        x: a.x + (b.x - a.x) * t,
        baseY: a.baseY + (b.baseY - a.baseY) * t,
        distance: t < 0.5 ? a.distance : b.distance,
      };
    }
  }
  return path[path.length - 1];
}
