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
    this.load.image("nokia", "/assets/sprites/nokia.png");
    this.load.image("win-bg", "/assets/sprites/win-bg.png");
    preloadSfx(this);
  }

  create() {
    this.scene.start("Title");
  }
}
