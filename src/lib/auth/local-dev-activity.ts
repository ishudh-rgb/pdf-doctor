import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { isLocalDevAuthEnabled } from "@/lib/auth/auth-config";

const DATA_DIR = path.join(process.cwd(), ".data");
const ACTIVITY_FILE = path.join(DATA_DIR, "local-activity.json");
const OUTPUTS_DIR = path.join(DATA_DIR, "outputs");

export interface LocalDevJob {
  id: string;
  user_id: string;
  tool_name: string;
  file_name: string;
  status: "completed" | "failed" | "processing";
  created_at: string;
  file_size_bytes: number;
  storage_path: string | null;
  expires_at: string;
}

export interface LocalDevUsageEntry {
  id: string;
  user_id: string;
  tool_name: string;
  status: "success" | "failed";
  created_at: string;
}

interface LocalActivityDb {
  jobs: LocalDevJob[];
  usage: LocalDevUsageEntry[];
}

function retentionHours(): number {
  const hours = Number(process.env.FILE_RETENTION_HOURS);
  return Number.isFinite(hours) && hours > 0 ? hours : 2;
}

export function isLocalDevActivityEnabled(): boolean {
  return isLocalDevAuthEnabled();
}

async function readDb(): Promise<LocalActivityDb> {
  try {
    const raw = await fs.readFile(ACTIVITY_FILE, "utf8");
    return JSON.parse(raw) as LocalActivityDb;
  } catch {
    return { jobs: [], usage: [] };
  }
}

async function writeDb(data: LocalActivityDb): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ACTIVITY_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function recordLocalDevUsage(data: {
  userId: string;
  toolName: string;
  status: "success" | "failed";
}): Promise<void> {
  if (!isLocalDevActivityEnabled()) return;

  const db = await readDb();
  db.usage.push({
    id: crypto.randomUUID(),
    user_id: data.userId,
    tool_name: data.toolName,
    status: data.status,
    created_at: new Date().toISOString(),
  });
  if (db.usage.length > 2000) {
    db.usage = db.usage.slice(-2000);
  }
  await writeDb(db);
}

export async function recordLocalDevJob(data: {
  userId: string;
  toolName: string;
  fileName: string;
  outputBuffer: Buffer;
}): Promise<LocalDevJob> {
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const expires_at = new Date(
    Date.now() + retentionHours() * 60 * 60 * 1000
  ).toISOString();

  await fs.mkdir(path.join(OUTPUTS_DIR, data.userId), { recursive: true });
  const storage_path = path.join(OUTPUTS_DIR, data.userId, `${id}.bin`);
  await fs.writeFile(storage_path, data.outputBuffer);

  const job: LocalDevJob = {
    id,
    user_id: data.userId,
    tool_name: data.toolName,
    file_name: data.fileName,
    status: "completed",
    created_at,
    file_size_bytes: data.outputBuffer.length,
    storage_path,
    expires_at,
  };

  const db = await readDb();
  db.jobs.unshift(job);
  if (db.jobs.length > 500) {
    db.jobs = db.jobs.slice(0, 500);
  }
  await writeDb(db);
  return job;
}

export async function getLocalDevJobs(
  userId: string,
  limit = 50
): Promise<LocalDevJob[]> {
  if (!isLocalDevActivityEnabled()) return [];
  const db = await readDb();
  return db.jobs.filter((job) => job.user_id === userId).slice(0, limit);
}

export async function getLocalDevDailyUsage(
  userId: string,
  toolName?: string
): Promise<number> {
  if (!isLocalDevActivityEnabled()) return 0;

  const db = await readDb();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return db.usage.filter((entry) => {
    if (entry.user_id !== userId || entry.status !== "success") return false;
    if (new Date(entry.created_at) < todayStart) return false;
    if (toolName && entry.tool_name !== toolName) return false;
    return true;
  }).length;
}

export async function getLocalDevTotalProcessed(userId: string): Promise<number> {
  if (!isLocalDevActivityEnabled()) return 0;
  const db = await readDb();
  return db.jobs.filter(
    (job) => job.user_id === userId && job.status === "completed"
  ).length;
}

export async function getLocalDevJobForDownload(
  jobId: string,
  userId: string
): Promise<LocalDevJob | null> {
  if (!isLocalDevActivityEnabled()) return null;

  const db = await readDb();
  const job = db.jobs.find((entry) => entry.id === jobId && entry.user_id === userId);
  if (!job?.storage_path) return null;
  if (new Date(job.expires_at) < new Date()) return null;

  try {
    await fs.access(job.storage_path);
    return job;
  } catch {
    return null;
  }
}
