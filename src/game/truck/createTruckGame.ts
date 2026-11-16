import Phaser from 'phaser';
import { TruckScene } from './TruckScene';
import type { TruckBridge } from './truckBridge';
import { TRUCK_H, TRUCK_W, truckZoom } from './truckArt';

/** Starts the food truck game inside `parent`, keeping the 480×270 scene centred and zoomed. */
export function createTruckGame(parent: HTMLElement, bridge: TruckBridge): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#2b1d19',
    scale: {
      mode: Phaser.Scale.NONE,
      width: TRUCK_W,
      height: TRUCK_H,
      zoom: truckZoom(parent.clientWidth, parent.clientHeight),
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    banner: false,
    // The scene reads the bridge from the registry when it starts.
    callbacks: { preBoot: (g) => g.registry.set('bridge', bridge) },
    scene: [TruckScene],
  });
  const observer = new ResizeObserver(() => {
    game.scale.setZoom(truckZoom(parent.clientWidth, parent.clientHeight));
  });
  observer.observe(parent);
  game.events.once(Phaser.Core.Events.DESTROY, () => observer.disconnect());
  return game;
}
