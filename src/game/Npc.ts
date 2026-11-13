import Phaser from 'phaser';
import { CHAR_H, frameIndex, type Look } from './placeholderSprites';
import { ensureCharacterTexture, facingToward, standFacing } from './characters';
import { TILE_SIZE } from './rooms/cafe';
import type { Facing } from './movement';

/** Someone standing in the café. They stay on their tile and turn to face whoever talks to them. */
export class Npc extends Phaser.Physics.Arcade.Sprite {
  /** Centre of the tile they stand on (used for talk range). */
  readonly spot: { x: number; y: number };

  constructor(
    scene: Phaser.Scene,
    readonly id: string,
    tile: { x: number; y: number },
    look: Look,
    private readonly restFacing: Facing = 'down',
  ) {
    ensureCharacterTexture(scene, `npc-${id}`, look);
    const x = (tile.x + 0.5) * TILE_SIZE;
    const y = tile.y * TILE_SIZE + 12;
    super(scene, x, y, `npc-${id}`, frameIndex('down', 0));
    this.spot = { x, y: (tile.y + 0.5) * TILE_SIZE };
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    // A static body on the feet, like the player's, so nobody walks through them.
    scene.physics.add.existing(this, true);
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(12, 8, false);
    body.setOffset(2, CHAR_H - 9);
    this.setDepth(this.y);
    standFacing(this, restFacing);
  }

  lookAt(point: { x: number; y: number }): void {
    standFacing(this, facingToward(this.spot, point));
  }

  /** Back to their usual pose once the conversation is over. */
  rest(): void {
    standFacing(this, this.restFacing);
  }
}
