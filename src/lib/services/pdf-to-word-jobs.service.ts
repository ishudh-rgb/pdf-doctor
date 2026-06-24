import fs from "fs/promises";
import type { PdfToWordEngine } from "@/lib/services/pdf-to-word.service";

export type PdfToWordJobStatus = "running" | "done" | "error";

export type PdfToWordJob = {
  progress: number;
  status: PdfToWordJobStatus;
  filename: string;
  ownerKey: string;
  engine?: PdfToWordEngine;
  /** DOCX on disk — avoids holding large files in Node heap */
  outputPath?: string;
  workDir?: string;
  error?: string;
  createdAt: number;
};

const JOB_TTL_MS = 20 * 60 * 1000;

type JobStore = Map<string, PdfToWordJob>;

function jobStore(): JobStore {
  const globalStore = globalThis as typeof globalThis & { __pdfToWordJobs?: JobStore };
  if (!globalStore.__pdfToWordJobs) {
    globalStore.__pdfToWordJobs = new Map();
  }
  return globalStore.__pdfToWordJobs;
}

async function cleanupJobFiles(job: PdfToWordJob) {
  if (!job.workDir) return;
  await fs.rm(job.workDir, { recursive: true, force: true }).catch(() => {});
}

async function purgeExpiredJobs() {
  const store = jobStore();
  const now = Date.now();
  for (const [id, job] of store.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) {
      await cleanupJobFiles(job);
      store.delete(id);
    }
  }
}

export function createPdfToWordJob(filename: string, ownerKey: string): string {
  void purgeExpiredJobs();
  const id = crypto.randomUUID();
  jobStore().set(id, {
    progress: 0,
    status: "running",
    filename,
    ownerKey,
    createdAt: Date.now(),
  });
  return id;
}

export function updatePdfToWordJobProgress(jobId: string, progress: number) {
  const job = jobStore().get(jobId);
  if (!job || job.status !== "running") return;
  job.progress = Math.max(job.progress, Math.min(99, progress));
}

export function completePdfToWordJob(
  jobId: string,
  payload: { outputPath: string; workDir: string; engine: PdfToWordEngine }
) {
  const job = jobStore().get(jobId);
  if (!job) return;
  job.status = "done";
  job.progress = 100;
  job.outputPath = payload.outputPath;
  job.workDir = payload.workDir;
  job.engine = payload.engine;
}

export function failPdfToWordJob(jobId: string, error: string, workDir?: string) {
  const job = jobStore().get(jobId);
  if (!job) return;
  job.status = "error";
  job.error = error;
  if (workDir) {
    job.workDir = workDir;
    void cleanupJobFiles(job);
  }
}

export function getPdfToWordJob(jobId: string): PdfToWordJob | undefined {
  void purgeExpiredJobs();
  return jobStore().get(jobId);
}

export async function consumePdfToWordJob(jobId: string): Promise<PdfToWordJob | undefined> {
  const job = getPdfToWordJob(jobId);
  if (!job || job.status !== "done" || !job.outputPath) return undefined;
  jobStore().delete(jobId);
  return job;
}

export async function releasePdfToWordJob(job: PdfToWordJob) {
  await cleanupJobFiles(job);
}
