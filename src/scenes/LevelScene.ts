import Phaser from "phaser";
import { TILE_SIZE, YARD_TILES_W, YARD_TILES_H } from "../config";
import { getTile, TILE_COLORS, isWalkable, GATE_COL } from "../levels/yardLayout";
import { Mailman } from "../entities/Mailman";
import { Ghost } from "../entities/Ghost";
import { KeyboardInput } from "../input/KeyboardInput";

export class LevelScene extends Phaser.Scene {
  private mailman!: Mailman;
  private ghost!: Ghost;
  private keyboard!: KeyboardInput;
  private fenceGroup!: Phaser.Physics.Arcade.StaticGroup;
  private elapsedSec = 0;

  constructor() {
    super("Level");
  }

  create() {
    this.drawTiles();
    this.buildFenceColliders();

    const spawnX = GATE_COL * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = 0 * TILE_SIZE + TILE_SIZE / 2;
    this.mailman = new Mailman(this, spawnX, spawnY);
    this.physics.add.collider(this.mailman, this.fenceGroup);

    this.ghost = new Ghost(this, TILE_SIZE * 12, TILE_SIZE * 8, {
      patrol: [
        { x: TILE_SIZE * 6, y: TILE_SIZE * 8 },
        { x: TILE_SIZE * 12, y: TILE_SIZE * 6 },
        { x: TILE_SIZE * 18, y: TILE_SIZE * 8 },
        { x: TILE_SIZE * 12, y: TILE_SIZE * 12 },
      ],
    });
    this.physics.add.collider(this.ghost, this.fenceGroup);

    this.physics.add.overlap(this.mailman, this.ghost, () => this.onCaught());

    this.keyboard = new KeyboardInput(this);
  }

  update(_time: number, deltaMs: number) {
    const deltaSec = deltaMs / 1000;
    this.elapsedSec += deltaSec;
    this.mailman.applyIntent(this.keyboard.read());
    this.ghost.update(deltaSec, { x: this.mailman.x, y: this.mailman.y }, this.elapsedSec);
  }

  private onCaught() {
    // For now: respawn mailman at the gate. Lives & game-over come in Task 15.
    const spawnX = GATE_COL * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = 0 * TILE_SIZE + TILE_SIZE / 2;
    this.mailman.setPosition(spawnX, spawnY);
    this.mailman.setVelocity(0, 0);
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
