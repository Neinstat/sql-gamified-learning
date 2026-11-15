import { baristaPortrait } from './barista';
import { grandmaPortrait } from './grandma';
import { regularPortrait } from './regular';
import { supplierPortrait } from './supplier';

const PORTRAITS: Record<string, () => string> = {
  grandma: grandmaPortrait,
  barista: baristaPortrait,
  regular: regularPortrait,
  supplier: supplierPortrait,
};

/** A data URL for a character's 64×64 dialogue portrait (Grandma's for anyone without one). */
export function characterPortrait(character: string): string {
  return (PORTRAITS[character] ?? grandmaPortrait)();
}
