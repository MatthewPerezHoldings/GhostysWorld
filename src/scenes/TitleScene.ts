import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 40, "Ghosty's World", {
        fontFamily: "monospace",
        fontSize: "48px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_W / 2, GAME_H / 2 + 40, "Press SPACE to start", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    this.input.keyboard?.once("keydown-SPACE", () => {
      this.scene.start("Level", { levelIndex: 0 });
    });

    this.input.once("pointerdown", () => {
      this.scene.start("Level", { levelIndex: 0 });
    });
  }
}
