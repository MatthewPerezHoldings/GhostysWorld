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
