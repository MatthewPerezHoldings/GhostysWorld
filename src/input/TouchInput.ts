import Phaser from "phaser";
import type { PlayerIntent } from "./PlayerIntent";

interface ButtonState {
  down: boolean;
  edge: boolean; // true for one read after press
}

const STICK_BASE_R = 60;
const STICK_NUB_R = 28;
const STICK_MAX_OFFSET = 56;
const STICK_DEADZONE = 14;

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

    // Action buttons clustered bottom-left for the off-thumb.
    const baseX = 80;
    const baseY = h - 80;
    this.makeButton(scene, baseX,      baseY - 140, "S",  () => { this.sneak = true; },        () => { this.sneak = false; });
    this.makeButton(scene, baseX,      baseY - 70,  "🐿️", () => this.press(this.squirrel),     () => this.release(this.squirrel));
    this.makeButton(scene, baseX,      baseY,       "🐢", () => this.press(this.turtle),       () => this.release(this.turtle));
    this.makeButton(scene, baseX + 70, baseY,       "🥩", () => this.press(this.treat),        () => this.release(this.treat));

    // Free-thumb joystick: tap anywhere in the right half to spawn the stick;
    // the tap point becomes the center, drag from there controls movement.
    const stickBase = scene.add.circle(0, 0, STICK_BASE_R, 0xffffff, 0.15)
      .setScrollFactor(0).setDepth(900).setVisible(false);
    const stickNub = scene.add.circle(0, 0, STICK_NUB_R, 0xffffff, 0.4)
      .setScrollFactor(0).setDepth(901).setVisible(false);

    let stickPointerId: number | null = null;
    let stickCx = 0;
    let stickCy = 0;
    const rightHalf = w / 2;

    scene.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (p.x < rightHalf) return;             // left half belongs to buttons
      if (stickPointerId !== null) return;     // already tracking another finger
      stickPointerId = p.id;
      stickCx = p.x;
      stickCy = p.y;
      stickBase.setPosition(stickCx, stickCy).setVisible(true);
      stickNub.setPosition(stickCx, stickCy).setVisible(true);
    });

    scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.id !== stickPointerId) return;
      const dx = p.x - stickCx;
      const dy = p.y - stickCy;
      const mag = Math.hypot(dx, dy);
      const k = mag > STICK_MAX_OFFSET ? STICK_MAX_OFFSET / mag : 1;
      stickNub.setPosition(stickCx + dx * k, stickCy + dy * k);
      this.moveX = Math.abs(dx) > STICK_DEADZONE ? Math.sign(dx) : 0;
      this.moveY = Math.abs(dy) > STICK_DEADZONE ? Math.sign(dy) : 0;
    });

    const releaseStick = (p: Phaser.Input.Pointer) => {
      if (p.id !== stickPointerId) return;
      stickPointerId = null;
      stickBase.setVisible(false);
      stickNub.setVisible(false);
      this.moveX = 0;
      this.moveY = 0;
    };
    scene.input.on("pointerup", releaseStick);
    scene.input.on("pointerupoutside", releaseStick);
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
