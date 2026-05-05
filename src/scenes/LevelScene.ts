import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export class LevelScene extends Phaser.Scene {
  constructor() {
    super("Level");
  }

  create() {
    this.add
      .text(GAME_W / 2, GAME_H / 2, "Level scene (stub)", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
  }
}
