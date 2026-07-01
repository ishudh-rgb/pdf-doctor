import { guardToolRateLimit } from "@/lib/server/rate-limiter";

import { NextRequest, NextResponse } from "next/server";

import {

  consumePdfToWordJob,

  getPdfToWordJob,

  readPdfToWordJobOutput,

  releasePdfToWordJob,

} from "@/lib/services/pdf-to-word-jobs.service";

import { assertJobOwner, resolveToolJobOwnerKey } from "@/lib/server/job-owner";

import { sanitizeFilename } from "@/lib/utils/file";



export async function GET(request: NextRequest) {

  const rateLimited = await guardToolRateLimit(request, "pdf-to-word");

  if (rateLimited) return rateLimited;



  const jobId = request.nextUrl.searchParams.get("jobId");

  if (!jobId) {

    return NextResponse.json({ error: "jobId is required" }, { status: 400 });

  }



  const ownerKey = await resolveToolJobOwnerKey(request);

  const peek = await getPdfToWordJob(jobId);



  if (!peek || peek.status !== "done" || (!peek.outputPath && !peek.storagePath)) {

    return NextResponse.json({ error: "File not ready or already downloaded" }, { status: 404 });

  }



  if (!assertJobOwner(peek.ownerKey, ownerKey)) {

    return NextResponse.json({ error: "Access denied" }, { status: 403 });

  }



  const job = await consumePdfToWordJob(jobId);

  if (!job || (!job.outputPath && !job.storagePath)) {

    return NextResponse.json({ error: "File not ready or already downloaded" }, { status: 404 });

  }



  try {

    const buffer = await readPdfToWordJobOutput(job);

    void releasePdfToWordJob(job);



    return new NextResponse(new Uint8Array(buffer), {

      status: 200,

      headers: {

        "Content-Type":

          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        "Content-Disposition": `attachment; filename="${sanitizeFilename(job.filename)}"`,

        "Content-Length": String(buffer.length),

        ...(job.engine ? { "X-Pdf-Engine": job.engine } : {}),

      },

    });

  } catch {

    await releasePdfToWordJob(job);

    return NextResponse.json({ error: "File not found" }, { status: 404 });

  }

}

