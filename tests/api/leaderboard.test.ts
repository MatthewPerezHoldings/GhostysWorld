import { describe, it, expect, beforeEach, vi } from "vitest";
import { handleLeaderboard, type RedisClient } from "../../api/leaderboard";

function fakeRedis(initial: { name: string; score: number }[] = []): RedisClient {
  const sorted = [...initial].sort((a, b) => b.score - a.score);
  return {
    zadd: vi.fn(async (_key, entry) => {
      sorted.push({ name: entry.member, score: entry.score });
      sorted.sort((a, b) => b.score - a.score);
      return 1;
    }),
    zrange: vi.fn(async (_key, _start, _stop, _opts) => {
      const top = sorted.slice(0, 10);
      // Upstash returns flat [member, score, member, score, ...]
      return top.flatMap((e) => [e.name, e.score]);
    }),
  } as unknown as RedisClient;
}

describe("handleLeaderboard", () => {
  let redis: RedisClient;

  beforeEach(() => {
    redis = fakeRedis([
      { name: "ALICE", score: 1000 },
      { name: "BOB", score: 800 },
    ]);
  });

  it("GET returns top 10 in descending order", async () => {
    const res = await handleLeaderboard({ method: "GET" }, redis);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      entries: [
        { name: "ALICE", score: 1000 },
        { name: "BOB", score: 800 },
      ],
    });
  });

  it("POST with valid payload writes and returns the new top 10", async () => {
    const res = await handleLeaderboard(
      { method: "POST", body: { name: "CHARLIE", score: 1500 } },
      redis,
    );
    expect(res.status).toBe(200);
    expect(res.body.entries[0]).toEqual({ name: "CHARLIE", score: 1500 });
  });

  it("POST rejects names longer than 16 chars", async () => {
    const res = await handleLeaderboard(
      { method: "POST", body: { name: "X".repeat(20), score: 100 } },
      redis,
    );
    expect(res.status).toBe(400);
  });

  it("POST rejects non-numeric score", async () => {
    const res = await handleLeaderboard(
      { method: "POST", body: { name: "OK", score: "lots" as unknown as number } },
      redis,
    );
    expect(res.status).toBe(400);
  });

  it("POST rejects negative score", async () => {
    const res = await handleLeaderboard(
      { method: "POST", body: { name: "OK", score: -1 } },
      redis,
    );
    expect(res.status).toBe(400);
  });

  it("returns 405 for unsupported methods", async () => {
    const res = await handleLeaderboard({ method: "DELETE" }, redis);
    expect(res.status).toBe(405);
  });
});
