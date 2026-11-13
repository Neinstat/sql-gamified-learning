import Phaser from 'phaser';
import { CAFE_MAP, TILE_SIZE, furnitureLayer, groundLayer } from './rooms/cafe';
import { drawPlaceholderTileset } from './placeholderTiles';

const TILESET_KEY = 'cafe-tiles';

/** The café's front room (iteration 2.1: the room only, nobody walking yet). */
export class CafeScene extends Phaser.Scene {
  constructor() {
    super('cafe');
  }

  create(): void {
    if (!this.textures.exists(TILESET_KEY)) {
      const canvas = document.createElement('canvas');
      drawPlaceholderTileset(canvas);
      this.textures.addCanvas(TILESET_KEY, canvas);
    }

    const map = this.make.tilemap({
      width: CAFE_MAP[0].length,
      height: CAFE_MAP.length,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });
    const tileset = map.addTilesetImage(TILESET_KEY, TILESET_KEY, TILE_SIZE, TILE_SIZE, 0, 0)!;
    for (const [name, data] of [
      ['ground', groundLayer()],
      ['furniture', furnitureLayer()],
    ] as const) {
      const layer = map.createBlankLayer(name, tileset)!;
      data.forEach((row, y) => row.forEach((index, x) => index >= 0 && layer.putTileAt(index, x, y)));
    }

    this.fitCamera(map.widthInPixels, map.heightInPixels);
    this.scale.on('resize', () => this.fitCamera(map.widthInPixels, map.heightInPixels));
  }

  /** Largest whole-number zoom that shows the whole room, so pixels stay square and sharp. */
  private fitCamera(roomWidth: number, roomHeight: number): void {
    const cam = this.cameras.main;
    const zoom = Math.max(1, Math.floor(Math.min(cam.width / roomWidth, cam.height / roomHeight)));
    cam.setZoom(zoom);
    cam.centerOn(roomWidth / 2, roomHeight / 2);
  }
}
