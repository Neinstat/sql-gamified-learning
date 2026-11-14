import Phaser from 'phaser';
import { ensureSheetTexture, sheetFacing, standFacing } from './characters';
import { drawCustomerSheet, type CustomerId } from './art/customers';
import { findPath, type Tile } from './pathfinding';
import { TILE_SIZE } from './rooms/cafe';
import type { Facing } from './movement';

/** Walking speed in world pixels per second: a little slower than the player. */
const SPEED = 36;

/**
 * A customer strolling around the front room (the "busy café" upgrade, GAME_DESIGN.md §9).
 * Pure decoration: no physics, never in the player's way, never talked to.
 */
export class Customer extends Phaser.GameObjects.Sprite {
  private timer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    id: CustomerId,
    start: Tile,
    /** Floor tiles this customer may walk to (the front room). */
    private readonly spots: Tile[],
    /** The current walkable grid (it changes when doors open or upgrades are bought). */
    private readonly walkable: () => boolean[][],
  ) {
    ensureSheetTexture(scene, id, (canvas) => drawCustomerSheet(canvas, id));
    super(scene, (start.x + 0.5) * TILE_SIZE, start.y * TILE_SIZE + 12, id);
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(this.y);
    standFacing(this, 'down');
    this.wait();
  }

  private wait(): void {
    this.timer = this.scene.time.delayedCall(Phaser.Math.Between(1500, 4500), () => this.stroll());
  }

  private stroll(): void {
    const from = { x: Math.floor(this.x / TILE_SIZE), y: Math.floor((this.y - 1) / TILE_SIZE) };
    const goal = Phaser.Utils.Array.GetRandom(this.spots);
    const path = findPath(this.walkable(), from, goal).slice(0, 8);
    this.walk(path);
  }

  private walk(path: Tile[]): void {
    const next = path.shift();
    if (!next) {
      this.anims.stop();
      standFacing(this, 'down');
      this.wait();
      return;
    }
    const x = (next.x + 0.5) * TILE_SIZE;
    const y = next.y * TILE_SIZE + 12;
    const facing: Facing = Math.abs(x - this.x) > Math.abs(y - this.y) ? (x < this.x ? 'left' : 'right') : y < this.y ? 'up' : 'down';
    this.setFlipX(facing === 'right');
    this.anims.play(`${this.texture.key}-walk-${sheetFacing(facing)}`, true);
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration: (Math.hypot(x - this.x, y - this.y) / SPEED) * 1000,
      onUpdate: () => this.setDepth(this.y),
      onComplete: () => this.walk(path),
    });
  }

  override destroy(fromScene?: boolean): void {
    this.timer?.remove();
    this.scene?.tweens.killTweensOf(this);
    super.destroy(fromScene);
  }
}

