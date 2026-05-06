import Phaser from "phaser";
import { TILE_SIZE } from "../config";

export type PickupKind = "treat" | "squirrel" | "turtle";

export interface PickupVisual {
  emoji: string;
  color: number;
}

const VISUALS: Record<PickupKind, PickupVisual> = {
  treat: { emoji: "🥩", color: 0xc04030 },
  squirrel: { emoji: "🐿️", color: 0x8a5a2a },
  turtle: { emoji: "🐢", color: 0x2a8a4a },
};

export class Pickup extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x: number, y: number, public readonly kind: PickupKind) {
    super(scene, x, y, VISUALS[kind].emoji, { fontSize: "20px" });
    this.setOrigin(0.5);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(TILE_SIZE * 0.6, TILE_SIZE * 0.6);
  }
}
