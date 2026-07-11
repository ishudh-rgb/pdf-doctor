import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createTestPdfFile } from "@/test/pdf-fixtures";

vi.mock("@/lib/server/tool-request-guards", () => ({
  beginToolRoute: vi.fn().mockResolvedValue(null),
  handleToolRouteFailure: vi.fn(async (error: unknown) => {
    const { NextResponse } = await import("next/server");
    const message = error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }),
}));

vi.mock("@/lib/auth/tool-mutation-auth", () => ({
  resolveMutationToolUser: vi.fn().mockResolvedValue({ userId: null, denied: null }),
}));

vi.mock("@/lib/services/usage-limit.service", () => ({
  checkUsageLimit: vi.fn().mockResolvedValue({ allowed: true }),
  checkFileSizeLimit: vi.fn().mockResolvedValue({ maxSizeMB: 25 }),
}));

vi.mock("@/lib/services/user-tool-context.service", () => ({
  resolveToolUserContext: vi.fn().mockResolvedValue({ maxSizeMB: 25, isPro: false }),
}));

vi.mock("@/lib/db/queries", () => ({
  logToolUsage: vi.fn().mockResolvedValue(undefined),
  logError: vi.fn().mockResolvedValue(undefined),
}));

function buildMergeRequest(files: File[]): NextRequest {
  const form = new FormData();
  for (const file of files) {
    form.append("files", file, file.name);
  }
  return new NextRequest("http://localhost/api/tools/merge-pdf", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/tools/merge-pdf", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 400 when fewer than two files are posted", async () => {
    const file = await createTestPdfFile("only.pdf");
    const { POST } = await import("./route");
    const res = await POST(buildMergeRequest([file]));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/at least 2/i);
  });

  it("returns merged PDF bytes for two valid PDFs", async () => {
    const a = await createTestPdfFile("a.pdf", { labels: ["A"] });
    const b = await createTestPdfFile("b.pdf", { labels: ["B"] });
    const { POST } = await import("./route");
    const res = await POST(buildMergeRequest([a, b]));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    const bytes = Buffer.from(await res.arrayBuffer());
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(100);
  });
});

describe("POST /api/tools/split-pdf", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 400 when file is missing", async () => {
    const { POST } = await import("../split-pdf/route");
    const form = new FormData();
    form.append("mode", "all");
    const res = await POST(
      new NextRequest("http://localhost/api/tools/split-pdf", {
        method: "POST",
        body: form,
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/required/i);
  });

  it("returns zip or pdf for split-all mode", async () => {
    const file = await createTestPdfFile("two-page.pdf", { pages: 2 });
    const form = new FormData();
    form.append("file", file, file.name);
    form.append("mode", "all");
    const { POST } = await import("../split-pdf/route");
    const res = await POST(
      new NextRequest("http://localhost/api/tools/split-pdf", {
        method: "POST",
        body: form,
      })
    );
    expect(res.status).toBe(200);
    const contentType = res.headers.get("Content-Type") ?? "";
    expect(contentType.includes("pdf") || contentType.includes("zip")).toBe(true);
    expect((await res.arrayBuffer()).byteLength).toBeGreaterThan(50);
  });
});
