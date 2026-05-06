import Phaser from "phaser";
import { preloadSfx } from "../audio/sfx";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.image("placeholder", "/assets/placeholder.png");
    preloadSfx(this);
  }

  create() {
    this.scene.start("Title");
  }
}
