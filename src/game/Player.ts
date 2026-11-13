import Phaser from 'phaser';
import { CHAR_H, CHAR_W, FACINGS, FRAMES_PER_FACING, drawPlaceholderPlayer, frameIndex } from './placeholderSprites';
import { WALK_SPEED, facingFor, moveVector, type Facing } from './movement';

const TEXTURE = 'player';

/** Loads the player's frames and walk animations into the scene (once per game). */
function ensurePlayerTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEXTURE)) return;
  const canvas = document.createElement('canvas');
  drawPlaceholderPlayer(canvas);
  const texture = scene.textures.addCanvas(TEXTURE, canvas)!;
  for (let i = 0; i < FACINGS.length * FRAMES_PER_FACING; i++) {
    texture.add(i, 0, i * CHAR_W, 0, CHAR_W, CHAR_H);
  }
  for (const facing of FACINGS) {
    scene.anims.create({
      key: `walk-${facing}`,
      frames: [1, 0, 2, 0].map((step) => ({ key: TEXTURE, frame: frameIndex(facing, step) })),
      frameRate: 8,
      repeat: -1,
    });
  }
}

const sheetFacing = (facing: Facing) => (facing === 'left' || facing === 'right' ? 'side' : facing);

/** The player character: walks with WASD or the arrow keys. */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: Facing = 'up';
  private keys: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    ensurePlayerTexture(scene);
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

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    const k = this.keys;
    const vector = moveVector({
      up: k.up.isDown || k.w.isDown,
      down: k.down.isDown || k.s.isDown,
      left: k.left.isDown || k.a.isDown,
      right: k.right.isDown || k.d.isDown,
    });
    this.setVelocity(vector.x * WALK_SPEED, vector.y * WALK_SPEED);
    this.facing = facingFor(vector, this.facing);
    this.setFlipX(this.facing === 'right');

    const sheet = sheetFacing(this.facing);
    if (vector.x !== 0 || vector.y !== 0) {
      this.anims.play(`walk-${sheet}`, true);
    } else {
      this.anims.stop();
      this.setFrame(frameIndex(sheet, 0));
    }
    // Things lower on screen are drawn in front.
    this.setDepth(this.y);
  }
}
