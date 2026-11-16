/**
 * The line of customers outside the serving window (GAME_DESIGN.md §14.4). Pure logic in scene
 * pixels, so it can be tested without Phaser.
 *
 * Customers walk in from the left, take the next free spot and shuffle forward when the person in
 * front is served. Spot 0 is at the window; it is the only customer who orders.
 */
export const QUEUE = {
  /** Where customers appear (hidden behind the truck wall, left of the window). */
  enterX: -20,
  /** Where served customers walk off to (right side of the window, behind the frame). */
  exitX: 360,
  /** Spot 0 (the window) and the gap between spots. */
  frontX: 214,
  gap: 46,
  /** At most this many people wait at once. */
  maxWaiting: 4,
  /** Walking speed in pixels per second. */
  speed: 48,
} as const;

export type QueueCustomer = {
  orderId: string;
  x: number;
  state: 'walking' | 'waiting' | 'leaving';
};

export function spotX(spot: number): number {
  return QUEUE.frontX - spot * QUEUE.gap;
}

export class TruckQueue {
  /** In line order (index = spot), followed by nobody: leaving customers are kept apart. */
  readonly line: QueueCustomer[] = [];
  readonly leaving: QueueCustomer[] = [];

  /** Room in the line, and the last person has walked far enough in to make space. */
  canJoin(): boolean {
    const last = this.line[this.line.length - 1];
    return this.line.length < QUEUE.maxWaiting && (!last || last.x - QUEUE.enterX >= QUEUE.gap);
  }

  join(orderId: string): QueueCustomer | null {
    if (!this.canJoin()) return null;
    const customer: QueueCustomer = { orderId, x: QUEUE.enterX, state: 'walking' };
    this.line.push(customer);
    return customer;
  }

  /** The customer at the window, once they have arrived there. */
  front(): QueueCustomer | null {
    const first = this.line[0];
    return first && first.state === 'waiting' && first.x === spotX(0) ? first : null;
  }

  /** The front customer leaves; everyone behind steps forward. */
  serveFront(): QueueCustomer | null {
    const served = this.front();
    if (!served) return null;
    this.line.shift();
    served.state = 'leaving';
    this.leaving.push(served);
    return served;
  }

  /** Moves everyone; returns customers who walked out of sight this step. */
  update(seconds: number): QueueCustomer[] {
    const step = QUEUE.speed * seconds;
    this.line.forEach((c, spot) => {
      const target = spotX(spot);
      // Never walk into the person ahead.
      const ahead = this.line[spot - 1];
      const limit = ahead ? Math.min(target, ahead.x - QUEUE.gap) : target;
      if (c.x < limit) c.x = Math.min(limit, c.x + step);
      c.state = c.x >= limit ? 'waiting' : 'walking';
    });
    const gone: QueueCustomer[] = [];
    for (const c of [...this.leaving]) {
      c.x = Math.min(QUEUE.exitX, c.x + step);
      if (c.x >= QUEUE.exitX) {
        this.leaving.splice(this.leaving.indexOf(c), 1);
        gone.push(c);
      }
    }
    return gone;
  }
}
