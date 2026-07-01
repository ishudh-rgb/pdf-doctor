import { randomUUID } from "crypto";
import { getMaxConcurrentHeavyJobs } from "@/lib/config/runtime-limits";
import { getUpstashRedis, isUpstashConfigured } from "@/lib/server/upstash-kv";

const SEMAPHORE_KEY = "pdf-doctor:heavy-jobs:leases";
const LEASE_MS = 10 * 60 * 1000;
const POLL_MS = 200;
const WAIT_TIMEOUT_MS = 120_000;

const ACQUIRE_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local maxJobs = tonumber(ARGV[2])
local leaseId = ARGV[3]
local expireAt = tonumber(ARGV[4])
redis.call('ZREMRANGEBYSCORE', key, '-inf', now)
local active = redis.call('ZCARD', key)
if active < maxJobs then
  redis.call('ZADD', key, expireAt, leaseId)
  return 1
end
return 0
`;

const RELEASE_SCRIPT = `
return redis.call('ZREM', KEYS[1], ARGV[1])
`;

async function tryAcquireLease(): Promise<string | null> {
  const redis = await getUpstashRedis();
  if (!redis) return null;

  const leaseId = randomUUID();
  const now = Date.now();
  const expireAt = now + LEASE_MS;
  const max = getMaxConcurrentHeavyJobs();

  const acquired = (await redis.eval(
    ACQUIRE_SCRIPT,
    [SEMAPHORE_KEY],
    [String(now), String(max), leaseId, String(expireAt)]
  )) as number;

  return acquired === 1 ? leaseId : null;
}

export async function releaseHeavyJobLease(leaseId: string): Promise<void> {
  const redis = await getUpstashRedis();
  if (!redis) return;
  await redis.eval(RELEASE_SCRIPT, [SEMAPHORE_KEY], [leaseId]);
}

/** Acquire a distributed heavy-job slot; polls until timeout. */
export async function acquireHeavyJobLease(): Promise<string | null> {
  if (!isUpstashConfigured()) return null;

  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const leaseId = await tryAcquireLease();
    if (leaseId) return leaseId;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  return null;
}

export function isDistributedSemaphoreEnabled(): boolean {
  return isUpstashConfigured();
}
