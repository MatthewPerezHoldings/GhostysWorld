import Phaser from "phaser";
import { TILE_SIZE } from "../config";
import type { PlayerIntent } from "../input/PlayerIntent";

export const MAILMAN_WALK_SPEED = 110; // px/sec
export const MAILMAN_SNEAK_SPEED = 55;

export class Mailman extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "placeholder");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setTint(0x2266dd);
    this.setDisplaySize(TILE_SIZE * 0.8, TILE_SIZE * 0.8);
    this.body!.setSize(TILE_SIZE * 0.6, TILE_SIZE * 0.6);
    this.setCollideWorldBounds(true);
  }

  applyIntent(intent: PlayerIntent) {
    const speed = intent.sneak ? MAILMAN_SNEAK_SPEED : MAILMAN_WALK_SPEED;
    let vx = intent.moveX * speed;
    let vy = intent.moveY * speed;
    // Normalize diagonals so diagonal isn't faster
    if (vx !== 0 && vy !== 0) {
      const k = 1 / Math.SQRT2;
      vx *= k;
      vy *= k;
    }
    this.setVelocity(vx, vy);
  }
}
