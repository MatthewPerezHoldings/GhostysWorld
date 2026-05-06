import Phaser from "phaser";
import { TILE_SIZE, YARD_TILES_W, YARD_TILES_H } from "../config";
import { getTile, TILE_COLORS, isWalkable, GATE_COL } from "../levels/yardLayout";
import { Mailman } from "../entities/Mailman";
import { Ghost } from "../entities/Ghost";
import { Poppy } from "../entities/Poppy";
import { KeyboardInput } from "../input/KeyboardInput";
import { Pickup } from "../entities/Pickup";

export class LevelScene extends Phaser.Scene {
  private mailman!: Mailman;
  private ghost!: Ghost;
  private poppy!: Poppy;
  private holeGraphics!: Phaser.GameObjects.Graphics;
  private mailmanFrozenUntil = 0;
  private keyboard!: KeyboardInput;
  private fenceGroup!: Phaser.Physics.Arcade.StaticGroup;
  private elapsedSec = 0;
  private pickups: Pickup[] = [];
  private treatsLeft = 3;
  private squirrelCallsLeft = 2;
  private hasTurtle = false;
  private turtleSpawn?: Pickup;
  private nextTootAt = 0;

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

    this.poppy = new Poppy(this, TILE_SIZE * 6, TILE_SIZE * 6, {
      patrol: [
        { x: TILE_SIZE * 4, y: TILE_SIZE * 5 },
        { x: TILE_SIZE * 20, y: TILE_SIZE * 5 },
        { x: TILE_SIZE * 20, y: TILE_SIZE * 13 },
        { x: TILE_SIZE * 4, y: TILE_SIZE * 13 },
      ],
      holesPerLevel: 1,
    });
    this.physics.add.collider(this.poppy, this.fenceGroup);
    this.physics.add.overlap(this.mailman, this.poppy, () => this.onCaught());

    this.holeGraphics = this.add.graphics();

    this.keyboard = new KeyboardInput(this);

    // (Turtle spawn is gated on level config in Task 16; for now always spawn one in mid-yard.)
    this.turtleSpawn = new Pickup(this, TILE_SIZE * 12, TILE_SIZE * 9, "turtle");
    this.physics.add.overlap(this.mailman, this.turtleSpawn, () => {
      this.hasTurtle = true;
      this.turtleSpawn?.destroy();
      this.turtleSpawn = undefined;
    });
  }

  update(_time: number, deltaMs: number) {
    const deltaSec = deltaMs / 1000;
    this.elapsedSec += deltaSec;

    const intent = this.keyboard.read();
    if (this.elapsedSec < this.mailmanFrozenUntil) {
      this.mailman.setVelocity(0, 0);
    } else {
      this.mailman.applyIntent(intent);
    }

    if (intent.dropTreat && this.treatsLeft > 0) {
      this.treatsLeft--;
      this.dropPickup("treat", this.mailman.x, this.mailman.y);
    }
    if (intent.squirrelCall && this.squirrelCallsLeft > 0) {
      this.squirrelCallsLeft--;
      this.dropPickup("squirrel", this.mailman.x + 60, this.mailman.y);
    }
    if (intent.dropTurtle && this.hasTurtle) {
      this.hasTurtle = false;
      this.dropPickup("turtle", this.mailman.x, this.mailman.y);
    }

    // Pickup effects: when a dog overlaps a pickup, apply its distraction.
    this.applyPickupEffects();

    const mpos = { x: this.mailman.x, y: this.mailman.y };
    this.ghost.update(deltaSec, mpos, this.elapsedSec);
    this.poppy.update(deltaSec, mpos, { x: this.ghost.x, y: this.ghost.y }, this.elapsedSec);

    this.maybePoppyInGhostSight();
    this.maybeToot();

    this.checkHoleTrips();
    this.renderHoles();
  }

  private checkHoleTrips() {
    if (this.elapsedSec < this.mailmanFrozenUntil) return;
    for (const h of this.poppy.holes) {
      const d = Phaser.Math.Distance.Between(h.x, h.y, this.mailman.x, this.mailman.y);
      if (d < TILE_SIZE * 0.4) {
        this.mailmanFrozenUntil = this.elapsedSec + 1; // 1 sec frozen
        return;
      }
    }
  }

  private renderHoles() {
    this.holeGraphics.clear();
    this.holeGraphics.fillStyle(0x2a1a0a, 1);
    for (const h of this.poppy.holes) {
      this.holeGraphics.fillCircle(h.x, h.y, TILE_SIZE * 0.35);
    }
  }

  private dropPickup(kind: "treat" | "squirrel" | "turtle", x: number, y: number) {
    const p = new Pickup(this, x, y, kind);
    this.pickups.push(p);
  }

  private applyPickupEffects() {
    // Iterate in reverse so we can splice
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i]!;
      const dGhost = Phaser.Math.Distance.Between(p.x, p.y, this.ghost.x, this.ghost.y);
      const dPoppy = Phaser.Math.Distance.Between(p.x, p.y, this.poppy.x, this.poppy.y);

      if (p.kind === "treat" && dGhost < TILE_SIZE) {
        this.ghost.distract(1.0, this.elapsedSec);
        p.destroy();
        this.pickups.splice(i, 1);
      } else if (p.kind === "squirrel" && dPoppy < TILE_SIZE * 4) {
        this.poppy.distract(3.0, this.elapsedSec);
        p.destroy();
        this.pickups.splice(i, 1);
      } else if (p.kind === "turtle") {
        // Turtle distracts BOTH dogs in 3-tile radius for 3s
        if (dGhost < TILE_SIZE * 3) this.ghost.distract(3.0, this.elapsedSec);
        if (dPoppy < TILE_SIZE * 3) this.poppy.distract(3.0, this.elapsedSec);
        // Turtle remains for 3 sec then despawns
        if (!p.getData("placedAt")) p.setData("placedAt", this.elapsedSec);
        if (this.elapsedSec - (p.getData("placedAt") as number) > 3) {
          p.destroy();
          this.pickups.splice(i, 1);
        }
      }
    }
  }

  private maybeToot() {
    if (this.elapsedSec < this.nextTootAt) return;
    const d = Phaser.Math.Distance.Between(this.ghost.x, this.ghost.y, this.poppy.x, this.poppy.y);
    if (d < TILE_SIZE) {
      this.ghost.distract(2.0, this.elapsedSec);
      this.poppy.distract(2.0, this.elapsedSec);
      this.nextTootAt = this.elapsedSec + 4; // cooldown so it doesn't keep firing
      // Visual cue: tint the area briefly
      const cloud = this.add.circle(
        (this.ghost.x + this.poppy.x) / 2,
        (this.ghost.y + this.poppy.y) / 2,
        24,
        0xeeeeaa,
        0.6,
      );
      this.tweens.add({ targets: cloud, alpha: 0, duration: 1500, onComplete: () => cloud.destroy() });
    }
  }

  private maybePoppyInGhostSight() {
    if (this.ghost.currentState === "DISTRACTED") return;
    const dx = this.poppy.x - this.ghost.x;
    const dy = this.poppy.y - this.ghost.y;
    const dist = Math.hypot(dx, dy);
    if (dist < TILE_SIZE * 1.2) return; // already covered by toot stun proximity
    if (dist > TILE_SIZE * 8) return;
    // Check Ghost's facing using its body velocity
    const body = this.ghost.body as Phaser.Physics.Arcade.Body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    const vmag = Math.hypot(vx, vy);
    if (vmag < 1) return;
    const cos = (dx * vx + dy * vy) / (dist * vmag);
    if (cos < Math.cos(Math.PI / 3)) return; // outside 60° half-angle
    this.ghost.distract(0.5, this.elapsedSec);
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
