import Phaser from "phaser";

export class Hud {
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(8, 4, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.55)",
      padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(1000);
  }

  set(opts: {
    levelIndex: number;
    lives: number;
    treats: number;
    squirrelCalls: number;
    hasTurtle: boolean;
    approachActive: boolean;
    approachRemaining: number;
    levelTime: number;
  }) {
    const left = `L${opts.levelIndex + 1}  ❤️${opts.lives}  🥩${opts.treats}  🐿️${opts.squirrelCalls}  🐢${opts.hasTurtle ? 1 : 0}`;
    const timer = opts.approachActive
      ? `  ⏱ approach ${opts.approachRemaining.toFixed(1)}s`
      : `  ⏱ ${opts.levelTime.toFixed(1)}s`;
    this.text.setText(left + timer);
  }
}
