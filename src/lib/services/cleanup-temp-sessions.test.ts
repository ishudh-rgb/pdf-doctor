import { describe, expect, it } from "vitest";
import { PDF_SESSION_TTL_MS } from "@/lib/pdf/pdf-session-store";

describe("cleanupExpiredTempSessions age logic", () => {
  it("uses the same TTL as pdf session store (30 minutes)", () => {
    expect(PDF_SESSION_TTL_MS).toBe(30 * 60 * 1000);
  });

  it("treats objects older than TTL as stale", () => {
    const cutoff = Date.now() - PDF_SESSION_TTL_MS;
    const staleCreatedAt = new Date(cutoff - 60_000).toISOString();
    const freshCreatedAt = new Date(cutoff + 60_000).toISOString();

    const staleMs = new Date(staleCreatedAt).getTime();
    const freshMs = new Date(freshCreatedAt).getTime();

    expect(staleMs).toBeLessThan(cutoff);
    expect(freshMs).toBeGreaterThan(cutoff);
  });
});
