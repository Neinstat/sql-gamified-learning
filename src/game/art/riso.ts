/**
 * The riso inks (GAME_DESIGN.md §14.8): the only colours the game uses. Models are painted in
 * these inks, and the risograph shader (truck/risoPass.ts) maps every pixel back onto them with
 * dithered dots and mis-registered red outlines. Our own palette (no third-party licence).
 */
export const RISO = {
  // Paper.
  paper: '#f4ead5',
  paperShade: '#e6d6b6',
  white: '#fffaf0',
  // Ink (outlines, text) — a deep blue, not black.
  ink: '#25304f',
  inkSoft: '#4a5878',
  // Tomato red (the "mis-registered" layer).
  red: '#e4573d',
  redDark: '#a83b2a',
  pink: '#f3a59a',
  // Teal.
  teal: '#2b9c8e',
  tealDark: '#1c6b63',
  tealLight: '#9ad6c8',
  // Mustard.
  mustard: '#f2b234',
  mustardDark: '#c58a1f',
  // Dusk sky.
  peach: '#f8c7a4',
  lilac: '#c9b3d9',
  // Park.
  grass: '#79b25d',
  grassDark: '#4f8a49',
  // Wood.
  wood: '#c27b4b',
  woodDark: '#8a5134',
  // Skin tones.
  skin1: '#f6cfae',
  skin2: '#d9a07a',
  skin3: '#9a6446',
} as const;

export type Ink = keyof typeof RISO;
