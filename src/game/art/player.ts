import { baristaFrame } from './barista';
import { drawSheet, type Facing } from './characterKit';
import type { PaletteKey } from './palette';

/**
 * The player, Grandma's grandchild, in the final autumn style (GAME_DESIGN.md §3): auburn hair,
 * a slate-blue shirt under a cream café apron, brown trousers. Built on the Barista's body
 * (same café uniform cut), in the player's own colours.
 */
const SWAP: Partial<Record<PaletteKey, PaletteKey>> = { '7': 'N', G: '7', g: '6', n: '2', '1': '3', '2': '4' };

export function playerFrame(facing: Facing, step: number): string[] {
  return baristaFrame(facing, step).map((row) => [...row].map((ch) => SWAP[ch as PaletteKey] ?? ch).join(''));
}

export function drawPlayerSheet(canvas: HTMLCanvasElement): void {
  drawSheet(canvas, playerFrame);
}
