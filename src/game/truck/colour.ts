import * as THREE from 'three';
import { RISO, type Ink } from '../art/riso';

/**
 * A riso ink as a Three.js colour with its values exactly as written (no sRGB → linear
 * conversion), so the scene and the riso pass compare like with like.
 */
export function inkColour(ink: Ink): THREE.Color {
  return hexColour(RISO[ink]);
}

export function hexColour(hex: string): THREE.Color {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Color(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
