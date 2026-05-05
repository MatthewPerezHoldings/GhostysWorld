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
