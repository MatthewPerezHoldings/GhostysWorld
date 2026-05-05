import Phaser from "phaser";
import { TILE_SIZE, YARD_TILES_W, YARD_TILES_H } from "../config";
import { getTile, TILE_COLORS } from "../levels/yardLayout";

export class LevelScene extends Phaser.Scene {
  constructor() {
    super("Level");
  }

  create() {
    const g = this.add.graphics();
    for (let row = 0; row < YARD_TILES_H; row++) {
      for (let col = 0; col < YARD_TILES_W; col++) {
        const tile = getTile(col, row);
        const color = TILE_COLORS[tile] ?? 0x000000;
        g.fillStyle(color, 1);
        g.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}
