import Phaser from "phaser";
import type { PlayerIntent } from "./PlayerIntent";

interface ButtonState {
  down: boolean;
  edge: boolean; // true for one read after press
}

export class TouchInput {
  private moveX = 0;
  private moveY = 0;
  private sneak = false;
  private treat: ButtonState = { down: false, edge: false };
  private squirrel: ButtonState = { down: false, edge: false };
  private turtle: ButtonState = { down: false, edge: false };

  constructor(scene: Phaser.Scene) {
    if (!this.shouldShow()) return;

    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    // D-pad (bottom-left, sized for thumb)
    const padCx = 80;
    const padCy = h - 80;
    const r = 56;
    const padBg = scene.add.circle(padCx, padCy, r, 0xffffff, 0.18).setScrollFactor(0).setDepth(900);
    padBg.setInteractive(new Phaser.Geom.Circle(r, r, r * 1.5), Phaser.Geom.Circle.Contains);
    padBg.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      const dx = p.x - padCx;
      const dy = p.y - padCy;
      this.moveX = Math.abs(dx) > 8 ? Math.sign(dx) : 0;
      this.moveY = Math.abs(dy) > 8 ? Math.sign(dy) : 0;
    });
    padBg.on("pointerdown", (p: Phaser.Input.Pointer) => {
      const dx = p.x - padCx;
      const dy = p.y - padCy;
      this.moveX = Math.abs(dx) > 8 ? Math.sign(dx) : 0;
      this.moveY = Math.abs(dy) > 8 ? Math.sign(dy) : 0;
    });
    padBg.on("pointerout", () => { this.moveX = 0; this.moveY = 0; });
    padBg.on("pointerup", () => { this.moveX = 0; this.moveY = 0; });

    // Sneak button (above D-pad)
    this.makeButton(scene, padCx, padCy - r - 50, "S", () => { this.sneak = true; }, () => { this.sneak = false; });

    // Action buttons (bottom-right thumb cluster)
    const actX = w - 80;
    const actY = h - 80;
    this.makeButton(scene, actX - 70, actY,       "🥩", () => this.press(this.treat),    () => this.release(this.treat));
    this.makeButton(scene, actX,      actY - 70,  "🐿️", () => this.press(this.squirrel), () => this.release(this.squirrel));
    this.makeButton(scene, actX,      actY,       "🐢", () => this.press(this.turtle),   () => this.release(this.turtle));
  }

  private shouldShow(): boolean {
    return typeof window !== "undefined" && "ontouchstart" in window;
  }

  private makeButton(
    scene: Phaser.Scene, x: number, y: number, label: string,
    onDown: () => void, onUp: () => void,
  ) {
    const r = 32;
    const btn = scene.add.circle(x, y, r, 0xffffff, 0.22).setScrollFactor(0).setDepth(900).setInteractive();
    scene.add.text(x, y, label, { fontSize: "26px", color: "#ffffff" })
      .setOrigin(0.5).setScrollFactor(0).setDepth(901);
    btn.on("pointerdown", onDown);
    btn.on("pointerup", onUp);
    btn.on("pointerout", onUp);
  }

  private press(b: ButtonState) { b.down = true; b.edge = true; }
  private release(b: ButtonState) { b.down = false; }

  read(): PlayerIntent {
    const intent: PlayerIntent = {
      moveX: this.moveX,
      moveY: this.moveY,
      sneak: this.sneak,
      dropTreat: this.treat.edge,
      squirrelCall: this.squirrel.edge,
      dropTurtle: this.turtle.edge,
    };
    this.treat.edge = false;
    this.squirrel.edge = false;
    this.turtle.edge = false;
    return intent;
  }
}
