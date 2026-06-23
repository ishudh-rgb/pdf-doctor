import { getMaxConcurrentHeavyJobs } from "@/lib/config/runtime-limits";

let activeHeavyJobs = 0;
const waitQueue: Array<() => void> = [];

function releaseSlot() {
  activeHeavyJobs = Math.max(0, activeHeavyJobs - 1);
  const next = waitQueue.shift();
  if (next) next();
}

function acquireSlot(): Promise<void> {
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

/** Limits parallel heavy conversions (Puppeteer/Python/Office) to protect RAM. */
export async function withHeavyJobGuard<T>(fn: () => Promise<T>): Promise<T> {
  await acquireSlot();
  try {
    return await fn();
  } finally {
    releaseSlot();
  }
}
