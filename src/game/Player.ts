import Phaser from 'phaser';
import { CHAR_H, frameIndex } from './placeholderSprites';
import { ensureCharacterTexture, facingToward, sheetFacing, standFacing } from './characters';
import { WALK_SPEED, facingFor, moveVector, steerTowards, type Facing } from './movement';

type Point = { x: number; y: number };
/** Frames in a row the player may be pushed back by a wall before giving up on a path. */
const STUCK_FRAMES = 12;
const TEXTURE = 'player';

/**
 * The player character: walks with WASD / the arrow keys, or along a path (click/tap).
 * Events: 'path-end' (arrived: boolean) when a path is finished or cancelled.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: Facing = 'up';
  private path: Point[] = [];
  private stuckFrames = 0;
  private locked = false;
  private keys: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    ensureCharacterTexture(scene, TEXTURE, 'player');
    super(scene, x, y, TEXTURE, frameIndex('up', 0));
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Feet sit on (x, y); only the feet collide, so the head can overlap things behind.
    this.setOrigin(0.5, 1);
    this.body!.setSize(10, 6);
    this.body!.setOffset(3, CHAR_H - 7);
    this.setCollideWorldBounds(true);

    // `false` = do not swallow these keys, so typing in HTML overlays keeps working.
    this.keys = scene.input.keyboard!.addKeys(
      { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', w: 'W', a: 'A', s: 'S', d: 'D' },
      false,
    ) as Player['keys'];
  }

  /** Centre of the feet hitbox: the point used for tiles and talk range. */
  get feet(): Point {
    return { x: this.x, y: this.y - 4 };
  }

  /** Walk through these points (feet positions in world pixels). Replaces any current path. */
  walkPath(points: Point[]): void {
    if (this.path.length > 0) this.endPath(false);
    this.path = [...points];
    this.stuckFrames = 0;
  }

  /** While locked (an overlay is open) the player stands still and ignores input. */
  setLocked(locked: boolean): void {
    this.locked = locked;
    if (locked) {
      if (this.path.length > 0) this.endPath(false);
      this.setVelocity(0, 0);
      standFacing(this, this.facing);
    }
  }

  lookAt(point: Point): void {
    this.facing = facingToward(this.feet, point);
    standFacing(this, this.facing);
  }

  private endPath(arrived: boolean): void {
    this.path = [];
    this.emit('path-end', arrived);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.locked) return;
    const k = this.keys;
    let vector = moveVector({
      up: k.up.isDown || k.w.isDown,
      down: k.down.isDown || k.s.isDown,
      left: k.left.isDown || k.a.isDown,
      right: k.right.isDown || k.d.isDown,
    });
    // Keys always win: pressing one cancels the click/tap path.
    if ((vector.x !== 0 || vector.y !== 0) && this.path.length > 0) this.endPath(false);
    if (this.path.length > 0) vector = this.followPath(delta);
    if (this.locked) return; // reaching the end of a path can open a dialogue

    this.setVelocity(vector.x * WALK_SPEED, vector.y * WALK_SPEED);
    this.facing = facingFor(vector, this.facing);

    if (vector.x !== 0 || vector.y !== 0) {
      this.setFlipX(this.facing === 'right');
      this.anims.play(`${TEXTURE}-walk-${sheetFacing(this.facing)}`, true);
    } else {
      standFacing(this, this.facing);
    }
    // Things lower on screen are drawn in front.
    this.setDepth(this.y);
  }

  /** Direction for this frame along the path; drops waypoints as they are reached. */
  private followPath(delta: number): Point {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body.blocked.none) this.stuckFrames++;
    else this.stuckFrames = 0;
    if (this.stuckFrames > STUCK_FRAMES) {
      this.endPath(false);
      return { x: 0, y: 0 };
    }

    const stepLength = (WALK_SPEED * delta) / 1000;
    while (this.path.length > 0) {
      const { vector, arrived } = steerTowards(this, this.path[0], stepLength);
      if (!arrived) return vector;
      const reached = this.path.shift()!;
      if (this.path.length === 0) {
        body.reset(reached.x, reached.y);
        this.endPath(true);
      }
    }
    return { x: 0, y: 0 };
  }
}
