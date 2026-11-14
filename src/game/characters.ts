import Phaser from 'phaser';
import { CHAR_H, CHAR_W, FACINGS, FRAMES_PER_FACING, LOOKS, drawPlaceholderCharacter, frameIndex } from './placeholderSprites';
import { drawGrandmaSheet } from './art/grandma';
import { drawBaristaSheet } from './art/barista';
import type { Facing } from './movement';

export type CharacterLook = keyof typeof LOOKS;

/** Characters already drawn in the final style; the rest still use placeholders (GAME_DESIGN.md §3). */
const FINAL_SHEETS: Partial<Record<CharacterLook, (canvas: HTMLCanvasElement) => void>> = {
  grandma: drawGrandmaSheet,
  barista: drawBaristaSheet,
};

/**
 * Loads a character's frames and walk animations into the game (once per texture key).
 * Animations are named `<key>-walk-<down|up|side>`.
 */
export function ensureCharacterTexture(scene: Phaser.Scene, key: string, who: CharacterLook): void {
  if (scene.textures.exists(key)) return;
  const canvas = document.createElement('canvas');
  const drawFinal = FINAL_SHEETS[who];
  if (drawFinal) drawFinal(canvas);
  else drawPlaceholderCharacter(canvas, LOOKS[who]);
  const texture = scene.textures.addCanvas(key, canvas)!;
  for (let i = 0; i < FACINGS.length * FRAMES_PER_FACING; i++) {
    texture.add(i, 0, i * CHAR_W, 0, CHAR_W, CHAR_H);
  }
  for (const facing of FACINGS) {
    scene.anims.create({
      key: `${key}-walk-${facing}`,
      frames: [1, 0, 2, 0].map((step) => ({ key, frame: frameIndex(facing, step) })),
      frameRate: 8,
      repeat: -1,
    });
  }
}

export const sheetFacing = (facing: Facing) => (facing === 'left' || facing === 'right' ? 'side' : facing);

/** Show a character standing still, looking `facing` (right = left frame flipped). */
export function standFacing(sprite: Phaser.GameObjects.Sprite, facing: Facing): void {
  sprite.anims.stop();
  sprite.setFrame(frameIndex(sheetFacing(facing), 0));
  sprite.setFlipX(facing === 'right');
}

/** Which way to look from `from` to see `to` (the larger difference wins). */
export function facingToward(from: { x: number; y: number }, to: { x: number; y: number }): Facing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}
