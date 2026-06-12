import { NextRequest, NextResponse } from "next/server";
import { getPdfToWordJob } from "@/lib/services/pdf-to-word-jobs.service";

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const job = getPdfToWordJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found or expired" }, { status: 404 });
  }

  return NextResponse.json({
    progress: job.progress,
    status: job.status,
    error: job.error ?? null,
    engine: job.engine ?? null,
  });
}
