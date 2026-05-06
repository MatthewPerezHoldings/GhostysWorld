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
