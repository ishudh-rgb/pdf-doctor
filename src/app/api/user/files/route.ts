import { NextResponse } from "next/server";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getUserJobs } from "@/lib/db/queries";
import { getApiUser } from "@/lib/auth/get-api-user";

type ToolJobRow = {
  id: string;
  tool_name: string;
  status: string;
  created_at: string;
  file_size_bytes: number | null;
  input_files: unknown;
  output_file: unknown;
  completed_at: string | null;
};

type UploadedFileRow = {
  id: string;
  job_id: string | null;
  original_name: string;
  file_size_bytes: number;
  expires_at: string;
  is_deleted: boolean;
};

function formatToolLabel(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function pickFileName(job: ToolJobRow, outputFile?: UploadedFileRow | null): string {
  if (outputFile?.original_name) return outputFile.original_name;

  const output = job.output_file as { name?: string; fileName?: string } | null;
  if (output?.name) return output.name;
  if (output?.fileName) return output.fileName;

  const inputs = job.input_files as Array<{ name?: string; fileName?: string }> | null;
  if (Array.isArray(inputs) && inputs[0]?.name) return inputs[0].name;
  if (Array.isArray(inputs) && inputs[0]?.fileName) return inputs[0].fileName;

  return `${formatToolLabel(job.tool_name)} result`;
}

function mapJobStatus(status: string): "completed" | "processing" | "failed" {
  if (status === "completed") return "completed";
  if (status === "failed") return "failed";
  return "processing";
}

export async function GET() {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ files: [] });
    }

    const serviceClient = await createServiceClient();
    const jobs = (await getUserJobs(user.id, 50)) as ToolJobRow[];

    const jobIds = jobs.map((j) => j.id);
    let outputFiles: UploadedFileRow[] = [];

    if (jobIds.length > 0) {
      const { data, error } = await serviceClient
        .from("uploaded_files")
        .select("id, job_id, original_name, file_size_bytes, expires_at, is_deleted")
        .eq("user_id", user.id)
        .eq("file_type", "output")
        .eq("is_deleted", false)
        .in("job_id", jobIds);

      if (!error && data) {
        outputFiles = data as UploadedFileRow[];
      }
    }

    const outputByJob = new Map<string, UploadedFileRow>();
    for (const file of outputFiles) {
      if (file.job_id && !outputByJob.has(file.job_id)) {
        outputByJob.set(file.job_id, file);
      }
    }

    const now = Date.now();
    const files = jobs.map((job) => {
      const output = outputByJob.get(job.id) ?? null;
      const expired = output
        ? new Date(output.expires_at).getTime() < now
        : job.status === "completed";

      return {
        id: job.id,
        file_name: pickFileName(job, output),
        tool: formatToolLabel(job.tool_name),
        created_at: job.created_at,
        status: mapJobStatus(job.status),
        file_size: output?.file_size_bytes ?? job.file_size_bytes ?? 0,
        download_url:
          output && !expired && job.status === "completed"
            ? `/api/files/${output.id}`
            : null,
        expired,
      };
    });

    return NextResponse.json({ files });
  } catch (err) {
    console.error("GET /api/user/files:", err);
    return NextResponse.json({ files: [] });
  }
}
