import Phaser from 'phaser';
import { PROTOTYPE_ORDERS, type CustomerLook } from '../../sql-core/truck/orders';
import { CUSTOMER_FRAMES, CUSTOMER_H, CUSTOMER_W, LOOKS, paintCustomerSheet } from './customerArt';
import { TruckQueue, type QueueCustomer } from './queue';
import type { TruckBridge } from './truckBridge';
import { paintClock, paintInterior, paintOutside, TRUCK_H, TRUCK_LAYOUT, TRUCK_W } from './truckArt';

/** Where customers' feet are: on the sidewalk, just behind the counter. */
const FEET_Y = TRUCK_LAYOUT.counterY - 4;
/** Seconds between customers arriving. */
const ARRIVAL_GAP = 3;
/** Seconds per walking frame. */
const STEP_TIME = 0.22;

/**
 * Food truck v2 (GAME_DESIGN.md §14). Three layers: the street, the customers, and the inside of
 * the truck with a see-through window. 4.2: customers arrive, queue and order.
 */
export class TruckScene extends Phaser.Scene {
  private bridge!: TruckBridge;
  private queue = new TruckQueue();
  private sprites = new Map<QueueCustomer, Phaser.GameObjects.Image>();
  private nextOrder = 0;
  private sinceArrival = ARRIVAL_GAP;
  private frontOrderId: string | null = null;
  private walkClock = 0;

  constructor() {
    super('truck');
  }

  create(): void {
    this.bridge = this.registry.get('bridge') as TruckBridge;
    this.queue = new TruckQueue();
    this.sprites.clear();
    this.nextOrder = 0;
    this.frontOrderId = null;

    this.layer('truck-outside', paintOutside).setDepth(0);
    this.layer('truck-interior', (ctx) => {
      paintInterior(ctx);
      paintClock(ctx, 10, 0);
    }).setDepth(2);
    for (const look of Object.keys(LOOKS) as CustomerLook[]) this.makeCustomerTexture(look);

    const off = this.bridge.on('serve', () => this.queue.serveFront());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  }

  private layer(key: string, paint: (ctx: CanvasRenderingContext2D) => void): Phaser.GameObjects.Image {
    const texture = this.textures.exists(key) ? null : this.textures.createCanvas(key, TRUCK_W, TRUCK_H);
    if (texture) {
      paint(texture.getContext());
      texture.refresh();
    }
    return this.add.image(0, 0, key).setOrigin(0, 0);
  }

  private makeCustomerTexture(look: CustomerLook): void {
    const key = `customer-${look}`;
    if (this.textures.exists(key)) return;
    const texture = this.textures.createCanvas(key, CUSTOMER_W * CUSTOMER_FRAMES, CUSTOMER_H);
    if (!texture) return;
    paintCustomerSheet(texture.getContext(), look);
    texture.refresh();
    for (let f = 0; f < CUSTOMER_FRAMES; f++) texture.add(f, 0, f * CUSTOMER_W, 0, CUSTOMER_W, CUSTOMER_H);
  }

  update(_time: number, deltaMs: number): void {
    const seconds = Math.min(deltaMs / 1000, 0.1);
    this.walkClock += seconds;

    // New customers arrive while there are orders left.
    this.sinceArrival += seconds;
    if (this.nextOrder < PROTOTYPE_ORDERS.length && this.sinceArrival >= ARRIVAL_GAP && this.queue.canJoin()) {
      const order = PROTOTYPE_ORDERS[this.nextOrder++];
      const customer = this.queue.join(order.id);
      if (customer) {
        this.sinceArrival = 0;
        const sprite = this.add.image(0, 0, `customer-${order.look}`, 0).setOrigin(0.5, 1).setDepth(1);
        this.sprites.set(customer, sprite);
      }
    }

    for (const gone of this.queue.update(seconds)) {
      this.sprites.get(gone)?.destroy();
      this.sprites.delete(gone);
    }

    const stepFrame = Math.floor(this.walkClock / STEP_TIME) % 2;
    for (const [customer, sprite] of this.sprites) {
      sprite.setPosition(Math.round(customer.x), FEET_Y);
      sprite.setFrame(customer.state === 'waiting' ? 0 : stepFrame);
    }

    // Tell the app who is ordering.
    const front = this.queue.front();
    const frontId = front?.orderId ?? null;
    if (frontId !== this.frontOrderId) {
      this.frontOrderId = frontId;
      this.bridge.emit('front', front ? { orderId: front.orderId, x: front.x, y: FEET_Y - CUSTOMER_H } : null);
    }
  }
}
