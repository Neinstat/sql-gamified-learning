import Phaser from 'phaser';
import { CafeScene } from './CafeScene';
import type { GameBridge } from './bridge';

/** Starts the game inside `parent`. The canvas always fills the parent element. */
export function createGame(parent: HTMLElement, bridge: GameBridge): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#2b211c',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth,
      height: parent.clientHeight,
    },
    physics: { default: 'arcade', arcade: { debug: false } },
    banner: false,
    // Scenes read the bridge from the registry when they start.
    callbacks: { preBoot: (g) => g.registry.set('bridge', bridge) },
    scene: [CafeScene],
  });
  return game;
}
