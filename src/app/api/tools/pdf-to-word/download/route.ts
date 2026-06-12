import { NextRequest, NextResponse } from "next/server";
import { consumePdfToWordJob } from "@/lib/services/pdf-to-word-jobs.service";
import { sanitizeFilename } from "@/lib/utils/file";

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const job = consumePdfToWordJob(jobId);
  if (!job?.buffer) {
    return NextResponse.json({ error: "File not ready or already downloaded" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(job.buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${sanitizeFilename(job.filename)}"`,
      "Content-Length": String(job.buffer.length),
      ...(job.engine ? { "X-Pdf-Engine": job.engine } : {}),
    },
  });
}
