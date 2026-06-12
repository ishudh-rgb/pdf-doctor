import type { PdfToWordEngine } from "@/lib/services/pdf-to-word.service";

export type PdfToWordJobStatus = "running" | "done" | "error";

export type PdfToWordJob = {
  progress: number;
  status: PdfToWordJobStatus;
  filename: string;
  engine?: PdfToWordEngine;
  buffer?: Buffer;
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

function purgeExpiredJobs() {
  const store = jobStore();
  const now = Date.now();
  for (const [id, job] of store.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) {
      store.delete(id);
    }
  }
}

export function createPdfToWordJob(filename: string): string {
  purgeExpiredJobs();
  const id = crypto.randomUUID();
  jobStore().set(id, {
    progress: 0,
    status: "running",
    filename,
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
  payload: { buffer: Buffer; engine: PdfToWordEngine }
) {
  const job = jobStore().get(jobId);
  if (!job) return;
  job.status = "done";
  job.progress = 100;
  job.buffer = payload.buffer;
  job.engine = payload.engine;
}

export function failPdfToWordJob(jobId: string, error: string) {
  const job = jobStore().get(jobId);
  if (!job) return;
  job.status = "error";
  job.error = error;
}

export function getPdfToWordJob(jobId: string): PdfToWordJob | undefined {
  purgeExpiredJobs();
  return jobStore().get(jobId);
}

export function consumePdfToWordJob(jobId: string): PdfToWordJob | undefined {
  const job = getPdfToWordJob(jobId);
  if (!job || job.status !== "done" || !job.buffer) return undefined;
  jobStore().delete(jobId);
  return job;
}
