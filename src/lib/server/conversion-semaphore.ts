import { getMaxConcurrentHeavyJobs } from "@/lib/config/runtime-limits";
import {
  acquireHeavyJobLease,
  isDistributedSemaphoreEnabled,
  releaseHeavyJobLease,
} from "@/lib/server/upstash-semaphore";

let activeHeavyJobs = 0;
const waitQueue: Array<() => void> = [];

function releaseLocalSlot() {
  activeHeavyJobs = Math.max(0, activeHeavyJobs - 1);
  const next = waitQueue.shift();
  if (next) next();
}

function acquireLocalSlot(): Promise<void> {
  const max = getMaxConcurrentHeavyJobs();
  if (activeHeavyJobs < max) {
    activeHeavyJobs += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    waitQueue.push(() => {
      activeHeavyJobs += 1;
      resolve();
    });
  });
}

class HeavyJobCapacityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HeavyJobCapacityError";
  }
}

/** Limits parallel heavy conversions across instances (Upstash) or per-process (local fallback). */
export async function withHeavyJobGuard<T>(fn: () => Promise<T>): Promise<T> {
  if (isDistributedSemaphoreEnabled()) {
    const leaseId = await acquireHeavyJobLease();
    if (!leaseId) {
      throw new HeavyJobCapacityError(
        "Server is busy processing other files. Please try again in a moment."
      );
    }
    try {
      return await fn();
    } finally {
      await releaseHeavyJobLease(leaseId);
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new HeavyJobCapacityError(
      "Heavy processing is temporarily unavailable. Please try again shortly."
    );
  }

  await acquireLocalSlot();
  try {
    return await fn();
  } finally {
    releaseLocalSlot();
  }
}

export { HeavyJobCapacityError };
