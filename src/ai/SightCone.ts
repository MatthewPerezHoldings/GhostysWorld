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
  const cosHalfAngle = Math.cos(halfAngle);
  // Use small epsilon for floating-point comparison at boundary
  return cosAngle >= cosHalfAngle - 1e-10;
}
