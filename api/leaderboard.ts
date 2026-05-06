import { Redis } from "@upstash/redis";

export interface RedisClient {
  zadd: (key: string, entry: { score: number; member: string }) => Promise<number | null>;
  zrange: (key: string, start: number, stop: number, opts: { rev: true; withScores: true }) => Promise<(string | number)[]>;
}

const KEY = "ghostys-world:scores:v1";

export interface ApiRequest {
  method: string;
  body?: { name?: unknown; score?: unknown };
}

export interface ApiResponse {
  status: number;
  body: { entries: { name: string; score: number }[] } | { error: string };
}

export async function handleLeaderboard(req: ApiRequest, redis: RedisClient): Promise<ApiResponse> {
  if (req.method === "GET") {
    return { status: 200, body: { entries: await readTop(redis) } };
  }
  if (req.method === "POST") {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const score = req.body?.score;
    if (!name || name.length > 16) return { status: 400, body: { error: "invalid name" } };
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0) {
      return { status: 400, body: { error: "invalid score" } };
    }
    await redis.zadd(KEY, { score, member: name });
    return { status: 200, body: { entries: await readTop(redis) } };
  }
  return { status: 405, body: { error: "method not allowed" } };
}

async function readTop(redis: RedisClient): Promise<{ name: string; score: number }[]> {
  const raw = await redis.zrange(KEY, 0, 9, { rev: true, withScores: true });
  const out: { name: string; score: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    out.push({ name: String(raw[i]), score: Number(raw[i + 1]) });
  }
  return out;
}

// Vercel function entry point — only used in production. Tests call handleLeaderboard directly.
export default async function (req: { method?: string; body?: unknown }, res: { status: (n: number) => { json: (b: unknown) => void } }) {
  const redis = Redis.fromEnv() as unknown as RedisClient;
  const apiReq: ApiRequest = {
    method: req.method ?? "GET",
    body: typeof req.body === "object" && req.body !== null
      ? req.body as { name?: unknown; score?: unknown }
      : undefined,
  };
  const result = await handleLeaderboard(apiReq, redis);
  res.status(result.status).json(result.body);
}
