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
