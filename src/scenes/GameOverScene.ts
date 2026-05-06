import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export class GameOverScene extends Phaser.Scene {
  private gifEl: HTMLImageElement | null = null;

  constructor() {
    super("GameOver");
  }

  create() {
    // Animated buttdrag GIF — Phaser's image loader only renders the
    // first frame, so we overlay it via DOM to keep the animation.
    const parent = document.getElementById("game");
    if (parent) {
      const img = document.createElement("img");
      img.src = "/assets/lose-buttdrag.gif";
      img.style.cssText = [
        "position:absolute",
        "top:50%",
        "left:50%",
        "transform:translate(-50%,-50%)",
        "max-width:60vmin",
        "max-height:60vmin",
        "pointer-events:none",
        "z-index:10",
      ].join(";");
      parent.appendChild(img);
      this.gifEl = img;
    }

    this.add.text(GAME_W / 2, 60, "GAME OVER", {
      fontFamily: "monospace",
      fontSize: "48px",
      color: "#ff6666",
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, GAME_H - 60, "Press SPACE to try again", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#aaaaaa",
    }).setOrigin(0.5);

    const restart = () => {
      this.cleanupGif();
      this.scene.start("Title");
    };
    this.input.keyboard?.once("keydown-SPACE", restart);
    this.input.once("pointerdown", restart);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanupGif());
  }

  private cleanupGif() {
    if (this.gifEl?.parentNode) this.gifEl.parentNode.removeChild(this.gifEl);
    this.gifEl = null;
  }
}
