import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/get-api-user";
import {
  exportSummary,
  getSummaryExportFilename,
  type SummaryExportFormat,
} from "@/lib/services/summary-export.service";

const ALLOWED_FORMATS: SummaryExportFormat[] = ["txt", "docx", "pdf"];

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to download summaries." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const format = body.format as SummaryExportFormat;
    const summary = body.summary;

    if (!format || !ALLOWED_FORMATS.includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use txt, docx, or pdf." },
        { status: 400 }
      );
    }

    if (!summary?.shortSummary) {
      return NextResponse.json({ error: "Summary data is required." }, { status: 400 });
    }

    const { buffer, mimeType } = await exportSummary(summary, format);
    const filename = getSummaryExportFilename(summary, format);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Summary export error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export summary" },
      { status: 500 }
    );
  }
}
