import Phaser from "phaser";
import { preloadSfx } from "../audio/sfx";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.image("placeholder", "/assets/placeholder.png");
    this.load.image("mailman", "/assets/sprites/mailman.png");
    this.load.image("ghost", "/assets/sprites/ghost.png");
    preloadSfx(this);
  }

  create() {
    this.scene.start("Title");
  }
}
