import { guardToolRateLimit } from "@/lib/server/rate-limiter";

import { NextRequest, NextResponse } from "next/server";

import { getPdfToWordJob } from "@/lib/services/pdf-to-word-jobs.service";

import { assertJobOwner, resolveToolJobOwnerKey } from "@/lib/server/job-owner";



export async function GET(request: NextRequest) {

  const rateLimited = await guardToolRateLimit(request, "pdf-to-word");

  if (rateLimited) return rateLimited;



  const jobId = request.nextUrl.searchParams.get("jobId");

  if (!jobId) {

    return NextResponse.json({ error: "jobId is required" }, { status: 400 });

  }



  const ownerKey = await resolveToolJobOwnerKey(request);

  const job = await getPdfToWordJob(jobId);



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

