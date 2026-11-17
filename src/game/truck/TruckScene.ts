import Phaser from 'phaser';
import { PROTOTYPE_ORDERS, type CustomerLook } from '../../sql-core/truck/orders';
import { CUSTOMER_FRAMES, CUSTOMER_SIZES, LOOKS, paintCustomerSheet, type Distance } from './customerArt';
import { TruckQueue, type QueueCustomer } from './queue';
import type { TruckBridge } from './truckBridge';
import {
  CLOCK,
  OUTSIDE_PARALLAX,
  OUTSIDE_W,
  OUTSIDE_X,
  paintClock,
  paintInterior,
  paintPark,
  START_PANEL,
  TRUCK_H,
  TRUCK_LAYOUT,
  WORLD_W,
} from './truckArt';
import {
  centreInteractable,
  clampPanel,
  facingPanel,
  interactableAt,
  panelScroll,
  queueSpot,
  type Interactable,
} from './truckWorld';

/** Seconds between customers arriving. */
const ARRIVAL_GAP = 3;
/** Seconds per walking frame. */
const STEP_TIME = 0.24;
/** How long turning to the next side takes (ms). */
const TURN_MS = 380;

const DISTANCES: Distance[] = ['far', 'mid', 'near'];
/** Depths, back to front. */
const DEPTH = { park: 0, customers: 1, interior: 2, highlight: 3, labels: 4 } as const;

/**
 * Food truck v2 (GAME_DESIGN.md §14.8), first person: the player stands in the truck and turns
 * between four sides (A/D, ←/→, or the ‹ › buttons). Things are highlighted under the cursor and
 * used with a click, or with E for the thing in the middle of the view.
 * Layers: the park (parallax), customers, the inside of the truck (window see-through).
 */
export class TruckScene extends Phaser.Scene {
  private bridge!: TruckBridge;
  private queue = new TruckQueue();
  private customers = new Map<QueueCustomer, { sprite: Phaser.GameObjects.Image; look: CustomerLook }>();
  private nextOrder = 0;
  private sinceArrival = ARRIVAL_GAP;
  private frontOrderId: string | null = null;
  private walkClock = 0;
  private paused = false;

  private panel = START_PANEL;
  private turning: Phaser.Tweens.Tween | null = null;
  private highlight!: Phaser.GameObjects.Graphics;
  private hovered: Interactable | null = null;
  private labels: { text: Phaser.GameObjects.Text; follow?: () => { x: number; y: number } }[] = [];
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
    this.panel = START_PANEL;
    this.turning = null;
    this.hovered = null;
    this.labels = [];
    this.lastScrollX = -1;

    // Layers.
    this.layer('truck-park', OUTSIDE_W, paintPark)
      .setPosition(OUTSIDE_X, 0)
      .setDepth(DEPTH.park)
      .setScrollFactor(OUTSIDE_PARALLAX, 1);
    this.layer('truck-interior', WORLD_W, (ctx) => {
      paintInterior(ctx);
      paintClock(ctx, 10, 0);
    }).setDepth(DEPTH.interior);
    for (const look of Object.keys(LOOKS) as CustomerLook[]) {
      for (const distance of DISTANCES) {
        const { w, h } = CUSTOMER_SIZES[distance];
        this.sheet(`customer-${look}-${distance}`, w, h, (ctx) => paintCustomerSheet(ctx, look, distance));
      }
    }

    // The camera faces one side at a time.
    this.cameras.main.setBounds(0, 0, WORLD_W, TRUCK_H);
    this.cameras.main.scrollX = panelScroll(this.panel);

    this.highlight = this.add.graphics().setDepth(DEPTH.highlight);

    const keyboard = this.input.keyboard!;
    for (const key of ['A', 'LEFT']) keyboard.on(`keydown-${key}`, () => this.look(-1));
    for (const key of ['D', 'RIGHT']) keyboard.on(`keydown-${key}`, () => this.look(1));
    keyboard.on('keydown-E', () => {
      const item = this.paused ? null : centreInteractable(this.panel);
      if (item) this.bridge.emit('use', item.id);
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.hover(p));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.paused) return;
      const item = interactableAt(p.worldX, p.worldY);
      if (item) this.bridge.emit('use', item.id);
    });

    this.makeLabels();

    const offs = [
      this.bridge.on('serve', () => this.queue.serveFront()),
      this.bridge.on('pause', (paused) => this.setPaused(paused)),
      this.bridge.on('look', (dir) => this.look(dir)),
      this.bridge.on('artLabels', (show) => this.labels.forEach((l) => l.text.setVisible(show))),
    ];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => offs.forEach((off) => off()));
    this.bridge.emit('panel', this.panel);
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

  private sheet(key: string, w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void): void {
    if (this.textures.exists(key)) return;
    const texture = this.textures.createCanvas(key, w * CUSTOMER_FRAMES, h);
    if (!texture) return;
    paint(texture.getContext());
    texture.refresh();
    for (let f = 0; f < CUSTOMER_FRAMES; f++) texture.add(f, 0, f * w, 0, w, h);
  }

  /** "PLACEHOLDER" tags over every drawing that is not final art yet (hidden until toggled). */
  private makeLabels(): void {
    const tag = (x: number, y: number, follow?: () => { x: number; y: number }) => {
      const text = this.add
        .text(x, y, 'PLACEHOLDER', {
          fontFamily: 'monospace',
          fontSize: '8px',
          color: '#fffaf0',
          backgroundColor: '#e4573d',
          padding: { x: 2, y: 1 },
        })
        .setOrigin(0.5, 0)
        .setResolution(4)
        .setDepth(DEPTH.labels)
        .setVisible(false);
      this.labels.push({ text, follow });
    };
    const L = TRUCK_LAYOUT;
    const top = (b: { x: number; y: number; w: number }) => tag(b.x + b.w / 2, b.y + 2);
    top(L.fridge);
    top(L.stockShelves);
    top(L.tablet);
    top(L.coffeeMachine);
    top(L.menuBoard);
    top(L.recipeShelf);
    top(L.door);
    tag(CLOCK.cx, CLOCK.cy + CLOCK.r + 2);
    tag(L.window.x + 70, L.window.y + 14);
    tag(0, 0, () => {
      const first = this.queue.line[0];
      const spot = first ? queueSpot(first.x) : { x: -500, baseY: 0, distance: 'far' as Distance };
      return { x: spot.x, y: spot.baseY - CUSTOMER_SIZES[spot.distance].h + 4 };
    });
  }

  // ── Looking around ────────────────────────────────────────────────────────────────────

  private look(dir: number): void {
    if (this.paused) return;
    const next = clampPanel(this.panel + dir);
    if (next === this.panel) return;
    this.panel = next;
    this.turning?.stop();
    this.turning = this.tweens.add({
      targets: this.cameras.main,
      scrollX: panelScroll(next),
      duration: TURN_MS,
      ease: 'Cubic.easeInOut',
      onComplete: () => (this.turning = null),
    });
    this.bridge.emit('panel', next);
    this.setHovered(null);
  }

  private hover(p: Phaser.Input.Pointer): void {
    if (this.paused || this.turning) return this.setHovered(null);
    this.setHovered(interactableAt(p.worldX, p.worldY));
  }

  private setHovered(item: Interactable | null): void {
    if (item?.id === this.hovered?.id) return;
    this.hovered = item;
    this.highlight.clear();
    this.input.setDefaultCursor(item ? 'pointer' : 'default');
    if (item) {
      // A mustard "marker" outline with a mis-printed red copy, in the riso style.
      const { x, y, w, h } = item.area;
      this.highlight.lineStyle(2, 0xe4573d).strokeRect(x - 2, y - 2, w + 4, h + 4);
      this.highlight.lineStyle(2, 0xf2b234).strokeRect(x - 3, y - 3, w + 4, h + 4);
    }
    this.bridge.emit('hover', item?.id ?? null);
  }

  private setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.setHovered(null);
    this.input.keyboard!.enabled = !paused;
    this.input.keyboard!.resetKeys();
  }

  // ── Every frame ────────────────────────────────────────────────────────────────────────

  update(_time: number, deltaMs: number): void {
    // While an overlay is open, time stops (GAME_DESIGN.md §14.4).
    const seconds = this.paused ? 0 : Math.min(deltaMs / 1000, 0.1);
    this.walkClock += seconds;
    this.updateCustomers(seconds);
    for (const { text, follow } of this.labels) if (follow) text.setPosition(follow().x, follow().y);
    const scrollX = Math.round(this.cameras.main.scrollX);
    if (scrollX !== this.lastScrollX) {
      this.lastScrollX = scrollX;
      this.bridge.emit('view', scrollX);
      if (!this.turning) this.panel = facingPanel(scrollX);
    }
  }

  private updateCustomers(seconds: number): void {
    this.sinceArrival += seconds;
    if (!this.paused && this.nextOrder < PROTOTYPE_ORDERS.length && this.sinceArrival >= ARRIVAL_GAP && this.queue.canJoin()) {
      const order = PROTOTYPE_ORDERS[this.nextOrder++];
      const customer = this.queue.join(order.id);
      if (customer) {
        this.sinceArrival = 0;
        const sprite = this.add.image(0, 0, `customer-${order.look}-far`, 0).setOrigin(0.5, 1);
        this.customers.set(customer, { sprite, look: order.look });
      }
    }

    for (const gone of this.queue.update(seconds)) {
      this.customers.get(gone)?.sprite.destroy();
      this.customers.delete(gone);
    }

    const stepFrame = Math.floor(this.walkClock / STEP_TIME) % 2;
    for (const [customer, { sprite, look }] of this.customers) {
      const spot = queueSpot(customer.x);
      const key = `customer-${look}-${spot.distance}`;
      if (sprite.texture.key !== key) sprite.setTexture(key);
      // Nearer people are drawn in front of those further back.
      sprite
        .setPosition(Math.round(spot.x), Math.round(spot.baseY))
        .setFrame(customer.state === 'waiting' ? 0 : stepFrame)
        .setDepth(DEPTH.customers + spot.baseY / 10000);
    }

    const front = this.queue.front();
    const frontId = front?.orderId ?? null;
    if (frontId !== this.frontOrderId) {
      this.frontOrderId = frontId;
      if (front) {
        const spot = queueSpot(front.x);
        this.bridge.emit('front', { orderId: front.orderId, x: spot.x, y: spot.baseY - CUSTOMER_SIZES.near.h + 18 });
      } else {
        this.bridge.emit('front', null);
      }
    }
  }
}
