import Phaser from "phaser";
import { TILE_SIZE } from "../config";
import { DogStateMachine } from "../ai/DogStateMachine";
import { isInSightCone, type Vec2 } from "../ai/SightCone";
import { positionOnPatrol } from "../ai/Patrol";
import { play } from "../audio/sfx";

export type GhostState = "IDLE" | "ALERT" | "CHASE" | "DISTRACTED";

const GHOST_PATROL_SPEED = 60;
const GHOST_CHASE_SPEED = 132; // 1.2× mailman walk (110)
const GHOST_SIGHT_RANGE = TILE_SIZE * 8;
const GHOST_SIGHT_HALF_ANGLE = Math.PI / 3; // 60° half-angle = 120° cone
const ALERT_DURATION = 0.4;

export interface GhostConfig {
  patrol: readonly Vec2[];
  sightRangeMultiplier?: number; // for level escalation
  speedMultiplier?: number;
}

export class Ghost extends Phaser.Physics.Arcade.Sprite {
  private fsm: DogStateMachine<GhostState>;
  private patrolElapsed = 0;
  private facing: Vec2 = { x: 1, y: 0 };
  private distractedUntil = 0;
  private nextStepAt = 0;
  private readonly cfg: Required<GhostConfig>;

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: GhostConfig) {
    super(scene, x, y, "placeholder");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setTint(0x999999);
    this.setDisplaySize(TILE_SIZE, TILE_SIZE * 1.4);
    this.body!.setSize(TILE_SIZE * 0.7, TILE_SIZE * 0.9);
    this.cfg = {
      patrol: cfg.patrol,
      sightRangeMultiplier: cfg.sightRangeMultiplier ?? 1,
      speedMultiplier: cfg.speedMultiplier ?? 1,
    };
    this.fsm = new DogStateMachine<GhostState>("IDLE", {
      IDLE: ["ALERT", "DISTRACTED"],
      ALERT: ["CHASE", "IDLE", "DISTRACTED"],
      CHASE: ["IDLE", "DISTRACTED"],
      DISTRACTED: ["IDLE"],
    });
  }

  get currentState(): GhostState {
    return this.fsm.current;
  }

  /** Freeze in place for `seconds`. */
  distract(seconds: number, now: number) {
    this.distractedUntil = now + seconds;
    this.fsm.transition("DISTRACTED");
  }

  update(deltaSec: number, mailmanPos: Vec2, now: number) {
    this.fsm.tick(deltaSec);

    // Exit DISTRACTED when timer ends
    if (this.fsm.current === "DISTRACTED" && now >= this.distractedUntil) {
      this.fsm.transition("IDLE");
    }

    if (this.fsm.current === "DISTRACTED") {
      this.setVelocity(0, 0);
      return;
    }

    const sightRange = GHOST_SIGHT_RANGE * this.cfg.sightRangeMultiplier;
    const sees = isInSightCone(
      { x: this.x, y: this.y },
      this.facing,
      sightRange,
      GHOST_SIGHT_HALF_ANGLE,
      mailmanPos,
    );

    if (sees && this.fsm.current === "IDLE") this.fsm.transition("ALERT");
    if (this.fsm.current === "ALERT" && this.fsm.timeInState >= ALERT_DURATION) {
      this.fsm.transition("CHASE");
    }
    if (!sees && this.fsm.current === "CHASE" && this.fsm.timeInState > 1.5) {
      this.fsm.transition("IDLE");
    }

    if (this.fsm.current === "IDLE") this.tickPatrol(deltaSec);
    if (this.fsm.current === "ALERT") this.setVelocity(0, 0);
    if (this.fsm.current === "CHASE") this.tickChase(mailmanPos);
  }

  private tickPatrol(deltaSec: number) {
    this.patrolElapsed += deltaSec;
    const target = positionOnPatrol(this.cfg.patrol, GHOST_PATROL_SPEED, this.patrolElapsed);
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const mag = Math.hypot(dx, dy);
    if (mag > 1) {
      this.facing = { x: dx / mag, y: dy / mag };
      this.setVelocity((dx / mag) * GHOST_PATROL_SPEED, (dy / mag) * GHOST_PATROL_SPEED);
    } else {
      this.setVelocity(0, 0);
    }
  }

  private tickChase(target: Vec2) {
    const now = this.scene.time.now;
    if (now >= this.nextStepAt) {
      play(this.scene, "step", 0.3);
      this.nextStepAt = now + 350;
    }
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 1) {
      this.setVelocity(0, 0);
      return;
    }
    this.facing = { x: dx / mag, y: dy / mag };
    const speed = GHOST_CHASE_SPEED * this.cfg.speedMultiplier;
    this.setVelocity((dx / mag) * speed, (dy / mag) * speed);
  }
}
