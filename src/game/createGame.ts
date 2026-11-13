import Phaser from 'phaser';
import { CafeScene } from './CafeScene';

/** Starts the game inside `parent`. The canvas always fills the parent element. */
export function createGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
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
    scene: [CafeScene],
  });
}
