import { afterEach, describe, expect, it, vi } from "vitest";
import { getPdfPageCount } from "./pdf-page-count";

describe("getPdfPageCount", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns page count from API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ totalPages: 12 }),
      })
    );

    const file = new File(["%PDF"], "doc.pdf", { type: "application/pdf" });
    await expect(getPdfPageCount(file)).resolves.toBe(12);
  });

  it("returns 0 on API failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    const file = new File(["%PDF"], "doc.pdf", { type: "application/pdf" });
    await expect(getPdfPageCount(file)).resolves.toBe(0);
  });

  it("returns 0 when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const file = new File(["%PDF"], "doc.pdf", { type: "application/pdf" });
    await expect(getPdfPageCount(file)).resolves.toBe(0);
  });
});
