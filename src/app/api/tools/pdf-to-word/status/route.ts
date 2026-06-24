import { guardToolRateLimit } from "@/lib/server/rate-limiter";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPdfToWordJob } from "@/lib/services/pdf-to-word-jobs.service";
import { assertJobOwner, resolveJobOwnerKey } from "@/lib/server/job-owner";

export async function GET(request: NextRequest) {
  const rateLimited = await guardToolRateLimit(request, "pdf-to-word");
  if (rateLimited) return rateLimited;

  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ownerKey = resolveJobOwnerKey(request, user?.id ?? null);
  const job = getPdfToWordJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found or expired" }, { status: 404 });
  }

  if (!assertJobOwner(job.ownerKey, ownerKey)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json({
    progress: job.progress,
    status: job.status,
    error: job.error ?? null,
    engine: job.engine ?? null,
  });
}
