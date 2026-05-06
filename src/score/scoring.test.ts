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
