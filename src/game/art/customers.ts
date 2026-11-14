import { baristaFrame } from './barista';
import { drawSheet, type Facing } from './characterKit';
import { regularFrame } from './regular';
import type { PaletteKey } from './palette';

/**
 * Café customers for the "busy café" upgrade (GAME_DESIGN.md §9): the final-style characters,
 * recoloured so they read as different people.
 */
type Swap = Partial<Record<PaletteKey, PaletteKey>>;

const recolour = (frame: string[], swap: Swap) =>
  frame.map((row) => [...row].map((ch) => swap[ch as PaletteKey] ?? ch).join(''));

/** Someone in a berry beanie and an olive coat. */
const BEANIE: Swap = { N: 'B', n: 'b', c: 'p', o: 'l', O: 'L', r: 'G', y: '7', Y: '8', '3': '1', '4': '2' };
/** Someone with light hair and a berry jumper. */
const JUMPER: Swap = { G: 'B', g: 'b', '1': '4', '2': '5', n: 'r' };

export const CUSTOMER_LOOKS = {
  'customer-beanie': (facing: Facing, step: number) => recolour(regularFrame(facing, step), BEANIE),
  'customer-jumper': (facing: Facing, step: number) => recolour(baristaFrame(facing, step), JUMPER),
};

export type CustomerId = keyof typeof CUSTOMER_LOOKS;

export function drawCustomerSheet(canvas: HTMLCanvasElement, id: CustomerId): void {
  drawSheet(canvas, CUSTOMER_LOOKS[id]);
}
