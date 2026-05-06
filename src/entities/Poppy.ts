import Phaser from "phaser";
import { TILE_SIZE, YARD_TILES_W, YARD_TILES_H } from "../config";
import { DogStateMachine } from "../ai/DogStateMachine";
import { isInSightCone, type Vec2 } from "../ai/SightCone";
import { positionOnPatrol } from "../ai/Patrol";
import { isWalkable } from "../levels/yardLayout";
import { play } from "../audio/sfx";

export type PoppyState = "IDLE" | "BARKING" | "CHASE" | "DISTRACTED";

const POPPY_PATROL_SPEED = 80;
const POPPY_CHASE_SPEED = 154; // 1.4× mailman walk
const POPPY_SIGHT_RANGE = TILE_SIZE * 4;
const BARK_DURATION = 0.5;

export interface PoppyConfig {
  patrol: readonly Vec2[];
  holesPerLevel: number;
}

export interface Hole extends Vec2 {}

export class Poppy extends Phaser.Physics.Arcade.Sprite {
  // --- fields ---
  private fsm: DogStateMachine<PoppyState>;
  private patrolElapsed = 0;
  private elapsedSinceSpawn = 0;
  private distractedUntil = 0;
  private holesDug = 0;
  private nextHoleAt = 3; // first hole at 3 sec
  private chargeGhostUntil = 0;
  private nextChargeAt = 0;
  private cachedGhostPos: Vec2 = { x: 0, y: 0 };
  readonly holes: Hole[] = [];
  private readonly cfg: PoppyConfig;

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: PoppyConfig) {
    super(scene, x, y, "placeholder");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setTint(0xeeb24c);
    this.setDisplaySize(TILE_SIZE * 0.9, TILE_SIZE * 0.9);
    this.body!.setSize(TILE_SIZE * 0.7, TILE_SIZE * 0.7);
    this.cfg = cfg;
    this.fsm = new DogStateMachine<PoppyState>("IDLE", {
      IDLE: ["BARKING", "DISTRACTED"],
      BARKING: ["CHASE", "IDLE", "DISTRACTED"],
      CHASE: ["IDLE", "DISTRACTED"],
      DISTRACTED: ["IDLE"],
    });
  }

  // --- accessors ---

  get currentState(): PoppyState {
    return this.fsm.current;
  }

  // --- public methods ---

  distract(seconds: number, now: number) {
    this.distractedUntil = now + seconds;
    this.fsm.transition("DISTRACTED");
  }

  update(deltaSec: number, mailmanPos: Vec2, ghostPos: Vec2, now: number) {
    this.cachedGhostPos = ghostPos;
    this.fsm.tick(deltaSec);

    if (this.fsm.current === "DISTRACTED" && now >= this.distractedUntil) {
      this.fsm.transition("IDLE");
    }

    if (this.fsm.current === "DISTRACTED") {
      this.setVelocity(0, 0);
      this.setTint(0xeeb24c);
      return;
    }

    // Hole-digging timer (only while not distracted/chasing)
    if (
      this.fsm.current === "IDLE" &&
      this.holesDug < this.cfg.holesPerLevel &&
      this.elapsedSinceSpawn >= this.nextHoleAt
    ) {
      this.digHole();
    }
    this.elapsedSinceSpawn += deltaSec;

    // Periodically charge Ghost (every 8–14s while idle)
    if (this.fsm.current === "IDLE" && this.elapsedSinceSpawn >= this.nextChargeAt) {
      this.chargeGhostUntil = this.elapsedSinceSpawn + 3;
      this.nextChargeAt = this.elapsedSinceSpawn + Phaser.Math.Between(8, 14);
    }

    const sees = isInSightCone(
      { x: this.x, y: this.y },
      { x: 1, y: 0 },
      POPPY_SIGHT_RANGE,
      Math.PI, // 360°
      mailmanPos,
    );

    if (sees && this.fsm.current === "IDLE") {
      this.fsm.transition("BARKING");
      this.setTint(0xff5555); // bark flash
      play(this.scene, "bark");
    }
    if (this.fsm.current === "BARKING" && this.fsm.timeInState >= BARK_DURATION) {
      this.fsm.transition("CHASE");
    }
    if (!sees && this.fsm.current === "CHASE" && this.fsm.timeInState > 2) {
      this.fsm.transition("IDLE");
    }

    if (this.fsm.current === "IDLE") {
      this.setTint(0xeeb24c);
      if (this.elapsedSinceSpawn < this.chargeGhostUntil && this.scene) {
        this.tickChargeToward(this.getGhostPos());
      } else {
        this.tickPatrol(deltaSec);
      }
    }
    if (this.fsm.current === "BARKING") this.setVelocity(0, 0);
    if (this.fsm.current === "CHASE") {
      this.setTint(0xff5555);
      this.tickChase(mailmanPos);
    }
  }

  // --- private methods ---

  private getGhostPos(): Vec2 {
    return this.cachedGhostPos;
  }

  private digHole() {
    // Pick a random walkable tile inside the yard (not on porch/door/gate)
    for (let attempts = 0; attempts < 20; attempts++) {
      const col = Phaser.Math.Between(2, YARD_TILES_W - 3);
      const row = Phaser.Math.Between(3, YARD_TILES_H - 3);
      if (!isWalkable(col, row)) continue;
      this.holes.push({
        x: col * TILE_SIZE + TILE_SIZE / 2,
        y: row * TILE_SIZE + TILE_SIZE / 2,
      });
      this.holesDug++;
      this.nextHoleAt = this.elapsedSinceSpawn + Phaser.Math.Between(4, 7);
      play(this.scene, "dig");
      return;
    }
  }

  private tickPatrol(deltaSec: number) {
    this.patrolElapsed += deltaSec;
    const target = positionOnPatrol(this.cfg.patrol, POPPY_PATROL_SPEED, this.patrolElapsed);
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const mag = Math.hypot(dx, dy);
    if (mag > 1) {
      this.setVelocity((dx / mag) * POPPY_PATROL_SPEED, (dy / mag) * POPPY_PATROL_SPEED);
    } else {
      this.setVelocity(0, 0);
    }
  }

  private tickChase(target: Vec2) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 1) {
      this.setVelocity(0, 0);
      return;
    }
    this.setVelocity((dx / mag) * POPPY_CHASE_SPEED, (dy / mag) * POPPY_CHASE_SPEED);
  }

  private tickChargeToward(target: Vec2) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 4) {
      this.setVelocity(0, 0);
      return;
    }
    this.setVelocity((dx / mag) * POPPY_PATROL_SPEED, (dy / mag) * POPPY_PATROL_SPEED);
  }
}
