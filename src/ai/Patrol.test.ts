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
