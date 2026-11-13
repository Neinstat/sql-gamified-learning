import Phaser from 'phaser';
import {
  BLOCKING_TILES,
  CAFE_MAP,
  NPCS,
  PLAYER_START,
  STATION_SPOTS,
  TILE_SIZE,
  findTiles,
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
import { autoZoom, clampZoom, edgePointer } from './camera';
import type { GameBridge, InteractTarget } from './bridge';

const TILESET_KEY = 'cafe-tiles';
const PROMPT_KEY = 'talk-prompt';
const QUEST_KEY = 'quest-marker';
const ARROW_KEY = 'quest-arrow';
/** Zoom the player picked with − / + or the mouse wheel; remembered in this browser. */
const ZOOM_STORAGE_KEY = 'sql-valley.zoom';
/** One wheel "notch" at most this often, so a trackpad swipe doesn't jump 1× → 4×. */
const WHEEL_STEP_MS = 200;
/** After an overlay closes, ignore the talk key briefly so the key that closed it doesn't reopen it. */
const REOPEN_DELAY_MS = 250;

/** Feet position for standing in the middle of a tile (the feet hitbox is centred on it). */
const tileToFeet = (t: Tile) => ({ x: t.x * TILE_SIZE + TILE_SIZE / 2, y: t.y * TILE_SIZE + 12 });
const toTile = (p: { x: number; y: number }) => ({ x: Math.floor(p.x / TILE_SIZE), y: Math.floor(p.y / TILE_SIZE) });

/** Something the player can use: an NPC to talk to, or a station with a SQL console. */
type Target = InteractTarget & {
  /** Centre of its tile: talk range is measured from here. */
  x: number;
  y: number;
  /** Where the "…" bubble sits (its bottom edge). */
  promptX: number;
  promptY: number;
  npc?: Npc;
  /** Click/tap area. */
  hit: () => Phaser.Geom.Rectangle;
};

/** The café's front room. */
export class CafeScene extends Phaser.Scene {
  private bridge!: GameBridge;
  private player!: Player;
  private npcs: Npc[] = [];
  private targets: Target[] = [];
  private walkable = walkableGrid();
  private marker?: Phaser.GameObjects.Rectangle;
  private prompt!: Phaser.GameObjects.Image;
  private questMarker!: Phaser.GameObjects.Image;
  private quest: Target | null = null;
  private questArrow!: Phaser.GameObjects.Image;
  private manualZoom: number | null = loadZoom();
  private lastWheel = 0;
  private refit: () => void = () => {};
  private locked = false;
  private talkBlockedUntil = 0;
  /** Target the player clicked on: use it on arrival. */
  private pendingUse: Target | null = null;
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
    this.npcs = NPCS.map((npc) => new Npc(this, npc.id, npc.tile, LOOKS[npc.id], npc.facing));
    for (const obstacle of [...layers, ...this.npcs]) this.physics.add.collider(this.player, obstacle);
    this.targets = [
      ...this.npcs.map(
        (npc): Target => ({
          kind: 'npc',
          id: npc.id,
          ...npc.spot,
          promptX: npc.x,
          promptY: npc.y - 34,
          npc,
          hit: () => npc.getBounds(),
        }),
      ),
      ...STATION_SPOTS.map(({ id, mapChar }): Target => {
        const [tile] = findTiles(mapChar);
        const box = new Phaser.Geom.Rectangle(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        return {
          kind: 'station',
          id,
          x: box.centerX,
          y: box.centerY,
          promptX: box.centerX,
          promptY: box.y - 1,
          hit: () => box,
        };
      }),
    ];

    this.prompt = this.add.image(0, 0, PROMPT_KEY).setOrigin(0.5, 1).setVisible(false).setDepth(10_000);
    this.tweens.add({ targets: this.prompt, y: '-=2', duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.questMarker = this.add.image(0, 0, QUEST_KEY).setOrigin(0.5, 1).setVisible(false).setDepth(10_000);
    this.questArrow = this.add.image(0, 0, ARROW_KEY).setVisible(false).setDepth(10_001);

    // Key events (not polling), so even a very quick tap between two frames is noticed.
    for (const key of ['E', 'SPACE', 'ENTER']) this.input.keyboard!.on(`keydown-${key}`, () => this.onTalkKey());
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onPointer(pointer.worldX, pointer.worldY));
    this.player.on('path-end', (arrived: boolean) => this.onPathEnd(arrived));

    const offOverlay = this.bridge.on('overlay', (open) => this.setLocked(open));
    const offQuest = this.bridge.on('quest', (target) => this.setQuest(target));
    const offZoom = this.bridge.on('zoom', (step) => this.zoomBy(step));
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (this.locked || dy === 0 || this.time.now - this.lastWheel < WHEEL_STEP_MS) return;
      this.lastWheel = this.time.now;
      this.zoomBy(dy < 0 ? 1 : -1);
    });
    this.bridge.emit('ready', true);

    const fit = () => this.fitCamera(map.widthInPixels, map.heightInPixels);
    this.refit = fit;
    fit();
    this.cameras.main.startFollow(this.player, true);
    this.scale.on('resize', fit);
    this.events.once('shutdown', () => {
      this.scale.off('resize', fit);
      offOverlay();
      offQuest();
      offZoom();
    });
  }

  update(time: number): void {
    // The "!" floats over where the player should go next, unless the "…" is already there.
    const near = this.locked ? null : nearestInteractable(this.player.feet, this.targets);
    if (this.quest) {
      this.questMarker.setVisible(near?.id !== this.quest.id);
      this.questMarker.setPosition(this.quest.promptX, this.quest.promptY - 1 + Math.round(Math.sin(time / 250)));
    }
    this.updateQuestArrow();
    if (this.locked) return;

    if (near) {
      this.prompt.setVisible(true);
      this.prompt.x = near.promptX;
      // Keep the bob tween's offset: only reset y when the prompt moves to a new target.
      if (this.prompt.getData('for') !== near.id) {
        this.prompt.y = near.promptY;
        this.prompt.setData('for', near.id);
      }
    } else {
      this.prompt.setVisible(false).setData('for', null);
    }
  }

  private setQuest(target: InteractTarget | null): void {
    this.quest = target ? (this.targets.find((t) => t.kind === target.kind && t.id === target.id) ?? null) : null;
    this.questMarker.setVisible(this.quest !== null);
  }

  /** A golden arrow on the screen edge, pointing at the quest target when it is off screen. */
  private updateQuestArrow(): void {
    const cam = this.cameras.main;
    const zoom = cam.zoom;
    const pointer = this.quest ? edgePointer(cam.worldView, this.quest, 14 / zoom + 6) : null;
    this.questArrow.setVisible(pointer !== null);
    if (!pointer) return;
    // Keep the arrow a readable size on screen at every zoom.
    this.questArrow.setScale(Math.max(1, 2 / zoom)).setPosition(pointer.x, pointer.y).setRotation(pointer.angle);
  }

  /** − / + buttons and the mouse wheel: one whole zoom step at a time. */
  private zoomBy(step: number): void {
    this.manualZoom = clampZoom(this.cameras.main.zoom + step);
    saveZoom(this.manualZoom);
    this.refit();
  }

  private onTalkKey(): void {
    // Same clock as talkBlockedUntil (the scene clock), never the loop time.
    if (this.locked || this.time.now < this.talkBlockedUntil) return;
    const near = nearestInteractable(this.player.feet, this.targets);
    if (near) this.use(near);
  }

  /** Talk to an NPC or open a station: the React side shows the matching overlay. */
  private use(target: Target): void {
    this.pendingUse = null;
    this.player.lookAt(target);
    if (target.npc) {
      this.talkingTo = target.npc;
      target.npc.lookAt(this.player.feet);
    }
    this.bridge.emit('interact', { kind: target.kind, id: target.id });
  }

  private inRange(target: Target): boolean {
    return nearestInteractable(this.player.feet, [target]) !== null;
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

  /** Click/tap: on an NPC or station = walk up and use it; elsewhere = walk there (or as close as possible). */
  private onPointer(worldX: number, worldY: number): void {
    if (this.locked) return;
    const clicked = this.targets.find((t) => t.hit().contains(worldX, worldY)) ?? null;

    if (clicked && this.inRange(clicked)) {
      this.use(clicked); // already next to it
      return;
    }
    const goal = clicked ? toTile(clicked) : toTile({ x: worldX, y: worldY });
    const path = findPath(this.walkable, toTile(this.player.feet), goal);
    if (path.length === 0) return;
    // Start walking first: replacing an old path ends it, which clears pendingUse.
    this.player.walkPath(path.map(tileToFeet));
    this.pendingUse = clicked;
    this.showMarker(path[path.length - 1]);
  }

  private onPathEnd(arrived: boolean): void {
    this.clearMarker();
    const target = this.pendingUse;
    this.pendingUse = null;
    if (arrived && target && this.inRange(target)) this.use(target);
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
    if (!this.textures.exists(ARROW_KEY)) {
      // A golden arrow pointing right (rotated towards the target).
      const g = this.make.graphics({}, false);
      g.fillStyle(0x3b2f2a).fillTriangle(0, 0, 11, 6, 0, 12);
      g.fillStyle(0xf0c75e).fillTriangle(1, 2, 8, 6, 1, 10);
      g.generateTexture(ARROW_KEY, 12, 13);
      g.destroy();
    }
    if (!this.textures.exists(QUEST_KEY)) {
      // A golden "!" bubble: "go here next".
      const g = this.make.graphics({}, false);
      g.fillStyle(0x3b2f2a).fillRect(1, 0, 7, 11).fillRect(0, 1, 9, 9).fillRect(3, 11, 3, 2);
      g.fillStyle(0xf0c75e).fillRect(2, 1, 5, 9).fillRect(1, 2, 7, 7).fillRect(4, 11, 1, 1);
      g.fillStyle(0x3b2f2a).fillRect(4, 2, 1, 4).fillRect(4, 7, 1, 1);
      g.generateTexture(QUEST_KEY, 9, 13);
      g.destroy();
    }
  }

  /**
   * Whole-number zoom so pixels stay square and sharp: the player's choice, or automatic
   * (see camera.ts). If the room is smaller than the screen it is centred; if larger, the camera follows
   * the player without showing past the walls.
   */
  private fitCamera(roomWidth: number, roomHeight: number): void {
    const cam = this.cameras.main;
    // Use the new canvas size: on 'resize' the camera may not have been resized yet.
    const { width, height } = this.scale.gameSize;
    cam.setSize(width, height);
    const zoom = this.manualZoom ?? autoZoom(width, height, roomWidth, roomHeight);
    cam.setZoom(zoom);
    const viewW = width / zoom;
    const viewH = height / zoom;
    const boundsW = Math.max(roomWidth, viewW);
    const boundsH = Math.max(roomHeight, viewH);
    cam.setBounds((roomWidth - boundsW) / 2, (roomHeight - boundsH) / 2, boundsW, boundsH);
  }
}

function loadZoom(): number | null {
  try {
    const saved = Number(localStorage.getItem(ZOOM_STORAGE_KEY));
    return saved ? clampZoom(saved) : null;
  } catch {
    return null;
  }
}

function saveZoom(zoom: number): void {
  try {
    localStorage.setItem(ZOOM_STORAGE_KEY, String(zoom));
  } catch {
    // Storage blocked: the zoom just isn't remembered.
  }
}
