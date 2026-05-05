// Yard layout — 25 cols × 18 rows. Coordinates are [col, row] (x, y).
// 'G' = grass, 'F' = fence, 'S' = sidewalk, 'D' = front door, 'P' = porch, '.' = path
export const YARD_LAYOUT: readonly string[] = [
  "SSSSSSSSSSSSSSSSSSSSSSSSS", // 0   sidewalk
  "FFFFFFFFFFFF.FFFFFFFFFFFF", // 1   fence with gate at col 12
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 2
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 3
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 4
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 5
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 6
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 7
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 8
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 9
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 10
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 11
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 12
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 13
  "FGGGGGGGGGGGGGGGGGGGGGGGF", // 14
  "FGGGGGGGGGGGGPPPPPGGGGGGF", // 15  porch
  "FGGGGGGGGGGGGPPDPPGGGGGGF", // 16  door at col 14
  "FFFFFFFFFFFFFFFFFFFFFFFFF", // 17  back fence
];

export const TILE_COLORS: Record<string, number> = {
  G: 0x4a8c3a, // grass
  F: 0x6b4a2a, // fence (brown)
  S: 0x999999, // sidewalk
  D: 0x3a3a8a, // door (blue)
  P: 0xb38b4d, // porch (tan)
  ".": 0xc7b87a, // gate path
};

export const GATE_COL = 12;
export const GATE_ROW = 1;
export const DOOR_COL = 14;
export const DOOR_ROW = 16;

export function getTile(col: number, row: number): string {
  const line = YARD_LAYOUT[row];
  if (!line) return "G";
  const ch = line[col];
  return ch ?? "G";
}

export function isWalkable(col: number, row: number): boolean {
  const t = getTile(col, row);
  return t === "G" || t === "S" || t === "P" || t === "D" || t === ".";
}
