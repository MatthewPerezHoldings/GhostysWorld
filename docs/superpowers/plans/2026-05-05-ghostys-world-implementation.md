# Ghosty's World Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a browser-playable arcade game at ghostysworld.com where the mailman delivers mail past Ghost (Irish Wolfhound) and Poppy (Golden Retriever) across 5 escalating levels, with desktop + mobile controls and a global leaderboard.

**Architecture:** A Vite + TypeScript + Phaser 3 single-page app deployed on Vercel. Pure-logic modules (sight cone, patrol, state machines, scoring, leaderboard API) are unit-tested with Vitest; Phaser scenes/entities are verified manually in the browser. Input is abstracted into a `PlayerIntent` event stream so keyboard and touch share one consumer. Leaderboard is a single Vercel serverless function backed by Upstash Redis.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest, Vercel, Upstash Redis, Kenney.nl CC0 assets.

**Spec:** `docs/superpowers/specs/2026-05-05-ghostys-world-design.md`

---

## File Structure

```
ghostys-world/
├── src/
│   ├── main.ts                    # Phaser game bootstrap
│   ├── config.ts                  # Game-wide constants (tile size, dimensions)
│   ├── scenes/
│   │   ├── BootScene.ts           # Asset preload + transition to TitleScene
│   │   ├── TitleScene.ts          # Title + "Press SPACE to start"
│   │   ├── LevelScene.ts          # Single instance reused across all 5 levels
│   │   ├── GameOverScene.ts       # 0 lives → restart from level 1
│   │   └── LeaderboardScene.ts    # Win screen with name entry + top 10
│   ├── entities/
│   │   ├── Mailman.ts             # Player controller; consumes PlayerIntent
│   │   ├── Ghost.ts               # Wolfhound AI
│   │   ├── Poppy.ts               # Retriever AI
│   │   └── Pickup.ts              # Treat / SquirrelCall / Turtle base
│   ├── ai/
│   │   ├── DogStateMachine.ts     # Shared FSM (pure logic, tested)
│   │   ├── SightCone.ts           # Vision math (pure logic, tested)
│   │   └── Patrol.ts              # Patrol path interpolation (pure logic, tested)
│   ├── levels/
│   │   └── levels.ts              # Level config data (5 levels)
│   ├── input/
│   │   ├── PlayerIntent.ts        # Shared event types
│   │   ├── KeyboardInput.ts       # WASD/arrows + 1/2/3
│   │   └── TouchInput.ts          # Virtual D-pad + action buttons
│   ├── score/
│   │   ├── scoring.ts             # Per-level + run total math (pure, tested)
│   │   ├── localScores.ts         # localStorage wrapper
│   │   └── globalScores.ts        # Calls /api/leaderboard
│   ├── audio/
│   │   └── sfx.ts                 # SFX registry + playback helpers
│   └── ui/
│       └── Hud.ts                 # In-game heads-up display
├── public/assets/                 # Sprites, audio, tilemap (Kenney + custom)
├── api/
│   └── leaderboard.ts             # Vercel serverless function
├── tests/                         # Vitest tests for non-Phaser modules
│   └── api/leaderboard.test.ts
├── index.html
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── package.json
├── vercel.json
└── .gitignore
```

---

## Task 1: Project Scaffold

**Goal:** Empty Phaser game boots to a black canvas in the browser. Repo initialized.

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `vercel.json`
- Create: `.gitignore`
- Create: `src/main.ts`
- Create: `src/config.ts`

- [ ] **Step 1: Initialize git and npm**

Run from `C:\Users\matth\ghostys-world`:

```bash
git init
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install phaser
npm install -D typescript vite vitest @types/node
```

- [ ] **Step 3: Write `package.json` scripts**

Replace the `scripts` block in `package.json` with:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "tests", "api"]
}
```

- [ ] **Step 5: Write `vite.config.ts`**

```ts
import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 5173 },
  build: { target: "es2022" },
});
```

- [ ] **Step 6: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 7: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <title>Ghosty's World</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #111; overflow: hidden; }
      #game { display: flex; align-items: center; justify-content: center; height: 100vh; }
    </style>
  </head>
  <body>
    <div id="game"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 8: Write `src/config.ts`**

```ts
export const TILE_SIZE = 32;
export const YARD_TILES_W = 25;
export const YARD_TILES_H = 18;
export const GAME_W = TILE_SIZE * YARD_TILES_W;
export const GAME_H = TILE_SIZE * YARD_TILES_H;
```

- [ ] **Step 9: Write `src/main.ts`**

```ts
import Phaser from "phaser";
import { GAME_W, GAME_H } from "./config";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_W,
  height: GAME_H,
  backgroundColor: "#000000",
  physics: { default: "arcade", arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [],
});
```

- [ ] **Step 10: Write `vercel.json`**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/$1" }]
}
```

- [ ] **Step 11: Write `.gitignore`**

```
node_modules
dist
.vercel
.env
.env.local
*.log
.DS_Store
```

- [ ] **Step 12: Verify dev server boots**

Run: `npm run dev`
Open: `http://localhost:5173`
Expected: black canvas, no console errors. Stop the server with `Ctrl+C`.

- [ ] **Step 13: Commit**

```bash
git add .
git commit -m "feat: scaffold Vite + Phaser + TypeScript project"
```

---

## Task 2: Boot Scene + Placeholder Assets

**Goal:** A `BootScene` preloads placeholder sprites (colored squares) and transitions to a stub `TitleScene`.

**Files:**
- Create: `public/assets/placeholder.png` (any 32x32 white PNG; use a CC0 source or generate)
- Create: `src/scenes/BootScene.ts`
- Create: `src/scenes/TitleScene.ts` (stub for now)
- Modify: `src/main.ts` (register scenes)

- [ ] **Step 1: Add a placeholder sprite**

Place any 32×32 white PNG at `public/assets/placeholder.png`. (A solid white square is fine — we'll tint it different colors in code per entity until real sprites land.)

- [ ] **Step 2: Write `src/scenes/BootScene.ts`**

```ts
import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.image("placeholder", "/assets/placeholder.png");
  }

  create() {
    this.scene.start("Title");
  }
}
```

- [ ] **Step 3: Write `src/scenes/TitleScene.ts` (stub)**

```ts
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    this.add.text(GAME_W / 2, GAME_H / 2, "Ghosty's World", {
      fontFamily: "monospace",
      fontSize: "48px",
      color: "#ffffff",
    }).setOrigin(0.5);
  }
}
```

- [ ] **Step 4: Wire scenes into `src/main.ts`**

Replace the `scene: [],` line in `src/main.ts` with:

```ts
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
```

…and:

```ts
scene: [BootScene, TitleScene],
```

(Place the imports at the top of the file alongside the existing imports.)

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`
Open: `http://localhost:5173`
Expected: black canvas with white "Ghosty's World" text centered. No console errors.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: boot scene + title stub"
```

---

## Task 3: Title Scene — Start Prompt

**Goal:** Title scene shows "Press SPACE to start" and on SPACE transitions to a stub LevelScene.

**Files:**
- Modify: `src/scenes/TitleScene.ts`
- Create: `src/scenes/LevelScene.ts` (stub)
- Modify: `src/main.ts`

- [ ] **Step 1: Write `src/scenes/LevelScene.ts` (stub)**

```ts
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export class LevelScene extends Phaser.Scene {
  constructor() {
    super("Level");
  }

  create() {
    this.add.text(GAME_W / 2, GAME_H / 2, "Level scene (stub)", {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#ffffff",
    }).setOrigin(0.5);
  }
}
```

- [ ] **Step 2: Update `src/scenes/TitleScene.ts`**

```ts
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    this.add.text(GAME_W / 2, GAME_H / 2 - 40, "Ghosty's World", {
      fontFamily: "monospace",
      fontSize: "48px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, GAME_H / 2 + 40, "Press SPACE to start", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#aaaaaa",
    }).setOrigin(0.5);

    this.input.keyboard?.once("keydown-SPACE", () => {
      this.scene.start("Level", { levelIndex: 0 });
    });

    this.input.once("pointerdown", () => {
      this.scene.start("Level", { levelIndex: 0 });
    });
  }
}
```

- [ ] **Step 3: Register `LevelScene` in `src/main.ts`**

Add to imports:

```ts
import { LevelScene } from "./scenes/LevelScene";
```

Update the `scene` array:

```ts
scene: [BootScene, TitleScene, LevelScene],
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`
Open: `http://localhost:5173`
Expected: title screen → press SPACE (or click) → "Level scene (stub)" appears.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: title scene with SPACE-to-start"
```

---

## Task 4: Yard Tilemap Rendering

**Goal:** `LevelScene` draws a 25×18 yard with grass tiles, a fence, a sidewalk, and a front-door tile. Placeholder colors only.

**Files:**
- Modify: `src/scenes/LevelScene.ts`
- Create: `src/levels/yardLayout.ts`

- [ ] **Step 1: Write `src/levels/yardLayout.ts`**

```ts
// Yard layout — 25 cols × 18 rows. Coordinates are [col, row] (x, y).
// 'G' = grass, 'F' = fence, 'S' = sidewalk, 'D' = front door, 'P' = porch, '.' = path
export const YARD_LAYOUT: readonly string[] = [
  "SSSSSSSSSSSSSSSSSSSSSSSSS", // 0   sidewalk
  "FFFFFFFFFFFF.FFFFFFFFFFFF", // 1   fence with gate at col 12
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 2
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 3
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 4
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 5
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 6
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 7
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 8
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 9
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 10
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 11
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 12
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 13
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 14
  "FGGGGGGGGGGGGPPPPPGGGGGGF", // 15  porch
  "FGGGGGGGGGGGGPPDPPGGGGGGF", // 16  door at col 14
  "FFFFFFFFFFFFFFFFFFFFFFFFF", // 17  back fence
];

export const TILE_COLORS: Record<string, number> = {
  G: 0x4a8c3a, // grass
  F: 0x6b4a2a, // fence (brown)
  S: 0x999999, // sidewalk
  D: 0x3a3a8a, // door (blue)
  P: 0xb38b4d, // porch (tan)
  ".": 0xc7b87a, // gate path
};

export const GATE_COL = 12;
export const GATE_ROW = 1;
export const DOOR_COL = 14;
export const DOOR_ROW = 16;

export function getTile(col: number, row: number): string {
  const line = YARD_LAYOUT[row];
  if (!line) return "G";
  const ch = line[col];
  return ch ?? "G";
}

export function isWalkable(col: number, row: number): boolean {
  const t = getTile(col, row);
  return t === "G" || t === "S" || t === "P" || t === "D" || t === ".";
}
```

- [ ] **Step 2: Update `src/scenes/LevelScene.ts`**

```ts
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
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
Open: `http://localhost:5173` → SPACE.
Expected: green yard fenced in brown, gray sidewalk on top, tan porch with a blue door tile in the middle of row 16.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: render yard tilemap"
```

---

## Task 5: Mailman Entity + Keyboard Input

**Goal:** A blue mailman sprite spawns on the sidewalk and moves with WASD/arrows, blocked by fences.

**Files:**
- Create: `src/input/PlayerIntent.ts`
- Create: `src/input/KeyboardInput.ts`
- Create: `src/entities/Mailman.ts`
- Modify: `src/scenes/LevelScene.ts`

- [ ] **Step 1: Write `src/input/PlayerIntent.ts`**

```ts
// PlayerIntent describes what the player wants to do per frame.
// Both KeyboardInput and TouchInput produce the same shape.
export interface PlayerIntent {
  moveX: number;     // -1, 0, or 1
  moveY: number;     // -1, 0, or 1
  sneak: boolean;    // hold to halve speed
  dropTreat: boolean;     // edge-triggered (true for one frame)
  squirrelCall: boolean;  // edge-triggered
  dropTurtle: boolean;    // edge-triggered
}

export const NEUTRAL_INTENT: PlayerIntent = {
  moveX: 0,
  moveY: 0,
  sneak: false,
  dropTreat: false,
  squirrelCall: false,
  dropTurtle: false,
};
```

- [ ] **Step 2: Write `src/input/KeyboardInput.ts`**

```ts
import Phaser from "phaser";
import type { PlayerIntent } from "./PlayerIntent";

export class KeyboardInput {
  private keyW: Phaser.Input.Keyboard.Key;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyS: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyShift: Phaser.Input.Keyboard.Key;
  private key1: Phaser.Input.Keyboard.Key;
  private key2: Phaser.Input.Keyboard.Key;
  private key3: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.keyW = kb.addKey("W");
    this.keyA = kb.addKey("A");
    this.keyS = kb.addKey("S");
    this.keyD = kb.addKey("D");
    this.cursors = kb.createCursorKeys();
    this.keyShift = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.key1 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.key3 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
  }

  read(): PlayerIntent {
    const up = this.keyW.isDown || this.cursors.up?.isDown;
    const down = this.keyS.isDown || this.cursors.down?.isDown;
    const left = this.keyA.isDown || this.cursors.left?.isDown;
    const right = this.keyD.isDown || this.cursors.right?.isDown;

    return {
      moveX: (left ? -1 : 0) + (right ? 1 : 0),
      moveY: (up ? -1 : 0) + (down ? 1 : 0),
      sneak: this.keyShift.isDown,
      dropTreat: Phaser.Input.Keyboard.JustDown(this.key1),
      squirrelCall: Phaser.Input.Keyboard.JustDown(this.key2),
      dropTurtle: Phaser.Input.Keyboard.JustDown(this.key3),
    };
  }
}
```

- [ ] **Step 3: Write `src/entities/Mailman.ts`**

```ts
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
```

- [ ] **Step 4: Update `src/scenes/LevelScene.ts`**

Replace contents:

```ts
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
```

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`
Expected: blue square on the sidewalk. WASD/arrows move it. The fence blocks horizontal movement; the gate (col 12, row 1) lets the mailman walk into the yard. Diagonal movement is not faster than orthogonal.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: mailman entity with keyboard input"
```

---

## Task 6: Sight Cone Module (TDD)

**Goal:** Pure-logic function that returns whether a point is inside a directional cone of a given length and half-angle.

**Files:**
- Create: `src/ai/SightCone.ts`
- Create: `src/ai/SightCone.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/ai/SightCone.test.ts
import { describe, it, expect } from "vitest";
import { isInSightCone } from "./SightCone";

describe("isInSightCone", () => {
  const origin = { x: 100, y: 100 };

  it("returns false when target is outside the range", () => {
    const r = isInSightCone(origin, { x: 1, y: 0 }, 50, Math.PI / 4, { x: 200, y: 100 });
    expect(r).toBe(false);
  });

  it("returns true when target is straight ahead within range", () => {
    const r = isInSightCone(origin, { x: 1, y: 0 }, 100, Math.PI / 4, { x: 150, y: 100 });
    expect(r).toBe(true);
  });

  it("returns true at the cone edge", () => {
    // half-angle is 45°; target at 45° offset within range
    const r = isInSightCone(origin, { x: 1, y: 0 }, 100, Math.PI / 4, { x: 130, y: 130 });
    expect(r).toBe(true);
  });

  it("returns false just outside the cone half-angle", () => {
    const r = isInSightCone(origin, { x: 1, y: 0 }, 100, Math.PI / 6, { x: 130, y: 130 });
    expect(r).toBe(false);
  });

  it("returns true for 360° cone (Poppy)", () => {
    const r = isInSightCone(origin, { x: 1, y: 0 }, 60, Math.PI, { x: 60, y: 100 });
    expect(r).toBe(true);
  });

  it("returns false at the same point as origin (no direction)", () => {
    const r = isInSightCone(origin, { x: 1, y: 0 }, 60, Math.PI / 4, { x: 100, y: 100 });
    expect(r).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: all tests fail with "isInSightCone is not a function" or similar import error.

- [ ] **Step 3: Implement `src/ai/SightCone.ts`**

```ts
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Returns true when `target` is inside a sight cone centered at `origin`,
 * pointing along `facing` (unit vector), of length `range` and total half-angle `halfAngle` (radians).
 * For 360° vision, pass halfAngle = Math.PI.
 */
export function isInSightCone(
  origin: Vec2,
  facing: Vec2,
  range: number,
  halfAngle: number,
  target: Vec2,
): boolean {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const dist2 = dx * dx + dy * dy;
  if (dist2 === 0) return false;
  if (dist2 > range * range) return false;

  // 360° cone: skip angle check
  if (halfAngle >= Math.PI) return true;

  const dist = Math.sqrt(dist2);
  const facingMag = Math.sqrt(facing.x * facing.x + facing.y * facing.y);
  if (facingMag === 0) return false;
  const cosAngle = (dx * facing.x + dy * facing.y) / (dist * facingMag);
  return cosAngle >= Math.cos(halfAngle);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: sight cone module with tests"
```

---

## Task 7: Patrol Path Module (TDD)

**Goal:** Pure-logic helper that interpolates a position along a closed loop of waypoints at a given speed and elapsed time.

**Files:**
- Create: `src/ai/Patrol.ts`
- Create: `src/ai/Patrol.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/ai/Patrol.test.ts
import { describe, it, expect } from "vitest";
import { positionOnPatrol } from "./Patrol";

describe("positionOnPatrol", () => {
  const square = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];

  it("starts at the first waypoint at t=0", () => {
    expect(positionOnPatrol(square, 100, 0)).toEqual({ x: 0, y: 0 });
  });

  it("is halfway between first two waypoints at half-segment time", () => {
    // Each segment is 100px; speed 100 px/s → 1s per segment.
    expect(positionOnPatrol(square, 100, 0.5)).toEqual({ x: 50, y: 0 });
  });

  it("reaches the second waypoint at one segment time", () => {
    expect(positionOnPatrol(square, 100, 1)).toEqual({ x: 100, y: 0 });
  });

  it("loops back to start after a full lap", () => {
    expect(positionOnPatrol(square, 100, 4)).toEqual({ x: 0, y: 0 });
  });

  it("handles partial laps correctly", () => {
    // After 2.5 segments → middle of segment 3 (y axis from (100,100) → (0,100))
    expect(positionOnPatrol(square, 100, 2.5)).toEqual({ x: 50, y: 100 });
  });

  it("returns the only waypoint when path has length 1", () => {
    expect(positionOnPatrol([{ x: 5, y: 5 }], 100, 99)).toEqual({ x: 5, y: 5 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: failures with import errors.

- [ ] **Step 3: Implement `src/ai/Patrol.ts`**

```ts
import type { Vec2 } from "./SightCone";

/**
 * Returns a position along a closed-loop patrol path.
 * `path` is the ordered list of waypoints; the path implicitly closes from the last back to the first.
 * `speed` is units per second. `elapsedSec` is total elapsed time since patrol start.
 */
export function positionOnPatrol(path: readonly Vec2[], speed: number, elapsedSec: number): Vec2 {
  if (path.length === 0) throw new Error("patrol path must have at least one waypoint");
  if (path.length === 1) return { ...path[0]! };

  // Build segment lengths (closed loop)
  const segments: number[] = [];
  let perimeter = 0;
  for (let i = 0; i < path.length; i++) {
    const a = path[i]!;
    const b = path[(i + 1) % path.length]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push(len);
    perimeter += len;
  }
  if (perimeter === 0) return { ...path[0]! };

  let traveled = (speed * elapsedSec) % perimeter;
  for (let i = 0; i < segments.length; i++) {
    const segLen = segments[i]!;
    if (traveled <= segLen) {
      const a = path[i]!;
      const b = path[(i + 1) % path.length]!;
      const t = segLen === 0 ? 0 : traveled / segLen;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    traveled -= segLen;
  }
  return { ...path[0]! };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: patrol path interpolation with tests"
```

---

## Task 8: Dog State Machine Base (TDD)

**Goal:** Generic finite state machine for dog AI: tracks current state, fires `onEnter`/`onExit`, and validates transitions.

**Files:**
- Create: `src/ai/DogStateMachine.ts`
- Create: `src/ai/DogStateMachine.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/ai/DogStateMachine.test.ts
import { describe, it, expect, vi } from "vitest";
import { DogStateMachine } from "./DogStateMachine";

type S = "IDLE" | "ALERT" | "CHASE";

describe("DogStateMachine", () => {
  it("starts in the initial state", () => {
    const fsm = new DogStateMachine<S>("IDLE", { IDLE: ["ALERT"], ALERT: ["CHASE", "IDLE"], CHASE: ["IDLE"] });
    expect(fsm.current).toBe("IDLE");
  });

  it("transitions when allowed", () => {
    const fsm = new DogStateMachine<S>("IDLE", { IDLE: ["ALERT"], ALERT: ["CHASE", "IDLE"], CHASE: ["IDLE"] });
    fsm.transition("ALERT");
    expect(fsm.current).toBe("ALERT");
  });

  it("ignores disallowed transitions", () => {
    const fsm = new DogStateMachine<S>("IDLE", { IDLE: ["ALERT"], ALERT: [], CHASE: [] });
    fsm.transition("CHASE");
    expect(fsm.current).toBe("IDLE");
  });

  it("fires onEnter and onExit hooks", () => {
    const onEnter = vi.fn();
    const onExit = vi.fn();
    const fsm = new DogStateMachine<S>(
      "IDLE",
      { IDLE: ["ALERT"], ALERT: ["IDLE"], CHASE: [] },
      { onEnter, onExit },
    );
    fsm.transition("ALERT");
    expect(onExit).toHaveBeenCalledWith("IDLE", "ALERT");
    expect(onEnter).toHaveBeenCalledWith("ALERT", "IDLE");
  });

  it("does not fire hooks for ignored transitions", () => {
    const onEnter = vi.fn();
    const fsm = new DogStateMachine<S>(
      "IDLE",
      { IDLE: ["ALERT"], ALERT: [], CHASE: [] },
      { onEnter },
    );
    fsm.transition("CHASE");
    expect(onEnter).not.toHaveBeenCalled();
  });

  it("tracks time spent in current state", () => {
    const fsm = new DogStateMachine<S>("IDLE", { IDLE: ["ALERT"], ALERT: [], CHASE: [] });
    fsm.tick(0.5);
    expect(fsm.timeInState).toBe(0.5);
    fsm.transition("ALERT");
    expect(fsm.timeInState).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

- [ ] **Step 3: Implement `src/ai/DogStateMachine.ts`**

```ts
export interface StateMachineHooks<S extends string> {
  onEnter?: (entering: S, leaving: S) => void;
  onExit?: (leaving: S, entering: S) => void;
}

export class DogStateMachine<S extends string> {
  private state: S;
  private elapsed = 0;

  constructor(
    initial: S,
    private readonly transitions: Record<S, readonly S[]>,
    private readonly hooks: StateMachineHooks<S> = {},
  ) {
    this.state = initial;
  }

  get current(): S {
    return this.state;
  }

  get timeInState(): number {
    return this.elapsed;
  }

  tick(deltaSec: number) {
    this.elapsed += deltaSec;
  }

  transition(next: S): boolean {
    const allowed = this.transitions[this.state] ?? [];
    if (!allowed.includes(next)) return false;
    const prev = this.state;
    this.hooks.onExit?.(prev, next);
    this.state = next;
    this.elapsed = 0;
    this.hooks.onEnter?.(next, prev);
    return true;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: dog state machine with tests"
```

---

## Task 9: Ghost Entity

**Goal:** Ghost wolfhound patrols a figure-8, alerts when it sees the mailman, chases, and pauses when distracted. Catches the mailman on hitbox overlap.

**Files:**
- Create: `src/entities/Ghost.ts`
- Modify: `src/scenes/LevelScene.ts`

- [ ] **Step 1: Write `src/entities/Ghost.ts`**

```ts
import Phaser from "phaser";
import { TILE_SIZE } from "../config";
import { DogStateMachine } from "../ai/DogStateMachine";
import { isInSightCone, type Vec2 } from "../ai/SightCone";
import { positionOnPatrol } from "../ai/Patrol";

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
```

- [ ] **Step 2: Update `src/scenes/LevelScene.ts` — spawn Ghost, wire chase + collision**

Replace the file contents:

```ts
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
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
Expected:
- A gray Ghost sprite walks a figure-8-style patrol around the yard center.
- Walking the mailman in front of Ghost makes Ghost stop, then chase.
- On contact, mailman is teleported back to the gate.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: ghost AI with patrol, sight, and chase"
```

---

## Task 10: Poppy Entity

**Goal:** Poppy retriever has 360° sight (short range), erratic patrol, plays a "bark" alert tint, and digs N holes per level.

**Files:**
- Create: `src/entities/Poppy.ts`
- Modify: `src/scenes/LevelScene.ts`

- [ ] **Step 1: Write `src/entities/Poppy.ts`**

```ts
import Phaser from "phaser";
import { TILE_SIZE, YARD_TILES_W, YARD_TILES_H } from "../config";
import { DogStateMachine } from "../ai/DogStateMachine";
import { isInSightCone, type Vec2 } from "../ai/SightCone";
import { positionOnPatrol } from "../ai/Patrol";
import { isWalkable } from "../levels/yardLayout";

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
  private fsm: DogStateMachine<PoppyState>;
  private patrolElapsed = 0;
  private distractedUntil = 0;
  private holesDug = 0;
  private nextHoleAt = 3; // first hole at 3 sec
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

  get currentState(): PoppyState {
    return this.fsm.current;
  }

  distract(seconds: number, now: number) {
    this.distractedUntil = now + seconds;
    this.fsm.transition("DISTRACTED");
  }

  update(deltaSec: number, mailmanPos: Vec2, now: number) {
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
    }
    if (this.fsm.current === "BARKING" && this.fsm.timeInState >= BARK_DURATION) {
      this.fsm.transition("CHASE");
    }
    if (!sees && this.fsm.current === "CHASE" && this.fsm.timeInState > 2) {
      this.fsm.transition("IDLE");
    }

    if (this.fsm.current === "IDLE") {
      this.setTint(0xeeb24c);
      this.tickPatrol(deltaSec);
    }
    if (this.fsm.current === "BARKING") this.setVelocity(0, 0);
    if (this.fsm.current === "CHASE") {
      this.setTint(0xff5555);
      this.tickChase(mailmanPos);
    }
  }

  private elapsedSinceSpawn = 0;

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
}
```

- [ ] **Step 2: Add Poppy to LevelScene + hole rendering + trip behavior**

Modify `src/scenes/LevelScene.ts`. Add the import:

```ts
import { Poppy } from "../entities/Poppy";
```

Add a private field next to `ghost`:

```ts
private poppy!: Poppy;
private holeGraphics!: Phaser.GameObjects.Graphics;
private mailmanFrozenUntil = 0;
```

In `create()`, after Ghost setup, add:

```ts
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
```

Replace `update(...)` with:

```ts
update(_time: number, deltaMs: number) {
  const deltaSec = deltaMs / 1000;
  this.elapsedSec += deltaSec;

  const intent = this.keyboard.read();
  if (this.elapsedSec < this.mailmanFrozenUntil) {
    this.mailman.setVelocity(0, 0);
  } else {
    this.mailman.applyIntent(intent);
  }

  const mpos = { x: this.mailman.x, y: this.mailman.y };
  this.ghost.update(deltaSec, mpos, this.elapsedSec);
  this.poppy.update(deltaSec, mpos, this.elapsedSec);

  this.checkHoleTrips();
  this.renderHoles();
}
```

Add helpers below `update`:

```ts
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
```

- [ ] **Step 3: Add Poppy's periodic charge-Ghost behavior**

Spec: "Poppy zooms erratically around the yard; periodically charges Ghost to sniff his butt." This makes the toot stun emergent (player can witness it without setting it up). Add this as an override to her IDLE patrol target.

In `src/entities/Poppy.ts`, add a private field:

```ts
private chargeGhostUntil = 0;
private nextChargeAt = 0;
```

In `update(...)`, just after `this.elapsedSinceSpawn += deltaSec;`, add:

```ts
// Periodically charge Ghost (every 8–14s while idle)
if (this.fsm.current === "IDLE" && this.elapsedSinceSpawn >= this.nextChargeAt) {
  this.chargeGhostUntil = this.elapsedSinceSpawn + 3;
  this.nextChargeAt = this.elapsedSinceSpawn + Phaser.Math.Between(8, 14);
}
```

Modify the IDLE branch to honor charging. Replace the `if (this.fsm.current === "IDLE")` block with:

```ts
if (this.fsm.current === "IDLE") {
  this.setTint(0xeeb24c);
  if (this.elapsedSinceSpawn < this.chargeGhostUntil && this.scene) {
    this.tickChargeToward(this.getGhostPos());
  } else {
    this.tickPatrol(deltaSec);
  }
}
```

Add a way for the scene to provide Ghost's position. Change `update`'s signature to accept it:

```ts
update(deltaSec: number, mailmanPos: Vec2, ghostPos: Vec2, now: number) {
```

Replace the helper:

```ts
private getGhostPos(): Vec2 { return this.cachedGhostPos; }
private cachedGhostPos: Vec2 = { x: 0, y: 0 };
```

At the top of `update(...)`, store it:

```ts
this.cachedGhostPos = ghostPos;
```

Add the charge helper:

```ts
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
```

Update the call site in `src/scenes/LevelScene.ts`:

```ts
this.poppy.update(deltaSec, mpos, { x: this.ghost.x, y: this.ghost.y }, this.elapsedSec);
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`
Expected:
- Tan Poppy patrols a different path than Ghost.
- Approach Poppy → her tint flashes red (bark) for ~0.5 sec, then she chases.
- After ~3 seconds, a brown circle (hole) appears in the yard. Walking onto it freezes the mailman for 1 sec.
- Roughly every 8–14 seconds, Poppy breaks her patrol and runs straight at Ghost for 3 sec — sets up emergent toot stuns in Task 12.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: poppy AI with bark, chase, holes, and charge-ghost"
```

---

## Task 11: Pickups (Treat / Squirrel Call / Turtle)

**Goal:** Player can drop a treat (1 key), call a squirrel (2 key), or drop a turtle (3 key, single-use, requires pickup first). Each effect distracts the appropriate dog(s).

**Files:**
- Create: `src/entities/Pickup.ts`
- Modify: `src/scenes/LevelScene.ts`

- [ ] **Step 1: Write `src/entities/Pickup.ts`**

```ts
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
```

- [ ] **Step 2: Add pickups + intent handling to LevelScene**

Modify `src/scenes/LevelScene.ts`:

Add import:

```ts
import { Pickup } from "../entities/Pickup";
```

Add private fields:

```ts
private pickups: Pickup[] = [];
private treatsLeft = 3;
private squirrelCallsLeft = 2;
private hasTurtle = false;
private turtleSpawn?: Pickup;
```

In `create()` after Poppy, optionally spawn a turtle pickup:

```ts
// (Turtle spawn is gated on level config in Task 16; for now always spawn one in mid-yard.)
this.turtleSpawn = new Pickup(this, TILE_SIZE * 12, TILE_SIZE * 9, "turtle");
this.physics.add.overlap(this.mailman, this.turtleSpawn, () => {
  this.hasTurtle = true;
  this.turtleSpawn?.destroy();
  this.turtleSpawn = undefined;
});
```

Update `update(...)` to handle pickup drops. Replace the `intent` block:

```ts
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
```

Add helper methods:

```ts
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
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
Expected:
- Press `1` near Ghost → 🥩 emoji appears, Ghost freezes for 1 sec.
- Press `2` → 🐿️ emoji appears; if Poppy is within range she stops chasing for 3 sec.
- Walk over the 🐢 in mid-yard → it disappears (picked up). Press `3` → both nearby dogs freeze for 3 sec.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: treat, squirrel call, and turtle pickups"
```

---

## Task 12: Toot Stun Mechanic

**Goal:** When Poppy comes within 1 tile of Ghost (in IDLE/CHASE — not BARKING/DISTRACTED), both freeze for 2 seconds in a tinted "dust cloud" state.

**Files:**
- Modify: `src/scenes/LevelScene.ts`
- Modify: `src/entities/Ghost.ts` (already supports `distract`)
- Modify: `src/entities/Poppy.ts` (already supports `distract`)

- [ ] **Step 1: Add toot proximity check to LevelScene**

In `src/scenes/LevelScene.ts`, add a private field:

```ts
private nextTootAt = 0; // earliest time another toot is allowed
```

In `update(...)`, after the dog updates and before `checkHoleTrips()`, add:

```ts
this.maybeToot();
```

Add the helper method:

```ts
private maybeToot() {
  if (this.elapsedSec < this.nextTootAt) return;
  const d = Phaser.Math.Distance.Between(this.ghost.x, this.ghost.y, this.poppy.x, this.poppy.y);
  if (d < TILE_SIZE) {
    this.ghost.distract(2.0, this.elapsedSec);
    this.poppy.distract(2.0, this.elapsedSec);
    this.nextTootAt = this.elapsedSec + 4; // cooldown so it doesn't keep firing
    // Visual cue: tint the area briefly
    const cloud = this.add.circle((this.ghost.x + this.poppy.x) / 2, (this.ghost.y + this.poppy.y) / 2, 24, 0xeeeeaa, 0.6);
    this.tweens.add({ targets: cloud, alpha: 0, duration: 1500, onComplete: () => cloud.destroy() });
  }
}
```

- [ ] **Step 2: Add the "Poppy in Ghost's sight cone" disengage**

Spec lists this as a separate Ghost distraction (~0.5 sec) — distinct from the 1-tile toot stun. It nudges Ghost to lose focus when Poppy crosses his vision, even from far away.

Add a new method to `src/scenes/LevelScene.ts`:

```ts
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
```

In `update(...)`, call it right before `maybeToot()`:

```ts
this.maybePoppyInGhostSight();
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
Expected:
- When Poppy charges past Ghost (Task 10 step 3), Ghost briefly freezes (tint pause ~0.5s) even before they collide.
- When Poppy and Ghost actually collide (within 1 tile), the toot stun fires: both freeze 2 sec, yellow cloud fades.
- Cooldown of 4 sec on the toot prevents it from re-firing instantly.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: toot stun proximity + poppy-in-sight disengage"
```

---

## Task 13: Approach Timer + Fence-Vault Lose Condition

**Goal:** When the mailman is still on the sidewalk (row 0), an "approach timer" fills. If it hits 100% before he crosses the gate, both dogs vault the fence and catch him.

**Files:**
- Modify: `src/scenes/LevelScene.ts`

- [ ] **Step 1: Add approach state to LevelScene**

Add private fields:

```ts
private approachActive = true;
private approachElapsed = 0;
private approachLimitSec = 25; // overridden by level config in Task 16
```

In `update(...)`, after computing `deltaSec` and reading `intent`, add (before `applyIntent`):

```ts
if (this.approachActive) {
  this.approachElapsed += deltaSec;
  // Crossing the gate row deactivates the approach phase
  if (this.mailman.y > TILE_SIZE * 1.5) {
    this.approachActive = false;
  }
  if (this.approachElapsed >= this.approachLimitSec) {
    this.onApproachTimeout();
    return;
  }
}
```

Add the helper:

```ts
private onApproachTimeout() {
  // Vault rush: both dogs sprint to the mailman
  this.ghost.setPosition(this.mailman.x, this.mailman.y);
  this.poppy.setPosition(this.mailman.x, this.mailman.y);
  this.onCaught();
  this.approachActive = false;
  this.approachElapsed = 0;
}
```

Update `onCaught()` to also reset the approach phase:

```ts
private onCaught() {
  const spawnX = GATE_COL * TILE_SIZE + TILE_SIZE / 2;
  const spawnY = 0 * TILE_SIZE + TILE_SIZE / 2;
  this.mailman.setPosition(spawnX, spawnY);
  this.mailman.setVelocity(0, 0);
  this.approachActive = true;
  this.approachElapsed = 0;
}
```

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`
Expected:
- Stand on the sidewalk for 25 seconds without entering the gate → mailman is teleported back to spawn. Console-logging `this.approachElapsed` while testing makes this easier to verify; remove logs after.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: approach timer + fence-vault lose condition"
```

---

## Task 14: Door Tile + Win Condition + Level Lifecycle

**Goal:** Stepping on the door tile completes the level. The scene fires a `levelComplete` event with the time and level index, and stops itself.

**Files:**
- Modify: `src/levels/yardLayout.ts` (already exposes DOOR_COL/DOOR_ROW)
- Modify: `src/scenes/LevelScene.ts`

- [ ] **Step 1: Add a `levelIndex` and win check to LevelScene**

Modify `src/scenes/LevelScene.ts`. Update the imports to include `DOOR_COL`, `DOOR_ROW`:

```ts
import { getTile, TILE_COLORS, isWalkable, GATE_COL, DOOR_COL, DOOR_ROW } from "../levels/yardLayout";
```

Add field and `init`:

```ts
private levelIndex = 0;
private levelTimeSec = 0;
private won = false;

init(data: { levelIndex?: number }) {
  this.levelIndex = data.levelIndex ?? 0;
  this.elapsedSec = 0;
  this.levelTimeSec = 0;
  this.won = false;
  this.approachActive = true;
  this.approachElapsed = 0;
  this.treatsLeft = 3;
  this.squirrelCallsLeft = 2;
  this.hasTurtle = false;
  this.pickups = [];
}
```

In `update(...)`, after dog updates, increment `levelTimeSec` and check for win:

```ts
this.levelTimeSec += deltaSec;
if (!this.won) this.checkWin();
```

Add helper:

```ts
private checkWin() {
  const col = Math.floor(this.mailman.x / TILE_SIZE);
  const row = Math.floor(this.mailman.y / TILE_SIZE);
  if (col === DOOR_COL && row === DOOR_ROW) {
    this.won = true;
    this.events.emit("levelComplete", {
      levelIndex: this.levelIndex,
      timeSec: this.levelTimeSec,
    });
    this.scene.pause();
  }
}
```

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`
Open browser DevTools console. Walk the mailman to the blue door tile. Expected:
- The game freezes (scene paused).
- Inspecting the LevelScene event emitter (or temporarily logging in `checkWin`) shows the event fires once with `levelIndex: 0` and a positive `timeSec`.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: door win condition + level lifecycle"
```

---

## Task 15: Lives + Game Over Scene

**Goal:** Game tracks 3 lives across level resets. On 0 lives, transitions to a `GameOverScene` that returns to the title.

**Files:**
- Create: `src/scenes/GameOverScene.ts`
- Modify: `src/main.ts`
- Modify: `src/scenes/LevelScene.ts`

- [ ] **Step 1: Write `src/scenes/GameOverScene.ts`**

```ts
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOver");
  }

  create() {
    this.add.text(GAME_W / 2, GAME_H / 2 - 40, "GAME OVER", {
      fontFamily: "monospace",
      fontSize: "48px",
      color: "#ff6666",
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, GAME_H / 2 + 30, "Press SPACE to try again", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#aaaaaa",
    }).setOrigin(0.5);

    this.input.keyboard?.once("keydown-SPACE", () => this.scene.start("Title"));
    this.input.once("pointerdown", () => this.scene.start("Title"));
  }
}
```

- [ ] **Step 2: Register `GameOverScene` in `src/main.ts`**

Add import:

```ts
import { GameOverScene } from "./scenes/GameOverScene";
```

Update the scene array:

```ts
scene: [BootScene, TitleScene, LevelScene, GameOverScene],
```

- [ ] **Step 3: Track lives in LevelScene**

In `src/scenes/LevelScene.ts`:

Add a private static-ish run-state object (we'll lift this into a proper run state in Task 19; for now keep it on the scene):

```ts
private livesRemaining = 3;
```

Update `init` to read lives from `data` (so we can carry across restarts):

```ts
init(data: { levelIndex?: number; livesRemaining?: number }) {
  this.levelIndex = data.levelIndex ?? 0;
  this.livesRemaining = data.livesRemaining ?? 3;
  this.elapsedSec = 0;
  this.levelTimeSec = 0;
  this.won = false;
  this.approachActive = true;
  this.approachElapsed = 0;
  this.treatsLeft = 3;
  this.squirrelCallsLeft = 2;
  this.hasTurtle = false;
  this.pickups = [];
}
```

Replace `onCaught()`:

```ts
private onCaught() {
  this.livesRemaining--;
  if (this.livesRemaining <= 0) {
    this.scene.start("GameOver");
    return;
  }
  this.scene.restart({ levelIndex: this.levelIndex, livesRemaining: this.livesRemaining });
}
```

Update `onApproachTimeout()` so it goes through `onCaught` (don't double-decrement). Replace it:

```ts
private onApproachTimeout() {
  this.onCaught();
}
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`
Expected:
- Get caught 3 times → `GAME OVER` screen → SPACE returns to title.
- Get caught fewer than 3 times → level resets, mailman back at spawn.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: lives + game over scene"
```

---

## Task 16: Levels Config

**Goal:** Move all level-specific tunables into `src/levels/levels.ts` and have `LevelScene` consume them. Implement progression: on level complete, advance to the next level. After level 5, transition to a stub leaderboard scene.

**Files:**
- Create: `src/levels/levels.ts`
- Create: `src/scenes/LeaderboardScene.ts` (stub for now)
- Modify: `src/main.ts`
- Modify: `src/scenes/LevelScene.ts`

- [ ] **Step 1: Write `src/levels/levels.ts`**

```ts
export interface LevelConfig {
  approachLimitSec: number;
  treats: number;
  squirrelCalls: number;
  ghostSightMultiplier: number;
  ghostSpeedMultiplier: number;
  poppyHoles: number;
  ghostAsleepOnPorch: boolean;
  hasTurtlePickup: boolean;
}

export const LEVELS: LevelConfig[] = [
  // Level 1: tutorial — Ghost asleep, only Poppy active
  { approachLimitSec: 30, treats: 3, squirrelCalls: 2, ghostSightMultiplier: 1, ghostSpeedMultiplier: 1, poppyHoles: 1, ghostAsleepOnPorch: true,  hasTurtlePickup: false },
  // Level 2
  { approachLimitSec: 25, treats: 3, squirrelCalls: 2, ghostSightMultiplier: 1, ghostSpeedMultiplier: 1, poppyHoles: 1, ghostAsleepOnPorch: false, hasTurtlePickup: false },
  // Level 3: Ghost sight +20%
  { approachLimitSec: 20, treats: 3, squirrelCalls: 2, ghostSightMultiplier: 1.2, ghostSpeedMultiplier: 1, poppyHoles: 1, ghostAsleepOnPorch: false, hasTurtlePickup: false },
  // Level 4: 2 holes, Ghost +10% speed, fewer pickups
  { approachLimitSec: 18, treats: 2, squirrelCalls: 1, ghostSightMultiplier: 1.2, ghostSpeedMultiplier: 1.1, poppyHoles: 2, ghostAsleepOnPorch: false, hasTurtlePickup: false },
  // Level 5: boss — huge sight, 3 holes, turtle is the win key
  { approachLimitSec: 15, treats: 2, squirrelCalls: 1, ghostSightMultiplier: 1.5, ghostSpeedMultiplier: 1.1, poppyHoles: 3, ghostAsleepOnPorch: false, hasTurtlePickup: true },
];
```

- [ ] **Step 2: Write stub `src/scenes/LeaderboardScene.ts`**

```ts
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super("Leaderboard");
  }

  create(data: { totalScore?: number }) {
    this.add.text(GAME_W / 2, GAME_H / 2 - 40, "YOU WIN", {
      fontFamily: "monospace",
      fontSize: "48px",
      color: "#ffff66",
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, GAME_H / 2 + 20, `Score: ${data.totalScore ?? 0}`, {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.input.keyboard?.once("keydown-SPACE", () => this.scene.start("Title"));
    this.input.once("pointerdown", () => this.scene.start("Title"));
  }
}
```

- [ ] **Step 3: Register `LeaderboardScene` in `src/main.ts`**

```ts
import { LeaderboardScene } from "./scenes/LeaderboardScene";
```

```ts
scene: [BootScene, TitleScene, LevelScene, GameOverScene, LeaderboardScene],
```

- [ ] **Step 4: Wire `LEVELS` into `LevelScene`**

In `src/scenes/LevelScene.ts`:

Add import:

```ts
import { LEVELS } from "../levels/levels";
```

Replace `init` body:

```ts
init(data: { levelIndex?: number; livesRemaining?: number; runScore?: number }) {
  this.levelIndex = data.levelIndex ?? 0;
  this.livesRemaining = data.livesRemaining ?? 3;
  this.runScore = data.runScore ?? 0;
  this.elapsedSec = 0;
  this.levelTimeSec = 0;
  this.won = false;
  this.approachActive = true;
  this.approachElapsed = 0;
  this.pickups = [];

  const cfg = LEVELS[this.levelIndex]!;
  this.approachLimitSec = cfg.approachLimitSec;
  this.treatsLeft = cfg.treats;
  this.squirrelCallsLeft = cfg.squirrelCalls;
  this.hasTurtle = false;
}
```

Add `private runScore = 0;` to the class fields.

In `create()`, replace the Ghost construction with:

```ts
const cfg = LEVELS[this.levelIndex]!;

this.ghost = new Ghost(this, TILE_SIZE * 14, TILE_SIZE * 16, {
  patrol: cfg.ghostAsleepOnPorch
    ? [{ x: TILE_SIZE * 14, y: TILE_SIZE * 16 }]
    : [
        { x: TILE_SIZE * 6, y: TILE_SIZE * 8 },
        { x: TILE_SIZE * 12, y: TILE_SIZE * 6 },
        { x: TILE_SIZE * 18, y: TILE_SIZE * 8 },
        { x: TILE_SIZE * 12, y: TILE_SIZE * 12 },
      ],
  sightRangeMultiplier: cfg.ghostSightMultiplier,
  speedMultiplier: cfg.ghostSpeedMultiplier,
});
```

Replace the Poppy construction:

```ts
this.poppy = new Poppy(this, TILE_SIZE * 6, TILE_SIZE * 6, {
  patrol: [
    { x: TILE_SIZE * 4, y: TILE_SIZE * 5 },
    { x: TILE_SIZE * 20, y: TILE_SIZE * 5 },
    { x: TILE_SIZE * 20, y: TILE_SIZE * 13 },
    { x: TILE_SIZE * 4, y: TILE_SIZE * 13 },
  ],
  holesPerLevel: cfg.poppyHoles,
});
```

Gate the turtle pickup:

```ts
if (cfg.hasTurtlePickup) {
  this.turtleSpawn = new Pickup(this, TILE_SIZE * 12, TILE_SIZE * 9, "turtle");
  this.physics.add.overlap(this.mailman, this.turtleSpawn, () => {
    this.hasTurtle = true;
    this.turtleSpawn?.destroy();
    this.turtleSpawn = undefined;
  });
}
```

Update `checkWin()` to advance levels and accumulate score:

```ts
private checkWin() {
  const col = Math.floor(this.mailman.x / TILE_SIZE);
  const row = Math.floor(this.mailman.y / TILE_SIZE);
  if (col === DOOR_COL && row === DOOR_ROW) {
    this.won = true;
    const cfg = LEVELS[this.levelIndex]!;
    const timeBonus = Math.max(0, Math.floor((cfg.approachLimitSec - this.levelTimeSec) * 50));
    const livesBonus = 1000 * this.livesRemaining;
    const levelScore = timeBonus + livesBonus;
    const newRunScore = this.runScore + levelScore;

    if (this.levelIndex >= LEVELS.length - 1) {
      this.scene.start("Leaderboard", { totalScore: newRunScore });
    } else {
      this.scene.restart({
        levelIndex: this.levelIndex + 1,
        livesRemaining: this.livesRemaining,
        runScore: newRunScore,
      });
    }
  }
}
```

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`
Expected:
- Level 1: Ghost is on the porch and doesn't move. Approach timer is 30s. Beating it advances to level 2.
- Beat all 5 levels → "YOU WIN" screen with a non-zero score.
- Each subsequent level is harder (Ghost sight wider, more holes).

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: level config + 5-level progression"
```

---

## Task 17: HUD

**Goal:** A top-of-screen overlay shows level number, lives, approach timer (during approach phase), level time, and remaining pickup counts.

**Files:**
- Create: `src/ui/Hud.ts`
- Modify: `src/scenes/LevelScene.ts`

- [ ] **Step 1: Write `src/ui/Hud.ts`**

```ts
import Phaser from "phaser";

export class Hud {
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add.text(8, 4, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.55)",
      padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(1000);
  }

  set(opts: {
    levelIndex: number;
    lives: number;
    treats: number;
    squirrelCalls: number;
    hasTurtle: boolean;
    approachActive: boolean;
    approachRemaining: number;
    levelTime: number;
  }) {
    const left = `L${opts.levelIndex + 1}  ❤️${opts.lives}  🥩${opts.treats}  🐿️${opts.squirrelCalls}  🐢${opts.hasTurtle ? 1 : 0}`;
    const timer = opts.approachActive
      ? `  ⏱ approach ${opts.approachRemaining.toFixed(1)}s`
      : `  ⏱ ${opts.levelTime.toFixed(1)}s`;
    this.text.setText(left + timer);
  }
}
```

- [ ] **Step 2: Wire HUD into LevelScene**

In `src/scenes/LevelScene.ts`:

Add import:

```ts
import { Hud } from "../ui/Hud";
```

Add field:

```ts
private hud!: Hud;
```

In `create()` (anywhere after the tile draw):

```ts
this.hud = new Hud(this);
```

In `update(...)`, after dog updates, add:

```ts
this.hud.set({
  levelIndex: this.levelIndex,
  lives: this.livesRemaining,
  treats: this.treatsLeft,
  squirrelCalls: this.squirrelCallsLeft,
  hasTurtle: this.hasTurtle,
  approachActive: this.approachActive,
  approachRemaining: Math.max(0, this.approachLimitSec - this.approachElapsed),
  levelTime: this.levelTimeSec,
});
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
Expected: top-left shows e.g. `L1 ❤️3 🥩3 🐿️2 🐢0 ⏱ approach 28.4s`. After entering the gate, the timer flips to a counting-up level time.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: in-game HUD"
```

---

## Task 18: Touch Input

**Goal:** On touch devices, render a virtual D-pad in the bottom-left and three action buttons in the bottom-right. They produce the same `PlayerIntent` as `KeyboardInput`.

**Files:**
- Create: `src/input/TouchInput.ts`
- Modify: `src/scenes/LevelScene.ts`

- [ ] **Step 1: Write `src/input/TouchInput.ts`**

```ts
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

    // D-pad (bottom-left)
    const padCx = 60;
    const padCy = h - 60;
    const r = 40;
    const padBg = scene.add.circle(padCx, padCy, r, 0xffffff, 0.15).setScrollFactor(0).setDepth(900);
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
    this.makeButton(scene, padCx, padCy - r * 2 - 10, "S", () => { this.sneak = true; }, () => { this.sneak = false; });

    // Action buttons (bottom-right)
    const actX = w - 60;
    const actY = h - 60;
    this.makeButton(scene, actX - 50, actY - 30, "🥩", () => this.press(this.treat), () => this.release(this.treat));
    this.makeButton(scene, actX,      actY - 30, "🐿️", () => this.press(this.squirrel), () => this.release(this.squirrel));
    this.makeButton(scene, actX - 25, actY + 30, "🐢", () => this.press(this.turtle), () => this.release(this.turtle));
  }

  private shouldShow(): boolean {
    return typeof window !== "undefined" && "ontouchstart" in window;
  }

  private makeButton(
    scene: Phaser.Scene, x: number, y: number, label: string,
    onDown: () => void, onUp: () => void,
  ) {
    const r = 22;
    const btn = scene.add.circle(x, y, r, 0xffffff, 0.2).setScrollFactor(0).setDepth(900).setInteractive();
    scene.add.text(x, y, label, { fontSize: "18px", color: "#ffffff" })
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
```

- [ ] **Step 2: Wire TouchInput into LevelScene**

In `src/scenes/LevelScene.ts`:

Add import:

```ts
import { TouchInput } from "../input/TouchInput";
```

Add field:

```ts
private touch!: TouchInput;
```

In `create()`:

```ts
this.touch = new TouchInput(this);
```

In `update()`, change the intent read to merge:

```ts
const k = this.keyboard.read();
const t = this.touch.read();
const intent = {
  moveX: k.moveX || t.moveX,
  moveY: k.moveY || t.moveY,
  sneak: k.sneak || t.sneak,
  dropTreat: k.dropTreat || t.dropTreat,
  squirrelCall: k.squirrelCall || t.squirrelCall,
  dropTurtle: k.dropTurtle || t.dropTurtle,
};
```

- [ ] **Step 3: Verify in browser DevTools (mobile emulation)**

Run: `npm run dev`. Open DevTools → toggle device toolbar (Ctrl+Shift+M) → choose a phone profile.
Expected:
- Translucent D-pad bottom-left, sneak button above it, three action buttons bottom-right.
- Touching the D-pad moves the mailman; tapping action buttons drops pickups.
- Keyboard still works on desktop (the D-pad is hidden when no touch support).

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: touch input for mobile"
```

---

## Task 19: Local Scoring (TDD)

**Goal:** Pure scoring math + a localStorage wrapper that records best run total and best per-level times.

**Files:**
- Create: `src/score/scoring.ts`
- Create: `src/score/scoring.test.ts`
- Create: `src/score/localScores.ts`
- Modify: `src/scenes/LevelScene.ts` (replace inline score calc with `scoring.ts`)

- [ ] **Step 1: Write the failing scoring tests**

```ts
// src/score/scoring.test.ts
import { describe, it, expect } from "vitest";
import { calcLevelScore } from "./scoring";

describe("calcLevelScore", () => {
  it("rewards remaining lives", () => {
    const s = calcLevelScore({ approachLimitSec: 30, levelTimeSec: 30, livesRemaining: 3 });
    expect(s).toBe(3000);
  });

  it("rewards time remaining", () => {
    const s = calcLevelScore({ approachLimitSec: 30, levelTimeSec: 20, livesRemaining: 0 });
    expect(s).toBe(500); // 10 sec × 50
  });

  it("clamps time bonus to zero when over the limit", () => {
    const s = calcLevelScore({ approachLimitSec: 30, levelTimeSec: 45, livesRemaining: 1 });
    expect(s).toBe(1000); // only the lives bonus
  });

  it("combines both bonuses", () => {
    const s = calcLevelScore({ approachLimitSec: 30, levelTimeSec: 25, livesRemaining: 2 });
    expect(s).toBe(2250); // 250 + 2000
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`

- [ ] **Step 3: Write `src/score/scoring.ts`**

```ts
export interface LevelScoreInput {
  approachLimitSec: number;
  levelTimeSec: number;
  livesRemaining: number;
}

export function calcLevelScore({ approachLimitSec, levelTimeSec, livesRemaining }: LevelScoreInput): number {
  const timeBonus = Math.max(0, Math.floor((approachLimitSec - levelTimeSec) * 50));
  const livesBonus = 1000 * livesRemaining;
  return timeBonus + livesBonus;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`

- [ ] **Step 5: Write `src/score/localScores.ts`**

```ts
const KEY = "ghostys-world.scores.v1";

export interface LocalScores {
  bestRunTotal: number;
  bestLevelTimes: number[]; // index = level, value = best seconds (Infinity if unset)
}

const DEFAULT: LocalScores = {
  bestRunTotal: 0,
  bestLevelTimes: [Infinity, Infinity, Infinity, Infinity, Infinity],
};

export function loadLocalScores(): LocalScores {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT, bestLevelTimes: [...DEFAULT.bestLevelTimes] };
    const parsed = JSON.parse(raw) as Partial<LocalScores>;
    return {
      bestRunTotal: parsed.bestRunTotal ?? 0,
      bestLevelTimes: parsed.bestLevelTimes ?? [...DEFAULT.bestLevelTimes],
    };
  } catch {
    return { ...DEFAULT, bestLevelTimes: [...DEFAULT.bestLevelTimes] };
  }
}

export function saveRunTotal(total: number) {
  const cur = loadLocalScores();
  if (total > cur.bestRunTotal) {
    cur.bestRunTotal = total;
    localStorage.setItem(KEY, JSON.stringify(cur));
  }
}

export function saveLevelTime(levelIndex: number, timeSec: number) {
  const cur = loadLocalScores();
  if (timeSec < (cur.bestLevelTimes[levelIndex] ?? Infinity)) {
    cur.bestLevelTimes[levelIndex] = timeSec;
    localStorage.setItem(KEY, JSON.stringify(cur));
  }
}
```

- [ ] **Step 6: Use scoring in LevelScene**

In `src/scenes/LevelScene.ts` add imports:

```ts
import { calcLevelScore } from "../score/scoring";
import { saveLevelTime, saveRunTotal } from "../score/localScores";
```

Replace the body of `checkWin()`:

```ts
private checkWin() {
  const col = Math.floor(this.mailman.x / TILE_SIZE);
  const row = Math.floor(this.mailman.y / TILE_SIZE);
  if (col !== DOOR_COL || row !== DOOR_ROW) return;
  this.won = true;
  const cfg = LEVELS[this.levelIndex]!;
  const levelScore = calcLevelScore({
    approachLimitSec: cfg.approachLimitSec,
    levelTimeSec: this.levelTimeSec,
    livesRemaining: this.livesRemaining,
  });
  saveLevelTime(this.levelIndex, this.levelTimeSec);
  const newRunScore = this.runScore + levelScore;

  if (this.levelIndex >= LEVELS.length - 1) {
    saveRunTotal(newRunScore);
    this.scene.start("Leaderboard", { totalScore: newRunScore });
  } else {
    this.scene.restart({
      levelIndex: this.levelIndex + 1,
      livesRemaining: this.livesRemaining,
      runScore: newRunScore,
    });
  }
}
```

- [ ] **Step 7: Verify in browser**

Run: `npm run dev`
Beat at least one level, then refresh. In DevTools → Application → Local Storage → `ghostys-world.scores.v1`, expect a non-default JSON object. Beat all 5 levels and verify `bestRunTotal` updates only when you beat your previous best.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: scoring math + localStorage best scores"
```

---

## Task 20: Audio SFX

**Goal:** Place CC0 SFX files under `public/assets/audio/` and play them at the right moments.

**Files:**
- Create: `public/assets/audio/bark.mp3`, `toot.mp3`, `chime.mp3`, `dig.mp3`, `treat-eat.mp3`, `alert.mp3`, `step.mp3` (download from Kenney audio packs or freesound.org — all CC0)
- Create: `src/audio/sfx.ts`
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/scenes/LevelScene.ts`
- Modify: `src/entities/Poppy.ts`
- Modify: `src/entities/Ghost.ts`

- [ ] **Step 1: Write `src/audio/sfx.ts`**

```ts
import Phaser from "phaser";

export type SfxKey = "bark" | "toot" | "chime" | "dig" | "treat" | "alert" | "step";

const FILES: Record<SfxKey, string> = {
  bark: "/assets/audio/bark.mp3",
  toot: "/assets/audio/toot.mp3",
  chime: "/assets/audio/chime.mp3",
  dig: "/assets/audio/dig.mp3",
  treat: "/assets/audio/treat-eat.mp3",
  alert: "/assets/audio/alert.mp3",
  step: "/assets/audio/step.mp3",
};

export function preloadSfx(scene: Phaser.Scene) {
  for (const [k, path] of Object.entries(FILES)) {
    scene.load.audio(`sfx-${k}`, path);
  }
}

export function play(scene: Phaser.Scene, key: SfxKey, volume = 0.6) {
  if (!scene.sound) return;
  scene.sound.play(`sfx-${key}`, { volume });
}
```

- [ ] **Step 2: Preload in BootScene**

Update `src/scenes/BootScene.ts`:

```ts
import Phaser from "phaser";
import { preloadSfx } from "../audio/sfx";

export class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }

  preload() {
    this.load.image("placeholder", "/assets/placeholder.png");
    preloadSfx(this);
  }

  create() {
    this.scene.start("Title");
  }
}
```

- [ ] **Step 3: Play sounds at key moments**

In `src/entities/Poppy.ts`, add at the top:

```ts
import { play } from "../audio/sfx";
```

In the bark transition (`if (sees && this.fsm.current === "IDLE")`), add:

```ts
play(this.scene, "bark");
```

In `digHole()` end:

```ts
play(this.scene, "dig");
```

In `src/entities/Ghost.ts`, add at the top:

```ts
import { play } from "../audio/sfx";
```

Ghost has **no detection audio cue** by design (spec: "no bark, only footstep sound when chasing"). At the start of `tickChase`, throttle a footstep:

```ts
private nextStepAt = 0;
```

Inside `tickChase`, before `this.setVelocity(...)`:

```ts
const now = this.scene.time.now;
if (now >= this.nextStepAt) {
  play(this.scene, "step", 0.3);
  this.nextStepAt = now + 350;
}
```

In `src/scenes/LevelScene.ts`:

- On level win (`checkWin`, before scene.start/restart): `play(this, "chime");`
- On `applyPickupEffects` for treat distract: `play(this, "treat");`
- On `maybeToot`: `play(this, "toot");`

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`
Expected: barking when Poppy spots the mailman, soft alert chime when Ghost spots, dig sound when a hole appears, eat sound when treat is consumed, toot when both dogs collide, chime on level win.

If any audio file is missing, Phaser will log a 404. Acceptable to ship a subset; just ensure the paths in `FILES` match files that actually exist.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: SFX wired to gameplay events"
```

---

## Task 21: Leaderboard API (TDD)

**Goal:** Vercel serverless function at `/api/leaderboard` that supports `GET` (top 10) and `POST` (submit `{ name, score }`). Backed by Upstash Redis sorted set. Tested with a mocked client.

**Files:**
- Create: `api/leaderboard.ts`
- Create: `tests/api/leaderboard.test.ts`
- Modify: `package.json` (add `@upstash/redis`)
- Modify: `vercel.json`

- [ ] **Step 1: Install Upstash Redis SDK**

```bash
npm install @upstash/redis
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/api/leaderboard.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { handleLeaderboard, type RedisClient } from "../../api/leaderboard";

function fakeRedis(initial: { name: string; score: number }[] = []): RedisClient {
  const sorted = [...initial].sort((a, b) => b.score - a.score);
  return {
    zadd: vi.fn(async (_key, entry) => {
      sorted.push({ name: entry.member, score: entry.score });
      sorted.sort((a, b) => b.score - a.score);
      return 1;
    }),
    zrange: vi.fn(async (_key, _start, _stop, _opts) => {
      const top = sorted.slice(0, 10);
      // Upstash returns flat [member, score, member, score, ...]
      return top.flatMap((e) => [e.name, e.score]);
    }),
  } as unknown as RedisClient;
}

describe("handleLeaderboard", () => {
  let redis: RedisClient;

  beforeEach(() => {
    redis = fakeRedis([
      { name: "ALICE", score: 1000 },
      { name: "BOB", score: 800 },
    ]);
  });

  it("GET returns top 10 in descending order", async () => {
    const res = await handleLeaderboard({ method: "GET" }, redis);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      entries: [
        { name: "ALICE", score: 1000 },
        { name: "BOB", score: 800 },
      ],
    });
  });

  it("POST with valid payload writes and returns the new top 10", async () => {
    const res = await handleLeaderboard(
      { method: "POST", body: { name: "CHARLIE", score: 1500 } },
      redis,
    );
    expect(res.status).toBe(200);
    expect(res.body.entries[0]).toEqual({ name: "CHARLIE", score: 1500 });
  });

  it("POST rejects names longer than 16 chars", async () => {
    const res = await handleLeaderboard(
      { method: "POST", body: { name: "X".repeat(20), score: 100 } },
      redis,
    );
    expect(res.status).toBe(400);
  });

  it("POST rejects non-numeric score", async () => {
    const res = await handleLeaderboard(
      { method: "POST", body: { name: "OK", score: "lots" as unknown as number } },
      redis,
    );
    expect(res.status).toBe(400);
  });

  it("POST rejects negative score", async () => {
    const res = await handleLeaderboard(
      { method: "POST", body: { name: "OK", score: -1 } },
      redis,
    );
    expect(res.status).toBe(400);
  });

  it("returns 405 for unsupported methods", async () => {
    const res = await handleLeaderboard({ method: "DELETE" }, redis);
    expect(res.status).toBe(405);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`

- [ ] **Step 4: Implement `api/leaderboard.ts`**

```ts
import { Redis } from "@upstash/redis";

export interface RedisClient {
  zadd: (key: string, entry: { score: number; member: string }) => Promise<number | null>;
  zrange: (key: string, start: number, stop: number, opts: { rev: true; withScores: true }) => Promise<(string | number)[]>;
}

const KEY = "ghostys-world:scores:v1";

export interface ApiRequest {
  method: string;
  body?: { name?: unknown; score?: unknown };
}

export interface ApiResponse {
  status: number;
  body: { entries: { name: string; score: number }[] } | { error: string };
}

export async function handleLeaderboard(req: ApiRequest, redis: RedisClient): Promise<ApiResponse> {
  if (req.method === "GET") {
    return { status: 200, body: { entries: await readTop(redis) } };
  }
  if (req.method === "POST") {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const score = req.body?.score;
    if (!name || name.length > 16) return { status: 400, body: { error: "invalid name" } };
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0) {
      return { status: 400, body: { error: "invalid score" } };
    }
    await redis.zadd(KEY, { score, member: name });
    return { status: 200, body: { entries: await readTop(redis) } };
  }
  return { status: 405, body: { error: "method not allowed" } };
}

async function readTop(redis: RedisClient): Promise<{ name: string; score: number }[]> {
  const raw = await redis.zrange(KEY, 0, 9, { rev: true, withScores: true });
  const out: { name: string; score: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    out.push({ name: String(raw[i]), score: Number(raw[i + 1]) });
  }
  return out;
}

// Vercel function entry point — only used in production. Tests call handleLeaderboard directly.
export default async function (req: { method?: string; body?: unknown }, res: { status: (n: number) => { json: (b: unknown) => void } }) {
  const redis = Redis.fromEnv() as unknown as RedisClient;
  const apiReq: ApiRequest = {
    method: req.method ?? "GET",
    body: typeof req.body === "object" && req.body !== null
      ? req.body as { name?: unknown; score?: unknown }
      : undefined,
  };
  const result = await handleLeaderboard(apiReq, redis);
  res.status(result.status).json(result.body);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: all 6 leaderboard tests pass.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: leaderboard API with Upstash Redis backend"
```

---

## Task 22: Leaderboard Scene + Name Entry

**Goal:** After winning all 5 levels, prompt for a name (max 16 chars), POST to `/api/leaderboard`, then display top 10.

**Files:**
- Create: `src/score/globalScores.ts`
- Modify: `src/scenes/LeaderboardScene.ts`

- [ ] **Step 1: Write `src/score/globalScores.ts`**

```ts
export interface LeaderboardEntry {
  name: string;
  score: number;
}

export async function fetchTop(): Promise<LeaderboardEntry[]> {
  const r = await fetch("/api/leaderboard");
  if (!r.ok) return [];
  const j = await r.json() as { entries?: LeaderboardEntry[] };
  return j.entries ?? [];
}

export async function submitScore(name: string, score: number): Promise<LeaderboardEntry[]> {
  const r = await fetch("/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, score }),
  });
  if (!r.ok) return [];
  const j = await r.json() as { entries?: LeaderboardEntry[] };
  return j.entries ?? [];
}
```

- [ ] **Step 2: Replace `src/scenes/LeaderboardScene.ts`**

```ts
import Phaser from "phaser";
import { GAME_W, GAME_H } from "../config";
import { fetchTop, submitScore, type LeaderboardEntry } from "../score/globalScores";

export class LeaderboardScene extends Phaser.Scene {
  private name = "";
  private nameText!: Phaser.GameObjects.Text;
  private listText!: Phaser.GameObjects.Text;
  private status: "entering" | "submitting" | "viewing" = "entering";
  private finalScore = 0;

  constructor() { super("Leaderboard"); }

  create(data: { totalScore?: number }) {
    this.finalScore = data.totalScore ?? 0;
    this.add.text(GAME_W / 2, 60, "YOU WIN", { fontFamily: "monospace", fontSize: "40px", color: "#ffff66" }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 110, `Score: ${this.finalScore}`, { fontFamily: "monospace", fontSize: "20px", color: "#ffffff" }).setOrigin(0.5);

    this.add.text(GAME_W / 2, 160, "Enter name (a-z, max 16):", { fontFamily: "monospace", fontSize: "16px", color: "#aaaaaa" }).setOrigin(0.5);
    this.nameText = this.add.text(GAME_W / 2, 190, "_", { fontFamily: "monospace", fontSize: "28px", color: "#ffffff" }).setOrigin(0.5);

    this.listText = this.add.text(GAME_W / 2, 250, "loading…", { fontFamily: "monospace", fontSize: "16px", color: "#cccccc", align: "center" }).setOrigin(0.5, 0);

    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => this.onKey(e));

    fetchTop().then((entries) => this.renderList(entries));
  }

  private onKey(e: KeyboardEvent) {
    if (this.status !== "entering") return;
    if (e.key === "Enter" && this.name.length > 0) {
      this.status = "submitting";
      this.nameText.setText(this.name + " (submitting…)");
      submitScore(this.name, this.finalScore).then((entries) => {
        this.status = "viewing";
        this.nameText.setText(this.name);
        this.renderList(entries);
        this.add.text(GAME_W / 2, GAME_H - 30, "Press SPACE for title", {
          fontFamily: "monospace", fontSize: "14px", color: "#888888",
        }).setOrigin(0.5);
        this.input.keyboard?.once("keydown-SPACE", () => this.scene.start("Title"));
      });
      return;
    }
    if (e.key === "Backspace") {
      this.name = this.name.slice(0, -1);
    } else if (/^[a-zA-Z0-9]$/.test(e.key) && this.name.length < 16) {
      this.name += e.key.toUpperCase();
    }
    this.nameText.setText(this.name + (this.name.length < 16 ? "_" : ""));
  }

  private renderList(entries: LeaderboardEntry[]) {
    if (entries.length === 0) {
      this.listText.setText("(no scores yet)");
      return;
    }
    const lines = entries.map((e, i) => `${(i + 1).toString().padStart(2, " ")}. ${e.name.padEnd(16, " ")} ${e.score}`);
    this.listText.setText(lines.join("\n"));
  }
}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`
Expected:
- Beat all 5 levels → "YOU WIN" + score → name prompt.
- Type letters → name appears with trailing underscore. Backspace deletes. Enter submits.
- Without Upstash configured, `fetch` will return 500 → list shows "(no scores yet)" and you can't submit successfully. **That's fine for local dev** — the production deploy in Task 23 sets up Upstash.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: leaderboard scene with name entry"
```

---

## Task 23: Production Deploy + Smoke Test

**Goal:** Project deploys to Vercel, Upstash Redis is provisioned via the Vercel Marketplace, and `https://ghostysworld.com` loads the game with a working leaderboard.

**Files:**
- Modify: `vercel.json` (verify)
- Create: `README.md` (minimal)

- [ ] **Step 1: Make sure `vercel.json` works for SPA + API**

Replace `vercel.json` contents:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 2: Write minimal `README.md`**

```markdown
# Ghosty's World

Browser arcade game at [ghostysworld.com](https://ghostysworld.com).

## Local dev

```
npm install
npm run dev    # http://localhost:5173
npm test       # vitest unit tests
npm run build  # type-check + production build
```

## Deploy

Hosted on Vercel. Push to `main` → preview deploy. Promote to production via Vercel UI.

The leaderboard requires Upstash Redis. Provision via Vercel Marketplace (Storage → Upstash); `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or whatever Upstash exposes) are auto-injected into `Redis.fromEnv()`.
```

- [ ] **Step 3: Initial deploy**

If the Vercel CLI is installed and the user is logged in:

```bash
npx vercel --yes
```

Otherwise, push the repo to GitHub and link via the Vercel dashboard:

```bash
gh repo create ghostys-world --private --source . --push
```

…then in the Vercel dashboard, "Add New… → Project" and select `ghostys-world`.

- [ ] **Step 4: Provision Upstash Redis via Marketplace**

In the Vercel dashboard for the project: **Storage → Browse Marketplace → Upstash → Connect**. This auto-injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. (`Redis.fromEnv()` reads either those or the legacy `KV_REST_API_*` names.)

Trigger a redeploy after the integration is connected.

- [ ] **Step 5: Smoke test the production URL**

Open the preview URL (or the production URL once promoted). Verify:
- Title screen loads in under 3 seconds (Network tab: total transfer size).
- SPACE starts level 1; Ghost is asleep on the porch.
- HUD shows correct counts.
- Beat at least one level — chime plays, level 2 starts.
- Open DevTools → Network → `GET /api/leaderboard` returns 200 with `{ "entries": [...] }`.
- Submit a name on the win screen → `POST /api/leaderboard` returns 200 → list updates with your entry.
- Repeat the smoke test on a phone (real device or DevTools mobile emulation): touch controls work and the game runs at near-60 FPS.

- [ ] **Step 6: Point ghostysworld.com at the project**

In Vercel dashboard → Project → Settings → Domains → Add `ghostysworld.com` and `www.ghostysworld.com`. Follow Vercel's DNS instructions at the registrar (likely an A record to Vercel's IP and a CNAME for `www`). Wait for HTTPS provisioning.

- [ ] **Step 7: Commit + tag v0.1.0**

```bash
git add .
git commit -m "chore: vercel config + readme for prod deploy"
git tag v0.1.0
git push --tags
```

---

## Done Criteria

- All Vitest tests green (`npm test`).
- Game playable end-to-end at `https://ghostysworld.com` on desktop and mobile browsers.
- Cold-load under 3 seconds on a 4G phone.
- All 5 levels beatable by a careful player.
- Global leaderboard accepts and displays top-10 scores.
- "Toot stun" emergent moment is visibly funny and discoverable.
