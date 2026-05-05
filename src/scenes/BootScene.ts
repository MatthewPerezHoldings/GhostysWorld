import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.image("placeholder", "/assets/placeholder.png");
  }

  create() {
    this.scene.start("Title");
  }
}
