import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }

  create() {
    this.add.text(GAME_W / 2, GAME_H / 2 - 40, "GAME OVER", {
      fontFamily: "monospace",
      fontSize: "48px",
      color: "#ff6666",
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, GAME_H / 2 + 30, "Press SPACE to try again", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#aaaaaa",
    }).setOrigin(0.5);

    this.input.keyboard?.once("keydown-SPACE", () => this.scene.start("Title"));
    this.input.once("pointerdown", () => this.scene.start("Title"));
  }
}
