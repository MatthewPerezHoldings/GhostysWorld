import Phaser from "phaser";
import { TILE_SIZE, YARD_TILES_W, YARD_TILES_H } from "../config";
import { getTile, TILE_COLORS, isWalkable, GATE_COL } from "../levels/yardLayout";
import { Mailman } from "../entities/Mailman";
import { KeyboardInput } from "../input/KeyboardInput";

export class LevelScene extends Phaser.Scene {
  private mailman!: Mailman;
  private keyboard!: KeyboardInput;
  private fenceGroup!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super("Level");
  }

  create() {
    this.drawTiles();
    this.buildFenceColliders();

    // Spawn on sidewalk just below the gate
    const spawnX = GATE_COL * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = 0 * TILE_SIZE + TILE_SIZE / 2;
    this.mailman = new Mailman(this, spawnX, spawnY);
    this.physics.add.collider(this.mailman, this.fenceGroup);

    this.keyboard = new KeyboardInput(this);
  }

  update() {
    const intent = this.keyboard.read();
    this.mailman.applyIntent(intent);
  }

  private drawTiles() {
    const g = this.add.graphics();
    for (let row = 0; row < YARD_TILES_H; row++) {
      for (let col = 0; col < YARD_TILES_W; col++) {
        const tile = getTile(col, row);
        g.fillStyle(TILE_COLORS[tile] ?? 0x000000, 1);
        g.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  private buildFenceColliders() {
    this.fenceGroup = this.physics.add.staticGroup();
    for (let row = 0; row < YARD_TILES_H; row++) {
      for (let col = 0; col < YARD_TILES_W; col++) {
        if (!isWalkable(col, row)) {
          const block = this.add.rectangle(
            col * TILE_SIZE + TILE_SIZE / 2,
            row * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE,
            TILE_SIZE,
            0x000000,
            0,
          );
          this.physics.add.existing(block, true);
          this.fenceGroup.add(block);
        }
      }
    }
  }
}
