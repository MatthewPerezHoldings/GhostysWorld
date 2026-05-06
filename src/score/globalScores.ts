export interface LeaderboardEntry {
  name: string;
  score: number;
}

export async function fetchTop(): Promise<LeaderboardEntry[]> {
  const r = await fetch("/api/leaderboard");
  if (!r.ok) return [];
  const j = await r.json() as { entries?: LeaderboardEntry[] };
  return j.entries ?? [];
}

export async function submitScore(name: string, score: number): Promise<LeaderboardEntry[]> {
  const r = await fetch("/api/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, score }),
  });
  if (!r.ok) return [];
  const j = await r.json() as { entries?: LeaderboardEntry[] };
  return j.entries ?? [];
}
