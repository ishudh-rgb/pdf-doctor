import { createReadStream } from "fs";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  consumePdfToWordJob,
  getPdfToWordJob,
  releasePdfToWordJob,
} from "@/lib/services/pdf-to-word-jobs.service";
import { assertJobOwner, resolveJobOwnerKey } from "@/lib/server/job-owner";
import { sanitizeFilename } from "@/lib/utils/file";

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ownerKey = resolveJobOwnerKey(request, user?.id ?? null);
  const peek = getPdfToWordJob(jobId);

  if (!peek || peek.status !== "done" || !peek.outputPath) {
    return NextResponse.json({ error: "File not ready or already downloaded" }, { status: 404 });
  }

  if (!assertJobOwner(peek.ownerKey, ownerKey)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const job = await consumePdfToWordJob(jobId);
  if (!job?.outputPath) {
    return NextResponse.json({ error: "File not ready or already downloaded" }, { status: 404 });
  }

  try {
    const stat = await fs.stat(job.outputPath);
    const stream = createReadStream(job.outputPath);

    stream.on("close", () => {
      void releasePdfToWordJob(job);
    });

    return new NextResponse(stream as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${sanitizeFilename(job.filename)}"`,
        "Content-Length": String(stat.size),
        ...(job.engine ? { "X-Pdf-Engine": job.engine } : {}),
      },
    });
  } catch {
    await releasePdfToWordJob(job);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
