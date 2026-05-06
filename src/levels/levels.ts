export interface LevelConfig {
  approachLimitSec: number;
  treats: number;
  squirrelCalls: number;
  ghostSightMultiplier: number;
  ghostSpeedMultiplier: number;
  poppyHoles: number;
  ghostAsleepOnPorch: boolean;
  hasTurtlePickup: boolean;
  hasNokia: boolean;
}

// Hole formula: holes = min(levelNum * 5, 25) — caps at 25 from L5 onward.
export const LEVELS: LevelConfig[] = [
  // Level 1: tutorial — Ghost asleep, only Poppy active
  { approachLimitSec: 30, treats: 3, squirrelCalls: 2, ghostSightMultiplier: 1, ghostSpeedMultiplier: 1, poppyHoles: 5, ghostAsleepOnPorch: true,  hasTurtlePickup: false, hasNokia: false },
  // Level 2
  { approachLimitSec: 25, treats: 3, squirrelCalls: 2, ghostSightMultiplier: 1, ghostSpeedMultiplier: 1, poppyHoles: 10, ghostAsleepOnPorch: false, hasTurtlePickup: false, hasNokia: false },
  // Level 3: Ghost sight +20%
  { approachLimitSec: 20, treats: 3, squirrelCalls: 2, ghostSightMultiplier: 1.2, ghostSpeedMultiplier: 1, poppyHoles: 15, ghostAsleepOnPorch: false, hasTurtlePickup: false, hasNokia: false },
  // Level 4: Ghost +10% speed, fewer pickups, Nokia in the yard
  { approachLimitSec: 18, treats: 2, squirrelCalls: 1, ghostSightMultiplier: 1.2, ghostSpeedMultiplier: 1.1, poppyHoles: 20, ghostAsleepOnPorch: false, hasTurtlePickup: false, hasNokia: true  },
  // Level 5: boss — huge sight, max holes, turtle pickup, Nokia
  { approachLimitSec: 15, treats: 2, squirrelCalls: 1, ghostSightMultiplier: 1.5, ghostSpeedMultiplier: 1.1, poppyHoles: 25, ghostAsleepOnPorch: false, hasTurtlePickup: true,  hasNokia: true  },
];
