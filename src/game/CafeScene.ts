import Phaser from 'phaser';
import {
  BLOCKING_TILES,
  CAFE_MAP,
  NPCS,
  PLAYER_START,
  TILE_SIZE,
  furnitureLayer,
  groundLayer,
  walkableGrid,
} from './rooms/cafe';
import { findPath, type Tile } from './pathfinding';
import { drawPlaceholderTileset } from './placeholderTiles';
import { LOOKS } from './placeholderSprites';
import { Player } from './Player';
import { Npc } from './Npc';
import { nearestInteractable } from './interaction';
import type { GameBridge } from './bridge';

const TILESET_KEY = 'cafe-tiles';
const PROMPT_KEY = 'talk-prompt';
/** Never zoom out below this, so phones see big, readable pixels (the camera scrolls instead). */
const MIN_ZOOM = 2;
const MAX_ZOOM = 4;
/** After an overlay closes, ignore the talk key briefly so the key that closed it doesn't reopen it. */
const REOPEN_DELAY_MS = 250;

/** Feet position for standing in the middle of a tile (the feet hitbox is centred on it). */
const tileToFeet = (t: Tile) => ({ x: t.x * TILE_SIZE + TILE_SIZE / 2, y: t.y * TILE_SIZE + 12 });
const toTile = (p: { x: number; y: number }) => ({ x: Math.floor(p.x / TILE_SIZE), y: Math.floor(p.y / TILE_SIZE) });

/** The café's front room. */
export class CafeScene extends Phaser.Scene {
  private bridge!: GameBridge;
  private player!: Player;
  private npcs: Npc[] = [];
  private walkable = walkableGrid();
  private marker?: Phaser.GameObjects.Rectangle;
  private prompt!: Phaser.GameObjects.Image;
  private talkKeys: Phaser.Input.Keyboard.Key[] = [];
  private locked = false;
  private talkBlockedUntil = 0;
  /** NPC the player clicked on: talk to them on arrival. */
  private pendingTalk: Npc | null = null;
  private talkingTo: Npc | null = null;

  constructor() {
    super('cafe');
  }

  create(): void {
    this.bridge = this.registry.get('bridge');
    this.makeTextures();

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
    this.npcs = NPCS.map((npc) => new Npc(this, npc.id, npc.tile, LOOKS[npc.id]));
    for (const obstacle of [...layers, ...this.npcs]) this.physics.add.collider(this.player, obstacle);

    this.prompt = this.add.image(0, 0, PROMPT_KEY).setOrigin(0.5, 1).setVisible(false).setDepth(10_000);
    this.tweens.add({ targets: this.prompt, y: '-=2', duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.talkKeys = ['E', 'SPACE', 'ENTER'].map((key) => this.input.keyboard!.addKey(key, false));
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onPointer(pointer.worldX, pointer.worldY));
    this.player.on('path-end', (arrived: boolean) => this.onPathEnd(arrived));

    const offOverlay = this.bridge.on('overlay', (open) => this.setLocked(open));

    const fit = () => this.fitCamera(map.widthInPixels, map.heightInPixels);
    fit();
    this.cameras.main.startFollow(this.player, true);
    this.scale.on('resize', fit);
    this.events.once('shutdown', () => {
      this.scale.off('resize', fit);
      offOverlay();
    });
  }

  update(): void {
    if (this.locked) return;
    const near = nearestInteractable(
      this.player.feet,
      this.npcs.map((npc) => ({ id: npc.id, x: npc.spot.x, y: npc.spot.y, npc })),
    )?.npc;

    if (near) {
      this.prompt.setVisible(true);
      this.prompt.x = near.x;
      // Keep the bob tween's offset: only reset y when the prompt moves to a new NPC.
      if (this.prompt.getData('for') !== near.id) {
        this.prompt.y = near.y - 34;
        this.prompt.setData('for', near.id);
      }
    } else {
      this.prompt.setVisible(false).setData('for', null);
    }

    const talkPressed = this.talkKeys.some((key) => Phaser.Input.Keyboard.JustDown(key));
    // Same clock as talkBlockedUntil (the scene clock), never the loop time.
    if (near && talkPressed && this.time.now >= this.talkBlockedUntil) this.talkTo(near);
  }

  private talkTo(npc: Npc): void {
    this.pendingTalk = null;
    this.talkingTo = npc;
    this.player.lookAt(npc.spot);
    npc.lookAt(this.player.feet);
    this.bridge.emit('interact', { kind: 'npc', id: npc.id });
  }

  private setLocked(locked: boolean): void {
    this.locked = locked;
    this.player.setLocked(locked);
    this.input.keyboard!.resetKeys();
    if (locked) {
      this.prompt.setVisible(false);
      this.clearMarker();
    } else {
      this.talkBlockedUntil = this.time.now + REOPEN_DELAY_MS;
      this.talkingTo?.rest();
      this.talkingTo = null;
    }
  }

  /** Click/tap: on an NPC = walk up and talk; elsewhere = walk there (or as close as possible). */
  private onPointer(worldX: number, worldY: number): void {
    if (this.locked) return;
    const target = toTile({ x: worldX, y: worldY });
    const npc = this.npcAt(worldX, worldY);
    this.pendingTalk = npc;

    if (npc && nearestInteractable(this.player.feet, [{ id: npc.id, ...npc.spot }])) {
      this.talkTo(npc); // already next to them
      return;
    }
    const path = findPath(this.walkable, toTile(this.player.feet), npc ? toTile(npc.spot) : target);
    if (path.length === 0) return;
    this.player.walkPath(path.map(tileToFeet));
    this.showMarker(path[path.length - 1]);
  }

  /** The NPC whose body (16×32 sprite) was clicked, if any. */
  private npcAt(worldX: number, worldY: number): Npc | null {
    return this.npcs.find((npc) => npc.getBounds().contains(worldX, worldY)) ?? null;
  }

  private onPathEnd(arrived: boolean): void {
    this.clearMarker();
    const npc = this.pendingTalk;
    this.pendingTalk = null;
    if (arrived && npc && nearestInteractable(this.player.feet, [{ id: npc.id, ...npc.spot }])) this.talkTo(npc);
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

  private makeTextures(): void {
    if (!this.textures.exists(TILESET_KEY)) {
      const canvas = document.createElement('canvas');
      drawPlaceholderTileset(canvas);
      this.textures.addCanvas(TILESET_KEY, canvas);
    }
    if (!this.textures.exists(PROMPT_KEY)) {
      // A small speech bubble with three dots: "you can talk here".
      const g = this.make.graphics({}, false);
      g.fillStyle(0x3b2f2a).fillRect(1, 0, 11, 9).fillRect(0, 1, 13, 7).fillRect(5, 9, 3, 2);
      g.fillStyle(0xfffaf3).fillRect(2, 1, 9, 7).fillRect(1, 2, 11, 5).fillRect(6, 8, 1, 1);
      g.fillStyle(0xb5643c).fillRect(3, 4, 2, 2).fillRect(6, 4, 2, 2).fillRect(9, 4, 2, 2);
      g.generateTexture(PROMPT_KEY, 13, 11);
      g.destroy();
    }
  }

  /**
   * Whole-number zoom so pixels stay square and sharp: as big as fits the room, but at
   * least MIN_ZOOM. If the room is smaller than the screen it is centred; if larger, the
   * camera follows the player without showing past the walls.
   */
  private fitCamera(roomWidth: number, roomHeight: number): void {
    const cam = this.cameras.main;
    // Use the new canvas size: on 'resize' the camera may not have been resized yet.
    const { width, height } = this.scale.gameSize;
    cam.setSize(width, height);
    const fitZoom = Math.floor(Math.min(width / roomWidth, height / roomHeight));
    const zoom = Phaser.Math.Clamp(fitZoom, MIN_ZOOM, MAX_ZOOM);
    cam.setZoom(zoom);
    const viewW = width / zoom;
    const viewH = height / zoom;
    const boundsW = Math.max(roomWidth, viewW);
    const boundsH = Math.max(roomHeight, viewH);
    cam.setBounds((roomWidth - boundsW) / 2, (roomHeight - boundsH) / 2, boundsW, boundsH);
  }
}
