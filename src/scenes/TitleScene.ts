import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

const HOW_TO_PLAY = [
  "You're the mailman. Deliver to the door.",
  "Avoid Ghost (silent wolfhound) & Poppy (loud golden).",
  "",
  "ITEMS",
  "  🥩  Steak    — distracts Ghost (the Irish Wolfhound)",
  "  🐿️  Squirrel — distracts Poppy (the Golden Retriever)",
  "  🐢  Turtle   — freezes BOTH Ghost and Poppy",
  "  S    Sneak    — half speed, harder to spot",
  "",
  "DESKTOP",
  "  Move: WASD or arrow keys",
  "  Hold Shift: sneak     1 / 2 / 3 : steak / squirrel / turtle",
  "",
  "MOBILE",
  "  Move: drag anywhere on the right side",
  "  Buttons stacked on the left",
].join("\n");

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    this.add
      .text(GAME_W / 2, 50, "Ghosty's World", {
        fontFamily: "monospace",
        fontSize: "44px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0);

    this.add
      .text(GAME_W / 2, 130, HOW_TO_PLAY, {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#dddddd",
        align: "left",
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(GAME_W / 2, GAME_H - 40, "Press SPACE or tap to start", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffff66",
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
