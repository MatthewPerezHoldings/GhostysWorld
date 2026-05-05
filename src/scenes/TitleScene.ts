import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    this.add
      .text(GAME_W / 2, GAME_H / 2, "Ghosty's World", {
        fontFamily: "monospace",
        fontSize: "48px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
  }
}
