import Phaser from 'phaser';
import { BLOCKING_TILES, CAFE_MAP, PLAYER_START, TILE_SIZE, furnitureLayer, groundLayer, walkableGrid } from './rooms/cafe';
import { findPath, type Tile } from './pathfinding';
import { drawPlaceholderTileset } from './placeholderTiles';
import { Player } from './Player';

const TILESET_KEY = 'cafe-tiles';
/** Never zoom out below this, so phones see big, readable pixels (the camera scrolls instead). */
const MIN_ZOOM = 2;
const MAX_ZOOM = 4;

/** Feet position for standing in the middle of a tile (the feet hitbox is centred on it). */
const tileToFeet = (t: Tile) => ({ x: t.x * TILE_SIZE + TILE_SIZE / 2, y: t.y * TILE_SIZE + 12 });

/** The café's front room. */
export class CafeScene extends Phaser.Scene {
  private player!: Player;
  private walkable = walkableGrid();
  private marker?: Phaser.GameObjects.Rectangle;

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

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.walkTo(pointer.worldX, pointer.worldY));
    this.player.on('path-end', () => this.clearMarker());

    const fit = () => this.fitCamera(map.widthInPixels, map.heightInPixels);
    fit();
    this.cameras.main.startFollow(this.player, true);
    this.scale.on('resize', fit);
    this.events.once('shutdown', () => this.scale.off('resize', fit));
  }

  /** Click/tap: walk to that tile, or as close as possible if it is furniture or a wall. */
  private walkTo(worldX: number, worldY: number): void {
    const target = { x: Math.floor(worldX / TILE_SIZE), y: Math.floor(worldY / TILE_SIZE) };
    // The player's tile is the one under the feet hitbox (4 px above the feet).
    const start = { x: Math.floor(this.player.x / TILE_SIZE), y: Math.floor((this.player.y - 4) / TILE_SIZE) };
    const path = findPath(this.walkable, start, target);
    if (path.length === 0) return;
    this.player.walkPath(path.map(tileToFeet));
    this.showMarker(path[path.length - 1]);
  }

  /** A soft pulsing square on the tile the player is walking to. */
  private showMarker(tile: Tile): void {
    this.clearMarker();
    const size = TILE_SIZE - 2;
    this.marker = this.add
      .rectangle((tile.x + 0.5) * TILE_SIZE, (tile.y + 0.5) * TILE_SIZE, size, size)
      .setStrokeStyle(1, 0xfff3d6, 0.9)
      .setDepth(1);
    this.tweens.add({ targets: this.marker, alpha: 0.35, duration: 450, yoyo: true, repeat: -1 });
  }

  private clearMarker(): void {
    if (this.marker) this.tweens.killTweensOf(this.marker);
    this.marker?.destroy();
    this.marker = undefined;
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
