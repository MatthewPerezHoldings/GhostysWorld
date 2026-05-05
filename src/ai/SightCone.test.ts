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
