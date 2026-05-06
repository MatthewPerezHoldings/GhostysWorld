import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("Leaderboard");
  }

  create(data: { totalScore?: number }) {
    this.add.text(GAME_W / 2, GAME_H / 2 - 40, "YOU WIN", {
      fontFamily: "monospace",
      fontSize: "48px",
      color: "#ffff66",
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, GAME_H / 2 + 20, `Score: ${data.totalScore ?? 0}`, {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.input.keyboard?.once("keydown-SPACE", () => this.scene.start("Title"));
    this.input.once("pointerdown", () => this.scene.start("Title"));
  }
}
