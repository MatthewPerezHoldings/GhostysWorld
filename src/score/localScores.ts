const KEY = "ghostys-world.scores.v1";

export interface LocalScores {
  bestRunTotal: number;
  bestLevelTimes: number[]; // index = level, value = best seconds (Infinity if unset)
}

const DEFAULT: LocalScores = {
  bestRunTotal: 0,
  bestLevelTimes: [Infinity, Infinity, Infinity, Infinity, Infinity],
};

export function loadLocalScores(): LocalScores {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT, bestLevelTimes: [...DEFAULT.bestLevelTimes] };
    const parsed = JSON.parse(raw) as Partial<LocalScores>;
    return {
      bestRunTotal: parsed.bestRunTotal ?? 0,
      bestLevelTimes: parsed.bestLevelTimes ?? [...DEFAULT.bestLevelTimes],
    };
  } catch {
    return { ...DEFAULT, bestLevelTimes: [...DEFAULT.bestLevelTimes] };
  }
}

export function saveRunTotal(total: number) {
  const cur = loadLocalScores();
  if (total > cur.bestRunTotal) {
    cur.bestRunTotal = total;
    localStorage.setItem(KEY, JSON.stringify(cur));
  }
}

export function saveLevelTime(levelIndex: number, timeSec: number) {
  const cur = loadLocalScores();
  if (timeSec < (cur.bestLevelTimes[levelIndex] ?? Infinity)) {
    cur.bestLevelTimes[levelIndex] = timeSec;
    localStorage.setItem(KEY, JSON.stringify(cur));
  }
}
