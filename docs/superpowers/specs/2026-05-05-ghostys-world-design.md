# Ghosty's World — Design Spec

**Date:** 2026-05-05
**Domain:** ghostysworld.com
**Status:** Design approved, ready for implementation plan

## Premise

A single-screen, top-down arcade puzzle game. The player controls a mailman trying to drop a letter through the slot in the front door of Matthew's mom's house. Two dogs play defense:

- **Ghost** — 6yo Irish Wolfhound. Tall, fast, silent, hyperfocused. The real threat.
- **Poppy** — 1yo Golden Retriever. Loud, fast, clumsy, easily distracted.

The mailman has 3 lives. Get past both dogs to deliver the mail. Make it through 5 escalating levels in the same yard for a high score.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Engine | **Phaser 3** | Mature, browser-native 2D engine; built for top-down arcade games |
| Language | **TypeScript** | Type safety for the dog AI state machines, easier refactoring |
| Build | **Vite** | Fast HMR, first-class TS support, tiny config |
| Hosting | **Vercel** | Matthew's default; deploys on git push; free tier covers it |
| High scores | **Upstash Redis** (Vercel Marketplace) | Tiny global leaderboard backend; sub-200ms reads; free tier |
| Art | **Kenney.nl pixel asset packs (CC0)** + custom Ghost/Poppy sprites | Free, consistent, fast to assemble |
| Audio | **Free CC0 SFX** (freesound.org / Kenney audio packs) | Bark, toot, footsteps, mail-deliver chime |

## Scope

**Tight arcade game — ship in 1–2 weeks.**

- 1 yard (Matthew's mom's house front yard)
- 5 hand-designed levels using the same yard, escalating difficulty
- 3 lives, then game over → restart from level 1
- Local high score (best score, best time)
- Global leaderboard (top 10, name + score)
- Desktop + mobile playable

## Game Loop

```
[Title screen] → [Level 1] → ... → [Level 5] → [Win screen + leaderboard entry]
                     ↓ (3 deaths)
                [Game over → restart from level 1]
```

Each level:

1. **Approach phase.** Mailman spawns on sidewalk outside the gate. Top-of-screen "Dog Awareness" meter starts filling. Player must enter the gate before it hits 100%.
2. **Yard phase.** Mailman is inside the fence. Navigate around dog patrols, obstacles, and Poppy's holes to reach the front door tile.
3. **Deliver.** Step onto door tile → mailman shoves letter through slot → level complete, score + time recorded.

## Characters

### Ghost — Silent Hyperfocused Threat

| Attribute | Value |
|---|---|
| Sprite | Tall gray Irish Wolfhound, custom-drawn over Kenney dog base |
| Speed | Fast (1.2× mailman walk, 0.9× mailman dash) |
| Sight cone | Long and wide — covers ~⅓ of the yard |
| Audio cue | **None** (no bark) — only footstep sound when chasing |
| Patrol | Walks slow figure-8 between porch and yard center; sometimes lays in grass |
| State machine | `IDLE → ALERT (saw mailman) → CHASE → DISTRACTED (treat or Poppy nearby) → IDLE` |
| Distractions | Treat (~1 sec freeze, eats it), Poppy entering his sight cone (~0.5 sec disengage), turtle (3 sec flee) |
| **Not** distracted by | Squirrels, sounds, anything the player throws |

### Poppy — Loud Chaotic Threat

| Attribute | Value |
|---|---|
| Sprite | Smaller golden retriever, custom-drawn over Kenney dog base |
| Speed | Faster than Ghost (1.4× mailman walk) but wide turning radius |
| Sight cone | Short but 360° (sniffs in all directions) |
| Audio cue | **Loud bark** when she spots the mailman (player gets ~0.5 sec warning) |
| Patrol | Zooms erratically around the yard; periodically charges Ghost to sniff his butt |
| State machine | `IDLE → BARKING (alert) → CHASE → DISTRACTED (squirrel/Ghost-butt) → IDLE` |
| Distractions | Squirrel call (chases the noise off-screen for 3 sec), Ghost (auto, see "Toot Stun"), turtle (3 sec flee) |
| Hazard she creates | **Holes** — Poppy digs 1 hole per level at a random yard tile. Mailman stepping on a hole = trip animation, frozen 1 sec |

### The Toot Stun (signature move)

When Poppy is within 1 tile of Ghost, she sniffs his butt → **Ghost toots on her** → both dogs frozen in a coughing/dust-cloud animation for **2 seconds**. Window for the mailman to slip past. Skilled players intentionally lure Poppy near Ghost to trigger this.

## Mailman — Player Verbs

| Action | Input (Desktop) | Input (Mobile) | Effect |
|---|---|---|---|
| Move | WASD / Arrow keys | Tap-to-move + virtual D-pad | Walk |
| Sneak | Hold `Shift` | Hold sneak button | Half speed; Ghost's sight cone shrinks 50% |
| Drop treat 🥩 | `1` | Treat button | Freezes Ghost ~1 sec at drop location. **3 per level.** |
| Squirrel call 🐿️ | `2` | Squirrel button | Lures Poppy to noise origin for ~3 sec. **2 per level.** |
| Drop turtle 🐢 | `3` | Turtle button | Both dogs flee 3-tile radius for ~3 sec. **1 per level**, found mid-yard as pickup. |
| Deliver mail 📬 | (auto on door tile) | (auto on door tile) | Win the level |

## Lose Conditions

1. **Dog hitbox overlaps mailman hitbox** (Phaser Arcade Physics) → caught animation, lose 1 life, restart level. Hitboxes are slightly smaller than sprite to avoid feeling unfair.
2. **Approach timer hits 100% before mailman enters fence** → both dogs vault the fence in a coordinated rush, mailman flees, lose 1 life, restart level.
3. **0 lives remaining** → Game Over screen, restart from level 1.

## Level Progression (same yard, escalating difficulty)

| Lvl | Tutorial / change | Approach timer | Treats | Squirrel calls | Other |
|---|---|---|---|---|---|
| **1** | Tutorial. Only Poppy patrols. Ghost asleep on porch entire level. | 30 sec | 3 | 2 | — |
| **2** | Both dogs active. Standard patrol patterns. | 25 sec | 3 | 2 | — |
| **3** | Poppy starts with a tennis ball (chases it on her own, less predictable). Ghost sight cone +20%. | 20 sec | 3 | 2 | — |
| **4** | Poppy digs **2 holes** instead of 1. Ghost moves 10% faster. | 18 sec | 2 | 1 | — |
| **5** | Boss-style. Ghost sight cone covers ½ the yard. Poppy digs 3 holes. **Turtle pickup spawns** to make it possible. | 15 sec | 2 | 1 | Turtle is the win key |

## Scoring

- **Per-level score:** `(time_remaining_bonus + (1000 × lives_remaining))`
- **Run total:** sum of all 5 levels
- **High scores:** local (best run total, best per-level time) + global top-10 leaderboard

## Audio

CC0 SFX only — no music track:

- Footsteps (mailman, Ghost), Poppy bark, Ghost toot, mail-slot delivery chime, dog-noticed alert, dig sound, treat eat, turtle flee, level complete jingle.

## Visual & Technical Architecture

```
ghostys-world/
├── src/
│   ├── main.ts                  # Phaser game bootstrap
│   ├── scenes/
│   │   ├── BootScene.ts         # Asset preload
│   │   ├── TitleScene.ts        # Title + start
│   │   ├── LevelScene.ts        # The actual game (one instance per level)
│   │   ├── GameOverScene.ts
│   │   └── LeaderboardScene.ts
│   ├── entities/
│   │   ├── Mailman.ts           # Player controller
│   │   ├── Ghost.ts             # Wolfhound AI
│   │   ├── Poppy.ts             # Retriever AI
│   │   └── Pickup.ts            # Treat/squirrel/turtle base class
│   ├── ai/
│   │   ├── DogStateMachine.ts   # Shared base
│   │   ├── SightCone.ts         # Vision system
│   │   └── Patrol.ts            # Patrol path logic
│   ├── levels/
│   │   └── levels.ts            # Level config data (5 levels)
│   ├── input/
│   │   ├── KeyboardInput.ts
│   │   └── TouchInput.ts        # Mobile virtual buttons
│   ├── score/
│   │   ├── localScores.ts       # localStorage wrapper
│   │   └── globalScores.ts      # Calls /api/leaderboard
│   └── audio/
│       └── sfx.ts
├── public/assets/               # Sprites, audio, tilemap
├── api/
│   └── leaderboard.ts           # Vercel function — GET top 10, POST submit
├── index.html
├── vite.config.ts
├── package.json
└── vercel.json
```

**Key isolation principles:**

- Each dog is its own class with its own state machine — independent, testable.
- Level config is data (`levels.ts`), not code — easy to tune difficulty without touching engine.
- Input layer is abstracted so keyboard and touch produce the same `PlayerIntent` events.
- Backend is one Vercel serverless function; everything else is static.

## Open Questions (Implementation-Time, Not Brainstorm)

These are decisions to make during implementation, not now:

- Exact tile size (likely 32×32) and yard dimensions
- Final font choice for HUD (likely a free pixel font like "Press Start 2P")
- Whether Ghost/Poppy sprites are commissioned, AI-generated, or hand-edited from Kenney base
- Whether to add subtle ambient yard sounds (birds, wind) — punted to post-launch polish
- Mobile UI layout (D-pad position, action button arrangement) — designed during implementation; the **set** of buttons (move, sneak, treat, squirrel, turtle) is fixed by this spec

## Out of Scope (For Now)

- Multiple yards / different houses
- Multiplayer (friend plays as Ghost)
- Story / cutscenes
- Custom mailman characters
- Mobile app wrapper (it's a web game; works on phone via browser)

These belong in a "Ghosty's World v2" if the game gets traction.

## Success Criteria

- Game playable end-to-end at ghostysworld.com on desktop and mobile browsers
- Cold-load in under 3 seconds on a 4G phone
- 60 FPS on a mid-range phone
- All 5 levels beatable by a careful player
- Global leaderboard accepts and displays top-10 scores
- "Toot stun" emergent moment is visibly funny and discoverable
