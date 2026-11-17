/**
 * Low-poly models for the food truck, built from boxes, cylinders and spheres in the
 * riso inks. ⚠ PLACEHOLDER models (docs/ASSETS.md): to be replaced by CC0 3D packs later.
 */
import * as THREE from 'three';
import type { Ink } from '../art/riso';
import { inkColour } from './colour';
import type { CustomerLook } from '../../sql-core/truck/orders';
import { LOOKS } from './looks';
import { CLOCK3D, GROUND_Y, LAYOUT, QUEUE_PATH_3D, TRUCK, type Box3 } from './world';

const materials = new Map<Ink, THREE.MeshLambertMaterial>();
export function mat(ink: Ink): THREE.MeshLambertMaterial {
  let m = materials.get(ink);
  if (!m) materials.set(ink, (m = new THREE.MeshLambertMaterial({ color: inkColour(ink) })));
  return m;
}

/** A box from min/max corners. */
function block(parent: THREE.Object3D, ink: Ink, b: Box3 | [number, number, number, number, number, number]): THREE.Mesh {
  const [x1, y1, z1, x2, y2, z2] = Array.isArray(b) ? b : [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(x2 - x1), Math.abs(y2 - y1), Math.abs(z2 - z1)), mat(ink));
  mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
  parent.add(mesh);
  return mesh;
}

const HX = TRUCK.length / 2;
const HZ = TRUCK.depth / 2;
const H = TRUCK.height;
const T = 0.08; // wall thickness

// ── The truck ─────────────────────────────────────────────────────────────────────────

export function buildTruck(): THREE.Group {
  const g = new THREE.Group();
  const w = LAYOUT.window;

  // Floor and ceiling.
  block(g, 'wood', [-HX, -0.1, -HZ, HX, 0, HZ]);
  for (let x = -HX + 0.4; x < HX; x += 0.4) block(g, 'woodDark', [x, 0, -HZ, x + 0.02, 0.003, HZ]);
  block(g, 'inkSoft', [-HX, H, -HZ, HX, H + 0.1, HZ]);
  for (let x = -2; x <= 2; x += 2) block(g, 'mustard', [x - 0.3, H - 0.04, -0.1, x + 0.3, H, 0.1]);

  // Front wall with the serving window cut out.
  block(g, 'paper', [-HX, 0, -HZ - T, w.min.x, H, -HZ]);
  block(g, 'paper', [w.max.x, 0, -HZ - T, HX, H, -HZ]);
  block(g, 'paper', [w.min.x, w.max.y, -HZ - T, w.max.x, H, -HZ]);
  block(g, 'teal', [w.min.x, 0, -HZ - T, w.max.x, w.min.y, -HZ]);
  // Window frame and rolled-up shutter.
  block(g, 'ink', [w.min.x - 0.05, w.max.y, -HZ - 0.02, w.max.x + 0.05, w.max.y + 0.12, -HZ + 0.02]);
  block(g, 'ink', [w.min.x - 0.05, w.min.y, -HZ - 0.02, w.min.x, w.max.y, -HZ + 0.02]);
  block(g, 'ink', [w.max.x, w.min.y, -HZ - 0.02, w.max.x + 0.05, w.max.y, -HZ + 0.02]);

  // Back and end walls: paper above, a teal band below. The right end wall has the back door's
  // opening cut out, so the park shows when the door swings open.
  const dr = LAYOUT.door;
  for (const [x1, z1, x2, z2] of [
    [-HX, HZ, HX, HZ + T],
    [-HX - T, -HZ, -HX, HZ],
    [HX, -HZ, HX + T, dr.min.z],
    [HX, dr.max.z, HX + T, HZ],
  ] as const) {
    block(g, 'paper', [x1, 0.9, z1, x2, H, z2]);
    block(g, 'teal', [x1, 0, z1, x2, 0.9, z2]);
  }
  block(g, 'paper', [HX, dr.max.y, dr.min.z, HX + T, H, dr.max.z]);
  // A metal step outside the door, where the Manager stands.
  block(g, 'inkSoft', [HX + T, -0.08, -0.55, HX + 0.75, 0, 0.55]);

  // Front counter (under the window) with a white top.
  const fc = LAYOUT.frontCounter;
  block(g, 'wood', [fc.min.x, 0, fc.min.z, fc.max.x, fc.max.y - 0.04, fc.max.z]);
  block(g, 'white', [fc.min.x - 0.02, fc.max.y - 0.04, fc.min.z - 0.05, fc.max.x + 0.02, fc.max.y, fc.max.z + 0.03]);
  for (let x = fc.min.x + 0.1; x < fc.max.x - 0.5; x += 0.6) block(g, 'woodDark', [x, 0.12, fc.max.z, x + 0.5, 0.8, fc.max.z + 0.01]);

  // Tablet (POS) on a stand, tilted towards the player.
  const t = LAYOUT.tablet;
  block(g, 'ink', [t.min.x + 0.15, t.min.y, t.min.z + 0.06, t.max.x - 0.15, t.min.y + 0.08, t.max.z - 0.06]);
  const tablet = new THREE.Group();
  block(tablet, 'ink', [-0.18, -0.12, -0.012, 0.18, 0.12, 0.012]);
  block(tablet, 'tealDark', [-0.16, -0.1, 0.012, 0.16, 0.1, 0.016]);
  block(tablet, 'mustard', [-0.13, 0.05, 0.016, -0.02, 0.065, 0.018]);
  block(tablet, 'tealLight', [-0.13, 0.02, 0.016, 0.1, 0.03, 0.018]);
  block(tablet, 'tealLight', [-0.13, -0.01, 0.016, 0.06, 0.0, 0.018]);
  tablet.position.set((t.min.x + t.max.x) / 2, t.min.y + 0.14, (t.min.z + t.max.z) / 2);
  tablet.rotation.x = -0.5;
  g.add(tablet);

  // Tip jar and a potted plant.
  const j = LAYOUT.tipJar;
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 10), mat('tealLight'));
  jar.position.set((j.min.x + j.max.x) / 2, 1.1, (j.min.z + j.max.z) / 2);
  g.add(jar);
  block(g, 'mustard', [jar.position.x - 0.06, 1.0, jar.position.z - 0.06, jar.position.x + 0.06, 1.08, jar.position.z + 0.06]);
  block(g, 'red', [-0.55, 1.0, -HZ + 0.15, -0.4, 1.12, -HZ + 0.3]);
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 0), mat('grassDark'));
  leaves.position.set(-0.475, 1.2, -HZ + 0.225);
  g.add(leaves);

  // Fridge full of bottles.
  const f = LAYOUT.fridge;
  block(g, 'tealLight', f);
  block(g, 'white', [f.max.x, 0.15, f.min.z + 0.05, f.max.x + 0.01, 1.85, f.max.z - 0.05]);
  const inks: Ink[] = ['white', 'mustard', 'pink', 'red', 'teal', 'white'];
  for (let shelf = 0; shelf < 4; shelf++) {
    const y = 0.3 + shelf * 0.4;
    block(g, 'inkSoft', [f.max.x + 0.01, y - 0.02, f.min.z + 0.08, f.max.x + 0.05, y, f.max.z - 0.08]);
    for (let i = 0; i < 6; i++) {
      const z = f.min.z + 0.14 + i * 0.1;
      block(g, inks[(i + shelf) % inks.length], [f.max.x + 0.01, y, z, f.max.x + 0.07, y + 0.22 + (i % 2) * 0.04, z + 0.07]);
    }
  }
  block(g, 'mustard', [f.max.x + 0.01, 1.0, f.max.z - 0.06, f.max.x + 0.05, 1.5, f.max.z - 0.03]);

  // Stock shelves with boxes and coffee sacks.
  const s = LAYOUT.stockShelves;
  for (let shelf = 0; shelf < 3; shelf++) {
    const y = 0.35 + shelf * 0.6;
    block(g, 'woodDark', [s.min.x, y - 0.04, s.min.z, s.max.x, y, s.max.z]);
    for (let i = 0; i < 3; i++) {
      const z = s.min.z + 0.08 + i * 0.36;
      if ((i + shelf) % 3 === 2) {
        const sack = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), mat('wood'));
        sack.scale.set(1.1, 1.3, 1);
        sack.position.set(s.min.x + 0.28, y + 0.18, z + 0.15);
        g.add(sack);
      } else {
        block(g, 'mustard', [s.min.x + 0.08, y, z, s.max.x - 0.04, y + 0.3 + (i % 2) * 0.08, z + 0.3]);
      }
    }
  }

  // Back counter, red espresso machine, menu board, recipe binders.
  const bc = LAYOUT.backCounter;
  block(g, 'wood', [bc.min.x, 0, bc.min.z, bc.max.x, bc.max.y - 0.04, bc.max.z]);
  block(g, 'white', [bc.min.x - 0.02, bc.max.y - 0.04, bc.min.z - 0.03, bc.max.x + 0.02, bc.max.y, bc.max.z]);
  const c = LAYOUT.coffeeMachine;
  block(g, 'red', [c.min.x, c.min.y, c.min.z, c.max.x, c.max.y - 0.08, c.max.z]);
  block(g, 'paperShade', [c.min.x + 0.04, c.max.y - 0.08, c.min.z + 0.04, c.max.x - 0.04, c.max.y, c.max.z - 0.04]);
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), mat('white'));
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set((c.min.x + c.max.x) / 2, c.max.y - 0.2, c.min.z - 0.005);
  g.add(gauge);
  for (const x of [c.min.x + 0.15, c.max.x - 0.15]) {
    block(g, 'ink', [x - 0.05, c.min.y + 0.16, c.min.z - 0.06, x + 0.05, c.min.y + 0.22, c.min.z]);
    block(g, 'white', [x - 0.04, c.min.y, c.min.z - 0.05, x + 0.04, c.min.y + 0.08, c.min.z + 0.03]);
  }
  const m = LAYOUT.menuBoard;
  block(g, 'woodDark', [m.min.x - 0.04, m.min.y - 0.04, m.min.z - 0.01, m.max.x + 0.04, m.max.y + 0.04, m.max.z]);
  block(g, 'ink', [m.min.x, m.min.y, m.min.z - 0.02, m.max.x, m.max.y, m.max.z]);
  block(g, 'mustard', [m.min.x + 0.2, m.max.y - 0.14, m.min.z - 0.03, m.max.x - 0.2, m.max.y - 0.1, m.min.z - 0.02]);
  for (let i = 0; i < 5; i++) {
    const y = m.max.y - 0.24 - i * 0.1;
    block(g, 'paper', [m.min.x + 0.08, y, m.min.z - 0.03, m.min.x + 0.45 + (i % 3) * 0.12, y + 0.03, m.min.z - 0.02]);
    block(g, i % 2 ? 'pink' : 'tealLight', [m.max.x - 0.22, y, m.min.z - 0.03, m.max.x - 0.08, y + 0.03, m.min.z - 0.02]);
  }
  const r = LAYOUT.recipeShelf;
  block(g, 'woodDark', [r.min.x - 0.05, r.min.y - 0.04, r.min.z, r.max.x + 0.05, r.min.y, r.max.z]);
  const binders: Ink[] = ['red', 'teal', 'mustard', 'red', 'inkSoft', 'teal'];
  for (let i = 0; i < 6; i++) {
    const x = r.min.x + 0.02 + i * 0.095;
    block(g, binders[i], [x, r.min.y, r.min.z + 0.04, x + 0.08, r.max.y - (i % 3) * 0.03, r.max.z - 0.02]);
  }

  // Wall clock.
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(CLOCK3D.r, CLOCK3D.r, 0.03, 16), mat('white'));
  clock.rotation.x = Math.PI / 2;
  clock.position.set(CLOCK3D.x, CLOCK3D.y, CLOCK3D.z - 0.02);
  g.add(clock);
  const hand = (len: number, ink: Ink) => {
    // Pivots at the centre of the clock.
    const geometry = new THREE.BoxGeometry(0.016, len, 0.01).translate(0, len / 2, 0);
    const h = new THREE.Mesh(geometry, mat(ink));
    h.position.set(CLOCK3D.x, CLOCK3D.y, CLOCK3D.z - 0.045);
    g.add(h);
    return h;
  };
  const hourHand = hand(0.08, 'ink');
  const minuteHand = hand(0.12, 'red');
  // The clock faces −z: seen from the front, +rotation.z turns clockwise.
  g.userData.setClock = (minutes: number) => {
    hourHand.rotation.z = (((minutes / 60) % 12) / 12) * Math.PI * 2;
    minuteHand.rotation.z = ((minutes % 60) / 60) * Math.PI * 2;
  };
  g.userData.setClock(10 * 60);

  // Back door with a little window and a handle. It hangs on a hinge at its −z edge and swings
  // outwards; `setDoor(0…1)` opens it, `setDoor(0, t)` with a time gives the knocking rattle.
  const d = LAYOUT.door;
  const hinge = new THREE.Group();
  hinge.position.set(d.min.x, 0, d.min.z);
  const local = (b: [number, number, number, number, number, number]) =>
    [b[0] - d.min.x, b[1], b[2] - d.min.z, b[3] - d.min.x, b[4], b[5] - d.min.z] as [number, number, number, number, number, number];
  block(hinge, 'inkSoft', local([d.min.x - 0.02, d.min.y, d.min.z, d.max.x, d.max.y, d.max.z]));
  block(hinge, 'peach', local([d.min.x - 0.03, 1.3, -0.25, d.min.x - 0.02, 1.8, 0.25]));
  block(hinge, 'mustard', local([d.min.x - 0.03, 1.05, -0.3, d.min.x - 0.02, 1.15, 0.3]));
  block(hinge, 'mustard', local([d.min.x - 0.08, 0.95, 0.32, d.min.x - 0.02, 1.0, 0.42]));
  g.add(hinge);
  g.userData.setDoor = (open: number, knockTime?: number) => {
    // Knocking: two quick rattles, then a pause.
    const rattle =
      knockTime === undefined ? 0 : (Math.sin(knockTime * 40) * 0.025 * (knockTime % 1.6 < 0.45 ? 1 : 0));
    // +y rotation swings the free (+z) edge towards +x: outwards, away from the player.
    hinge.rotation.y = open * 1.35 + rattle;
  };

  // A spare apron on a hook near the door.
  block(g, 'teal', [HX - 0.02, 0.9, -0.95, HX - 0.01, 1.6, -0.65]);
  return g;
}

// ── The park outside ──────────────────────────────────────────────────────────────────

function tree(g: THREE.Group, x: number, z: number, size: number): void {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * size, 0.16 * size, 1.4 * size, 6), mat('woodDark'));
  trunk.position.set(x, GROUND_Y + 0.7 * size, z);
  g.add(trunk);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1 * size, 0), mat(size > 1 ? 'tealDark' : 'teal'));
  crown.position.set(x, GROUND_Y + 2.0 * size, z);
  g.add(crown);
}

function bench(g: THREE.Group, x: number, z: number, yaw: number): void {
  const b = new THREE.Group();
  block(b, 'wood', [-0.8, 0.42, -0.22, 0.8, 0.48, 0.22]);
  block(b, 'wood', [-0.8, 0.55, 0.18, 0.8, 0.85, 0.24]);
  block(b, 'ink', [-0.7, 0, -0.2, -0.64, 0.42, 0.2]);
  block(b, 'ink', [0.64, 0, -0.2, 0.7, 0.42, 0.2]);
  b.position.set(x, GROUND_Y, z);
  b.rotation.y = yaw;
  g.add(b);
}

function picnicTable(g: THREE.Group, x: number, z: number): void {
  const p = new THREE.Group();
  block(p, 'wood', [-0.9, 0.72, -0.4, 0.9, 0.78, 0.4]);
  block(p, 'woodDark', [-0.9, 0.42, -0.85, 0.9, 0.46, -0.6]);
  block(p, 'woodDark', [-0.9, 0.42, 0.6, 0.9, 0.46, 0.85]);
  block(p, 'ink', [-0.7, 0, -0.06, -0.62, 0.72, 0.06]);
  block(p, 'ink', [0.62, 0, -0.06, 0.7, 0.72, 0.06]);
  block(p, 'ink', [-0.02, 0.78, -0.02, 0.02, 2.1, 0.02]);
  const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 8), mat('red'));
  umbrella.position.set(0, 2.1, 0);
  p.add(umbrella);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.22, 8), mat('white'));
  tip.position.set(0, 2.28, 0);
  p.add(tip);
  p.position.set(x, GROUND_Y, z);
  g.add(p);
}

function lampPost(g: THREE.Group, x: number, z: number): THREE.Vector3 {
  block(g, 'ink', [x - 0.05, GROUND_Y, z - 0.05, x + 0.05, GROUND_Y + 3.2, z + 0.05]);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: inkColour('mustard') }));
  bulb.position.set(x, GROUND_Y + 3.3, z);
  g.add(bulb);
  return bulb.position.clone();
}

export function buildPark(): THREE.Group {
  const g = new THREE.Group();
  // Lawn and the winding path where customers queue.
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), mat('grass'));
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(0, GROUND_Y, -40);
  g.add(lawn);
  for (let i = 1; i < QUEUE_PATH_3D.length - 1; i++) {
    const a = QUEUE_PATH_3D[i - 1];
    const b = QUEUE_PATH_3D[i];
    const length = Math.hypot(b.x - a.x, b.z - a.z) + 1.2;
    const piece = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, length), mat('paperShade'));
    piece.position.set((a.x + b.x) / 2, GROUND_Y + 0.01, (a.z + b.z) / 2);
    piece.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    g.add(piece);
  }
  // Mowing stripes.
  for (let z = -6; z > -40; z -= 4) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(140, 2), mat('grassDark'));
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, GROUND_Y + 0.005, z);
    g.add(stripe);
  }

  // Seats that will fill with visitors when business is good (Phase 7).
  bench(g, -4.5, -7, 0.4);
  bench(g, 5, -8, -0.5);
  bench(g, 8.5, -14, -0.2);
  picnicTable(g, 3.6, -5.2);
  picnicTable(g, -5.5, -12);
  picnicTable(g, 7, -11);

  // Lamp posts with string lights between them.
  const lamps = [lampPost(g, -3, -4.2), lampPost(g, 2.6, -3.4), lampPost(g, 6.5, -7)];
  for (let i = 1; i < lamps.length; i++) {
    const a = lamps[i - 1];
    const b = lamps[i];
    for (let k = 1; k < 12; k++) {
      const t = k / 12;
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 4),
        new THREE.MeshBasicMaterial({ color: inkColour(k % 2 ? 'mustard' : 'red') }),
      );
      bulb.position.lerpVectors(a, b, t);
      bulb.position.y -= Math.sin(t * Math.PI) * 0.6;
      g.add(bulb);
    }
  }

  // Trees: a few near, a row further back.
  tree(g, -7, -6, 1.2);
  tree(g, 9, -4.5, 1.1);
  tree(g, -2, -16, 1.3);
  for (let x = -40; x <= 40; x += 5) tree(g, x + ((x * 7) % 3), -24 - ((x * 13) % 4), 1.5);

  // The far-away city skyline and a low sun.
  for (let i = 0, x = -70; x < 70; i++) {
    const w = 3 + ((i * 7) % 5);
    const h = 6 + ((i * 11) % 14);
    block(g, i % 2 ? 'lilac' : 'inkSoft', [x, GROUND_Y, -58 - (i % 3) * 3, x + w, GROUND_Y + h, -55 - (i % 3) * 3]);
    x += w + 0.6;
  }
  const sun = new THREE.Mesh(new THREE.CircleGeometry(7, 20), new THREE.MeshBasicMaterial({ color: inkColour('mustard') }));
  sun.position.set(14, GROUND_Y + 3, -75);
  g.add(sun);

  // The truck's own awning over the window, seen from inside.
  const w = LAYOUT.window;
  for (let i = 0; i < 8; i++) {
    const x = w.min.x - 0.2 + i * ((w.max.x - w.min.x + 0.4) / 8);
    const stripe = block(g, i % 2 ? 'white' : 'red', [x, 0, 0, x + (w.max.x - w.min.x + 0.4) / 8, 0.04, 0.9]);
    stripe.position.y = w.max.y + 0.25;
    stripe.position.z = -HZ - 0.5;
    stripe.rotation.x = -0.35;
  }
  return g;
}

// ── Customers ─────────────────────────────────────────────────────────────────────────

export type CustomerModel = {
  root: THREE.Group;
  legs: [THREE.Object3D, THREE.Object3D];
  arms: [THREE.Object3D, THREE.Object3D];
};

/** A blocky low-poly person, 1.75 m tall, facing −z. Colours from the 2D looks. */
export function buildCustomer(look: CustomerLook): CustomerModel {
  const l = LOOKS[look];
  const root = new THREE.Group();
  const limb = (ink: Ink, x: number, top: number, length: number, width: number): THREE.Object3D => {
    const pivot = new THREE.Group();
    pivot.position.set(x, top, 0);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, length, width), mat(ink));
    mesh.position.y = -length / 2;
    pivot.add(mesh);
    root.add(pivot);
    return pivot;
  };
  const legs: [THREE.Object3D, THREE.Object3D] = [limb(l.legs, -0.1, 0.82, 0.82, 0.15), limb(l.legs, 0.1, 0.82, 0.82, 0.15)];
  block(root, l.top, [-0.24, 0.8, -0.14, 0.24, 1.4, 0.14]);
  block(root, l.topShade, [-0.24, 0.8, -0.141, 0.24, 0.9, 0.141]);
  const arms: [THREE.Object3D, THREE.Object3D] = [limb(l.topShade, -0.31, 1.38, 0.58, 0.12), limb(l.topShade, 0.31, 1.38, 0.58, 0.12)];
  // Head with a face on the front (−z).
  block(root, l.skin, [-0.06, 1.4, -0.06, 0.06, 1.46, 0.06]);
  block(root, l.skin, [-0.16, 1.45, -0.16, 0.16, 1.75, 0.16]);
  block(root, 'ink', [-0.1, 1.6, -0.165, -0.06, 1.65, -0.16]);
  block(root, 'ink', [0.06, 1.6, -0.165, 0.1, 1.65, -0.16]);
  block(root, 'pink', [-0.13, 1.53, -0.165, -0.09, 1.56, -0.16]);
  block(root, 'pink', [0.09, 1.53, -0.165, 0.13, 1.56, -0.16]);
  block(root, 'ink', [-0.04, 1.51, -0.165, 0.04, 1.525, -0.16]);
  const hair = l.hairStyle === 'cap' ? (l.hat ?? 'red') : l.hair;
  if (l.hairStyle === 'sides') {
    block(root, hair, [-0.17, 1.55, -0.12, -0.15, 1.7, 0.16]);
    block(root, hair, [0.15, 1.55, -0.12, 0.17, 1.7, 0.16]);
  } else {
    block(root, hair, [-0.17, 1.7, -0.17, 0.17, 1.8, 0.17]);
    block(root, hair, [-0.17, 1.5, 0.1, 0.17, 1.75, 0.17]);
    if (l.hairStyle === 'cap') block(root, hair, [-0.15, 1.7, -0.3, 0.15, 1.72, -0.15]);
    if (l.hairStyle === 'long') block(root, hair, [-0.18, 1.2, 0.08, 0.18, 1.75, 0.2]);
  }
  if (l.extra === 'glasses') block(root, 'ink', [-0.13, 1.61, -0.17, 0.13, 1.63, -0.165]);
  if (l.extra === 'lanyard') block(root, 'white', [-0.07, 1.0, -0.15, 0.07, 1.12, -0.14]);
  if (l.extra === 'straps') {
    block(root, 'red', [-0.18, 0.85, -0.15, -0.12, 1.4, -0.14]);
    block(root, 'red', [0.12, 0.85, -0.15, 0.18, 1.4, -0.14]);
  }
  root.position.y = GROUND_Y;
  return { root, legs, arms };
}

/**
 * The Manager (GAME_DESIGN.md §3): a blocky figure in a dark suit, white shirt and red tie, with
 * glasses and a report tablet, facing −z like the customers. ⚠ Placeholder model.
 */
export function buildManager(): THREE.Group {
  const root = new THREE.Group();
  // Trousers and shoes.
  block(root, 'ink', [-0.18, 0, -0.08, -0.03, 0.85, 0.08]);
  block(root, 'ink', [0.03, 0, -0.08, 0.18, 0.85, 0.08]);
  block(root, 'inkSoft', [-0.2, 0, -0.13, -0.02, 0.06, 0.06]);
  block(root, 'inkSoft', [0.02, 0, -0.13, 0.2, 0.06, 0.06]);
  // Jacket with a shirt, lapels and a tie.
  block(root, 'ink', [-0.25, 0.82, -0.15, 0.25, 1.45, 0.15]);
  block(root, 'white', [-0.07, 1.12, -0.152, 0.07, 1.45, -0.15]);
  block(root, 'red', [-0.025, 1.0, -0.156, 0.025, 1.42, -0.152]);
  block(root, 'inkSoft', [-0.12, 1.15, -0.155, -0.07, 1.45, -0.151]);
  block(root, 'inkSoft', [0.07, 1.15, -0.155, 0.12, 1.45, -0.151]);
  // Arms; the right hand holds a report tablet.
  block(root, 'ink', [-0.37, 0.88, -0.07, -0.25, 1.43, 0.07]);
  block(root, 'ink', [0.25, 1.05, -0.3, 0.37, 1.43, 0.0]);
  block(root, 'tealDark', [0.13, 1.0, -0.42, 0.4, 1.2, -0.38]);
  // Head: neat short hair, glasses, a flat mouth.
  block(root, 'skin2', [-0.06, 1.44, -0.06, 0.06, 1.5, 0.06]);
  block(root, 'skin2', [-0.16, 1.49, -0.16, 0.16, 1.79, 0.16]);
  block(root, 'inkSoft', [-0.17, 1.74, -0.17, 0.17, 1.83, 0.17]);
  block(root, 'inkSoft', [-0.17, 1.55, 0.08, 0.17, 1.8, 0.17]);
  block(root, 'ink', [-0.13, 1.64, -0.168, 0.13, 1.66, -0.163]);
  block(root, 'ink', [-0.11, 1.6, -0.17, -0.03, 1.68, -0.165]);
  block(root, 'ink', [0.03, 1.6, -0.17, 0.11, 1.68, -0.165]);
  block(root, 'ink', [-0.05, 1.54, -0.168, 0.05, 1.555, -0.163]);
  return root;
}

