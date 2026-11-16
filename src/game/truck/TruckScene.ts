import Phaser from 'phaser';
import { PROTOTYPE_ORDERS, type CustomerLook } from '../../sql-core/truck/orders';
import {
  CUSTOMER_FRAMES,
  CUSTOMER_H,
  CUSTOMER_W,
  LOOKS,
  paintCustomerSheet,
  paintPlayerSheet,
  PLAYER_FRAMES,
  PLAYER_H,
  PLAYER_W,
} from './customerArt';
import { TruckQueue, type QueueCustomer } from './queue';
import type { TruckBridge } from './truckBridge';
import {
  CLOCK,
  OUTSIDE_PARALLAX,
  OUTSIDE_W,
  paintClock,
  paintInterior,
  paintOutside,
  TRUCK_H,
  TRUCK_LAYOUT,
  WORLD_W,
} from './truckArt';
import {
  clampToFloor,
  FLOOR,
  INTERACTABLES,
  moveVector,
  nearestInteractable,
  PLAYER_SPEED,
  standingSpot,
  stepTowards,
  type Interactable,
  type Point,
} from './truckWorld';

/** Seconds between customers arriving. */
const ARRIVAL_GAP = 3;
/** Seconds per walking frame. */
const STEP_TIME = 0.16;

/** Depths, back to front. */
const DEPTH = { outside: 0, customers: 1, interior: 2, player: 3, prompt: 4, labels: 5 } as const;

/**
 * Food truck v2 (GAME_DESIGN.md §14.8): a walkable, side-on truck interior wider than the screen.
 * Layers: the street (parallax), customers at the window, the inside of the truck (window left
 * see-through), the player, then the "E" prompt and placeholder labels.
 */
export class TruckScene extends Phaser.Scene {
  private bridge!: TruckBridge;
  private queue = new TruckQueue();
  private customers = new Map<QueueCustomer, Phaser.GameObjects.Image>();
  private nextOrder = 0;
  private sinceArrival = ARRIVAL_GAP;
  private frontOrderId: string | null = null;
  private walkClock = 0;
  private paused = false;

  private player!: Phaser.GameObjects.Image;
  private feet: Point = { x: 300, y: 220 };
  private facingLeft = false;
  private target: { point: Point; use: Interactable | null } | null = null;
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>;
  private prompt!: Phaser.GameObjects.Container;
  private near: Interactable | null = null;
  private labels: Phaser.GameObjects.Text[] = [];
  private lastScrollX = -1;

  constructor() {
    super('truck');
  }

  create(): void {
    this.bridge = this.registry.get('bridge') as TruckBridge;
    this.queue = new TruckQueue();
    this.customers.clear();
    this.nextOrder = 0;
    this.sinceArrival = ARRIVAL_GAP;
    this.frontOrderId = null;
    this.paused = false;
    this.target = null;
    this.labels = [];
    this.lastScrollX = -1;
    this.feet = { x: 300, y: 220 };

    // Layers.
    this.layer('truck-outside', OUTSIDE_W, paintOutside).setDepth(DEPTH.outside).setScrollFactor(OUTSIDE_PARALLAX, 1);
    this.layer('truck-interior', WORLD_W, (ctx) => {
      paintInterior(ctx);
      paintClock(ctx, 10, 0);
    }).setDepth(DEPTH.interior);
    for (const look of Object.keys(LOOKS) as CustomerLook[]) {
      this.sheet(`customer-${look}`, CUSTOMER_W, CUSTOMER_H, CUSTOMER_FRAMES, (ctx) => paintCustomerSheet(ctx, look));
    }
    this.sheet('truck-player', PLAYER_W, PLAYER_H, PLAYER_FRAMES, paintPlayerSheet);

    // The player, and a camera that follows them across the truck.
    this.player = this.add.image(this.feet.x, this.feet.y, 'truck-player', 0).setOrigin(0.5, 1).setDepth(DEPTH.player);
    this.cameras.main.setBounds(0, 0, WORLD_W, TRUCK_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(80, TRUCK_H);

    this.prompt = this.makePrompt().setDepth(DEPTH.prompt).setVisible(false);

    // `false` = do not swallow these keys, so typing in the tablet keeps working.
    this.keys = this.input.keyboard!.addKeys(
      { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', w: 'W', a: 'A', s: 'S', d: 'D' },
      false,
    ) as TruckScene['keys'];
    this.input.keyboard!.on('keydown-E', () => this.useNearby());

    // Click/tap: walk to a spot on the floor, or to a thing and use it.
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onPointer(pointer));

    this.makeLabels();

    const offs = [
      this.bridge.on('serve', () => this.queue.serveFront()),
      this.bridge.on('pause', (paused) => this.setPaused(paused)),
      this.bridge.on('artLabels', (show) => this.labels.forEach((l) => l.setVisible(show))),
    ];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => offs.forEach((off) => off()));
  }

  // ── Textures ──────────────────────────────────────────────────────────────────────────

  private layer(key: string, width: number, paint: (ctx: CanvasRenderingContext2D) => void): Phaser.GameObjects.Image {
    if (!this.textures.exists(key)) {
      const texture = this.textures.createCanvas(key, width, TRUCK_H);
      if (texture) {
        paint(texture.getContext());
        texture.refresh();
      }
    }
    return this.add.image(0, 0, key).setOrigin(0, 0);
  }

  private sheet(key: string, w: number, h: number, frames: number, paint: (ctx: CanvasRenderingContext2D) => void): void {
    if (this.textures.exists(key)) return;
    const texture = this.textures.createCanvas(key, w * frames, h);
    if (!texture) return;
    paint(texture.getContext());
    texture.refresh();
    for (let f = 0; f < frames; f++) texture.add(f, 0, f * w, 0, w, h);
  }

  /** The "E" key cap that floats over whatever the player can use. */
  private makePrompt(): Phaser.GameObjects.Container {
    const g = this.add.graphics();
    g.fillStyle(0x2b1d19).fillRect(-7, -7, 14, 14);
    g.fillStyle(0xfff6e3).fillRect(-6, -6, 12, 12);
    g.fillStyle(0xd7a571).fillRect(-6, 4, 12, 2);
    const letter = this.add.text(0, -1, 'E', { fontFamily: 'monospace', fontSize: '10px', color: '#2b1d19', fontStyle: 'bold' });
    letter.setOrigin(0.5).setResolution(4);
    return this.add.container(0, 0, [g, letter]);
  }

  /** "PLACEHOLDER" tags over every drawing that is not final art yet (hidden until toggled). */
  private makeLabels(): void {
    const tag = (x: number, y: number, follow?: () => Point) => {
      const text = this.add
        .text(x, y, 'PLACEHOLDER', {
          fontFamily: 'monospace',
          fontSize: '7px',
          color: '#fff6e3',
          backgroundColor: '#a5494f',
          padding: { x: 2, y: 1 },
        })
        .setOrigin(0.5, 1)
        .setResolution(4)
        .setDepth(DEPTH.labels)
        .setVisible(false);
      if (follow) text.setData('follow', follow);
      this.labels.push(text);
    };
    const L = TRUCK_LAYOUT;
    tag(L.fridge.x + L.fridge.w / 2, L.fridge.y - 2);
    tag(L.window.x + 60, L.window.y + 20);
    tag(L.tablet.x + L.tablet.w / 2, L.tablet.y - 2);
    tag(L.coffeeMachine.x + L.coffeeMachine.w / 2, L.coffeeMachine.y - 2);
    tag(CLOCK.cx, CLOCK.cy - CLOCK.r - 2);
    tag(L.menuBoard.x + L.menuBoard.w / 2, L.menuBoard.y - 6);
    tag(L.recipeShelf.x + L.recipeShelf.w / 2, L.recipeShelf.y - 2);
    tag(L.door.x + L.door.w / 2, L.door.y + 24);
    tag(WORLD_W / 2, L.floorTop + 40);
    tag(0, 0, () => ({ x: this.feet.x, y: this.feet.y - PLAYER_H - 2 }));
    tag(0, 0, () => ({ x: this.queue.line[0]?.x ?? -100, y: L.customerBaseY - CUSTOMER_H }));
  }

  // ── Input ─────────────────────────────────────────────────────────────────────────────

  private setPaused(paused: boolean): void {
    this.paused = paused;
    this.target = null;
    // Forget keys held when the tablet opened, so the player doesn't keep walking.
    this.input.keyboard!.resetKeys();
  }

  private useNearby(): void {
    if (this.paused || !this.near) return;
    this.bridge.emit('use', this.near.id);
  }

  private onPointer(pointer: Phaser.Input.Pointer): void {
    if (this.paused) return;
    const world = { x: pointer.worldX, y: pointer.worldY };
    // Clicked one of the things on the back wall?
    const hit = INTERACTABLES.find((item) => Math.abs(item.x - world.x) < 30 && world.y < TRUCK_LAYOUT.floorTop + 8);
    if (hit) {
      this.target = { point: standingSpot(hit), use: hit };
      return;
    }
    if (world.y >= TRUCK_LAYOUT.floorTop) this.target = { point: clampToFloor(world), use: null };
  }

  // ── Every frame ────────────────────────────────────────────────────────────────────────

  update(_time: number, deltaMs: number): void {
    // While an overlay is open, time stops (GAME_DESIGN.md §14.4).
    const seconds = this.paused ? 0 : Math.min(deltaMs / 1000, 0.1);
    this.walkClock += seconds;
    this.updatePlayer(seconds);
    this.updateCustomers(seconds);
    this.updatePrompt();
    for (const label of this.labels) {
      const follow = label.getData('follow') as (() => Point) | undefined;
      if (follow) label.setPosition(follow().x, follow().y);
    }
    const scrollX = Math.round(this.cameras.main.scrollX);
    if (scrollX !== this.lastScrollX) {
      this.lastScrollX = scrollX;
      this.bridge.emit('view', scrollX);
    }
  }

  private updatePlayer(seconds: number): void {
    const k = this.keys;
    let moving = false;
    if (!this.paused) {
      const dir = moveVector({
        up: k.up.isDown || k.w.isDown,
        down: k.down.isDown || k.s.isDown,
        left: k.left.isDown || k.a.isDown,
        right: k.right.isDown || k.d.isDown,
      });
      if (dir.x !== 0 || dir.y !== 0) {
        this.target = null; // keys cancel a click-walk
        this.feet = clampToFloor({
          x: this.feet.x + dir.x * PLAYER_SPEED * seconds,
          y: this.feet.y + dir.y * PLAYER_SPEED * seconds,
        });
        if (dir.x !== 0) this.facingLeft = dir.x < 0;
        moving = true;
      } else if (this.target) {
        const before = this.feet.x;
        const { at, arrived } = stepTowards(this.feet, this.target.point, seconds);
        this.feet = at;
        if (Math.abs(at.x - before) > 0.01) this.facingLeft = at.x < before;
        moving = !arrived;
        if (arrived) {
          const use = this.target.use;
          this.target = null;
          if (use) this.bridge.emit('use', use.id);
        }
      }
    }
    const frame = moving ? 1 + (Math.floor(this.walkClock / STEP_TIME) % 2) : 0;
    this.player.setPosition(Math.round(this.feet.x), Math.round(this.feet.y)).setFrame(frame).setFlipX(this.facingLeft);
    this.player.setDepth(DEPTH.player + (this.feet.y - FLOOR.minY) / 1000);
  }

  private updatePrompt(): void {
    this.near = this.paused ? null : nearestInteractable(this.feet);
    this.prompt.setVisible(this.near !== null);
    if (this.near) {
      const bounce = Math.round(Math.sin(this.time.now / 180) * 1.5);
      this.prompt.setPosition(this.near.x, this.near.promptY + bounce);
    }
  }

  private updateCustomers(seconds: number): void {
    this.sinceArrival += seconds;
    if (!this.paused && this.nextOrder < PROTOTYPE_ORDERS.length && this.sinceArrival >= ARRIVAL_GAP && this.queue.canJoin()) {
      const order = PROTOTYPE_ORDERS[this.nextOrder++];
      const customer = this.queue.join(order.id);
      if (customer) {
        this.sinceArrival = 0;
        const sprite = this.add.image(0, 0, `customer-${order.look}`, 0).setOrigin(0.5, 1).setDepth(DEPTH.customers);
        this.customers.set(customer, sprite);
      }
    }

    for (const gone of this.queue.update(seconds)) {
      this.customers.get(gone)?.destroy();
      this.customers.delete(gone);
    }

    const stepFrame = Math.floor(this.walkClock / (STEP_TIME * 1.5)) % 2;
    for (const [customer, sprite] of this.customers) {
      sprite.setPosition(Math.round(customer.x), TRUCK_LAYOUT.customerBaseY);
      sprite.setFrame(customer.state === 'waiting' ? 0 : stepFrame);
    }

    const front = this.queue.front();
    const frontId = front?.orderId ?? null;
    if (frontId !== this.frontOrderId) {
      this.frontOrderId = frontId;
      this.bridge.emit(
        'front',
        front ? { orderId: front.orderId, x: front.x, y: TRUCK_LAYOUT.customerBaseY - CUSTOMER_H + 8 } : null,
      );
    }
  }
}
