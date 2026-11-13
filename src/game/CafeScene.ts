import Phaser from 'phaser';
import { BLOCKING_TILES, CAFE_MAP, PLAYER_START, TILE_SIZE, furnitureLayer, groundLayer } from './rooms/cafe';
import { drawPlaceholderTileset } from './placeholderTiles';
import { Player } from './Player';

const TILESET_KEY = 'cafe-tiles';
/** Never zoom out below this, so phones see big, readable pixels (the camera scrolls instead). */
const MIN_ZOOM = 2;
const MAX_ZOOM = 4;

/** The café's front room. */
export class CafeScene extends Phaser.Scene {
  private player!: Player;

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
    const layers = (
      [
        ['ground', groundLayer()],
        ['furniture', furnitureLayer()],
      ] as const
    ).map(([name, data]) => {
      const layer = map.createBlankLayer(name, tileset)!;
      data.forEach((row, y) => row.forEach((index, x) => index >= 0 && layer.putTileAt(index, x, y)));
      layer.setCollision([...BLOCKING_TILES]);
      return layer;
    });

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // Feet just inside the door, centred between the two door tiles.
    this.player = new Player(this, PLAYER_START.x * TILE_SIZE, (PLAYER_START.y + 1) * TILE_SIZE - 2);
    for (const layer of layers) this.physics.add.collider(this.player, layer);

    const fit = () => this.fitCamera(map.widthInPixels, map.heightInPixels);
    fit();
    this.cameras.main.startFollow(this.player, true);
    this.scale.on('resize', fit);
    this.events.once('shutdown', () => this.scale.off('resize', fit));
  }

  /**
   * Whole-number zoom so pixels stay square and sharp: as big as fits the room, but at
   * least MIN_ZOOM. If the room is smaller than the screen it is centred; if larger, the
   * camera follows the player without showing past the walls.
   */
  private fitCamera(roomWidth: number, roomHeight: number): void {
    const cam = this.cameras.main;
    const fitZoom = Math.floor(Math.min(cam.width / roomWidth, cam.height / roomHeight));
    const zoom = Phaser.Math.Clamp(fitZoom, MIN_ZOOM, MAX_ZOOM);
    cam.setZoom(zoom);
    const viewW = cam.width / zoom;
    const viewH = cam.height / zoom;
    const boundsW = Math.max(roomWidth, viewW);
    const boundsH = Math.max(roomHeight, viewH);
    cam.setBounds((roomWidth - boundsW) / 2, (roomHeight - boundsH) / 2, boundsW, boundsH);
  }
}
