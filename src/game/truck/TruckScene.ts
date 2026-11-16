import Phaser from 'phaser';
import { paintClock, paintTruckScene, TRUCK_H, TRUCK_W } from './truckArt';

/** Food truck v2 (GAME_DESIGN.md §14). 4.1: a static scene; the clock shows opening time. */
export class TruckScene extends Phaser.Scene {
  constructor() {
    super('truck');
  }

  create(): void {
    const texture = this.textures.createCanvas('truck-scene', TRUCK_W, TRUCK_H);
    if (!texture) return;
    const ctx = texture.getContext();
    paintTruckScene(ctx);
    paintClock(ctx, 10, 0);
    texture.refresh();
    this.add.image(0, 0, 'truck-scene').setOrigin(0, 0);
  }
}
