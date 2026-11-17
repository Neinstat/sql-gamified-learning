/**
 * The food truck (GAME_DESIGN.md §14.8), first person in 3D:
 * WASD to walk inside the truck, the mouse to look (pointer lock; dragging also works), and E or a
 * click to use what the crosshair is on. Talks to React only through the TruckBridge.
 */
import * as THREE from 'three';
import { PROTOTYPE_ORDERS, type CustomerLook } from '../../sql-core/truck/orders';
import { inkColour } from './colour';
import type { LensCard, TruckBridge } from './bridge';
import { TruckQueue, type QueueCustomer } from './queue';
import { buildCustomer, buildPark, buildTruck, type CustomerModel } from './build';
import { RisoPass } from './risoPass';
import {
  aimedInteractable,
  EYE_Y,
  FACING_TRUCK,
  GROUND_Y,
  LENS_SPOTS,
  lensPoint,
  lookDirection,
  queuePosition,
  START,
  walkStep,
  type InteractableId,
} from './world';

/** Seconds between customers arriving. */
const ARRIVAL_GAP = 3;
/** About this many screen pixels per scene pixel: big riso pixels, light on the GPU. */
const TARGET_LINES = 300;
const MOUSE_SENSITIVITY = 0.0024;
const MAX_PITCH = 1.25;
/** Seconds for the Data Lens to dissolve in or out. */
const LENS_SECONDS = 0.45;
/** Cards further away than this (m) are hidden: the truck is small, the park is not. */
const LENS_MAX_DISTANCE = 6;

export class TruckGame {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.05, 120);
  private readonly riso = new RisoPass();
  private readonly observer: ResizeObserver;
  private readonly offs: (() => void)[] = [];
  private frame = 0;
  private last = 0;
  private destroyed = false;

  private yaw: number = START.yaw;
  private pitch = -0.12;
  private at = { x: START.x as number, z: START.z as number };
  private keys = { forward: false, back: false, left: false, right: false };
  private dragging = false;
  private paused = false;
  private aimed: InteractableId | null = null;

  private queue = new TruckQueue();
  private customers = new Map<QueueCustomer, CustomerModel>();
  private nextOrder = 0;
  private sinceArrival = ARRIVAL_GAP;
  private frontOrderId: string | null = null;
  private lastAnchor = '';
  private walkClock = 0;
  private lensOn = false;
  private lensAmount = 0;
  private lastCards = '';

  constructor(
    private readonly parent: HTMLElement,
    private readonly bridge: TruckBridge,
  ) {
    // Colours are used exactly as written (colour.ts); no conversion on output either.
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setPixelRatio(1);
    this.renderer.domElement.className = 'truck-canvas';
    parent.appendChild(this.renderer.domElement);

    this.scene.background = inkColour('peach');
    this.scene.fog = new THREE.Fog(inkColour('lilac'), 18, 80);
    // Neutral light so every ink keeps its own colour; shading then dithers towards darker inks.
    // (Three.js lights are physical: × π gives a surface its own colour at full light.)
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8 * Math.PI));
    const sun = new THREE.DirectionalLight(0xffffff, 0.4 * Math.PI);
    sun.position.set(-4, 9, -6);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.15 * Math.PI);
    fill.position.set(3, 4, 8);
    this.scene.add(fill);
    this.scene.add(buildTruck(), buildPark());

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(parent);
    this.resize();
    this.bindInput();

    this.offs.push(
      bridge.on('serve', () => this.queue.serveFront()),
      bridge.on('pause', (paused) => this.setPaused(paused)),
      bridge.on('lens', (on) => (this.lensOn = on)),
    );
    this.loop(performance.now());
  }

  // ── Setup ────────────────────────────────────────────────────────────────────────────

  private resize(): void {
    const w = Math.max(1, this.parent.clientWidth);
    const h = Math.max(1, this.parent.clientHeight);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const scale = Math.max(1, Math.round(h / TARGET_LINES));
    this.riso.setSize(Math.ceil(w / scale), Math.ceil(h / scale));
  }

  private bindInput(): void {
    const canvas = this.renderer.domElement;
    const keyMap: Record<string, keyof TruckGame['keys']> = {
      KeyW: 'forward',
      ArrowUp: 'forward',
      KeyS: 'back',
      ArrowDown: 'back',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
    };
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      if (this.paused) return;
      const key = keyMap[e.code];
      if (key) {
        this.keys[key] = down;
        e.preventDefault();
      } else if (down && e.code === 'KeyE') {
        this.use();
      } else if (down && e.code === 'KeyL' && !e.repeat) {
        this.bridge.emit('lensKey', true);
      }
    };
    const keydown = onKey(true);
    const keyup = onKey(false);
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);

    const onMove = (e: MouseEvent) => {
      if (this.paused) return;
      if (document.pointerLockElement === canvas || this.dragging) {
        this.yaw -= e.movementX * MOUSE_SENSITIVITY;
        this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch - e.movementY * MOUSE_SENSITIVITY));
      }
    };
    const onDown = (e: MouseEvent) => {
      if (this.paused) return;
      if (document.pointerLockElement === canvas) {
        this.use();
        return;
      }
      // First click captures the mouse; until then, dragging looks around too.
      this.dragging = true;
      canvas.requestPointerLock?.();
      e.preventDefault();
    };
    const onUp = () => (this.dragging = false);
    const onLockChange = () => this.bridge.emit('locked', document.pointerLockElement === canvas);
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    document.addEventListener('pointerlockchange', onLockChange);
    this.offs.push(() => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      canvas.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('pointerlockchange', onLockChange);
    });
  }

  private setPaused(paused: boolean): void {
    this.paused = paused;
    this.keys = { forward: false, back: false, left: false, right: false };
    this.dragging = false;
    if (paused && document.pointerLockElement) document.exitPointerLock();
  }

  private use(): void {
    if (!this.paused && this.aimed) this.bridge.emit('use', this.aimed);
  }

  // ── Every frame ──────────────────────────────────────────────────────────────────────

  private loop = (now: number): void => {
    if (this.destroyed) return;
    const seconds = Math.min((now - this.last) / 1000, 0.1);
    this.last = now;
    this.step(seconds);
    this.frame = requestAnimationFrame(this.loop);
  };

  /** One frame (also used by tests in the browser to move time forward). */
  step(seconds: number): void {
    const dt = this.paused ? 0 : seconds;
    this.at = walkStep(this.at, this.yaw, this.keys, dt);
    // A gentle head bob while walking.
    const moving = Object.values(this.keys).some(Boolean) && dt > 0;
    this.walkClock += dt;
    const bob = moving ? Math.sin(this.walkClock * 9) * 0.025 : 0;
    this.camera.position.set(this.at.x, EYE_Y + bob, this.at.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    const eye = { x: this.at.x, y: EYE_Y, z: this.at.z };
    const aimed = this.paused ? null : aimedInteractable(eye, lookDirection(this.yaw, this.pitch));
    if (aimed !== this.aimed) {
      this.aimed = aimed;
      this.bridge.emit('hover', aimed);
    }

    this.updateCustomers(dt);
    // The lens dissolves in and out even while time is stopped (it is part of the interface).
    const lensStep = seconds / LENS_SECONDS;
    this.lensAmount = Math.min(1, Math.max(0, this.lensAmount + (this.lensOn ? lensStep : -lensStep)));
    this.riso.setLens(this.lensAmount);
    this.riso.render(this.renderer, this.scene, this.camera);
    this.emitAnchor();
    this.emitLensCards();
  }

  private updateCustomers(seconds: number): void {
    this.sinceArrival += seconds;
    if (this.nextOrder < PROTOTYPE_ORDERS.length && this.sinceArrival >= ARRIVAL_GAP && this.queue.canJoin() && seconds > 0) {
      const order = PROTOTYPE_ORDERS[this.nextOrder++];
      const customer = this.queue.join(order.id);
      if (customer) {
        this.sinceArrival = 0;
        const model = buildCustomer(order.look as CustomerLook);
        this.scene.add(model.root);
        this.customers.set(customer, model);
      }
    }
    for (const gone of this.queue.update(seconds)) {
      const model = this.customers.get(gone);
      if (model) this.scene.remove(model.root);
      this.customers.delete(gone);
    }
    for (const [customer, model] of this.customers) {
      const p = queuePosition(customer.x);
      const walking = customer.state !== 'waiting';
      model.root.position.set(p.x, GROUND_Y, p.z);
      // Turn smoothly towards where they walk, or towards the truck while waiting.
      const target = walking ? p.yaw : FACING_TRUCK;
      const diff = Math.atan2(Math.sin(target - model.root.rotation.y), Math.cos(target - model.root.rotation.y));
      model.root.rotation.y += diff * Math.min(1, seconds * 8);
      const swing = walking ? Math.sin(this.walkClock * 8 + p.x) * 0.55 : 0;
      model.legs[0].rotation.x = swing;
      model.legs[1].rotation.x = -swing;
      model.arms[0].rotation.x = -swing * 0.8;
      model.arms[1].rotation.x = swing * 0.8;
    }

    const front = this.queue.front();
    const frontId = front?.orderId ?? null;
    if (frontId !== this.frontOrderId) {
      this.frontOrderId = frontId;
      this.bridge.emit('front', front ? { orderId: front.orderId } : null);
    }
  }

  /** Where the front customer's head is on screen, for the speech bubble. */
  private emitAnchor(): void {
    const front = this.queue.front();
    let anchor: { x: number; y: number } | null = null;
    if (front) {
      const p = queuePosition(front.x);
      const head = new THREE.Vector3(p.x, GROUND_Y + 1.95, p.z).project(this.camera);
      if (head.z < 1 && Math.abs(head.x) < 1.1 && Math.abs(head.y) < 1.1) {
        anchor = { x: (head.x + 1) / 2, y: (1 - head.y) / 2 };
      }
    }
    const key = anchor ? `${anchor.x.toFixed(3)},${anchor.y.toFixed(3)}` : '';
    if (key !== this.lastAnchor) {
      this.lastAnchor = key;
      this.bridge.emit('anchor', anchor);
    }
  }

  /** Where each table's card is on screen while the Data Lens is (mostly) on. */
  private emitLensCards(): void {
    const cards: LensCard[] = [];
    if (this.lensAmount > 0.5) {
      const place = (id: string, tables: string[], point: THREE.Vector3) => {
        const distance = point.distanceTo(this.camera.position);
        const p = point.clone().project(this.camera);
        if (distance <= LENS_MAX_DISTANCE && p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1) {
          cards.push({ id, tables, x: (p.x + 1) / 2, y: (1 - p.y) / 2, distance });
        }
      };
      for (const spot of LENS_SPOTS) {
        const at = lensPoint(spot.box);
        place(spot.id, spot.tables, new THREE.Vector3(at.x, at.y, at.z));
      }
      const front = this.queue.front();
      if (front) {
        const p = queuePosition(front.x);
        place('customer', ['customers'], new THREE.Vector3(p.x - 0.55, GROUND_Y + 1.6, p.z));
      }
    }
    const key = cards.map((c) => `${c.id}:${c.x.toFixed(3)},${c.y.toFixed(3)}`).join('|');
    if (key !== this.lastCards) {
      this.lastCards = key;
      this.bridge.emit('lensCards', cards);
    }
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.offs.forEach((off) => off());
    if (document.pointerLockElement) document.exitPointerLock();
    this.riso.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
