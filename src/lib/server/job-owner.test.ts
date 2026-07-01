import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { assertJobOwner, resolveJobOwnerKey } from "@/lib/server/job-owner";
import { GUEST_SESSION_COOKIE } from "@/lib/privacy/guest-session";

vi.mock("@/lib/server/client-ip", () => ({
  getGuestUsageKey: () => "hashed-ip",
}));

describe("job-owner", () => {
  it("uses user id when authenticated", () => {
    const req = new NextRequest("http://localhost/api/tools/pdf-to-word");
    expect(resolveJobOwnerKey(req, "user-123")).toBe("user:user-123");
  });

  it("binds guest jobs to pd_guest_session cookie", () => {
    const req = new NextRequest("http://localhost/api/tools/pdf-to-word", {
      headers: { cookie: `${GUEST_SESSION_COOKIE}=guest-abc` },
    });
    expect(resolveJobOwnerKey(req, null)).toBe("guest:hashed-ip:guest-abc");
  });

  it("falls back to anonymous when no guest cookie", () => {
    const req = new NextRequest("http://localhost/api/tools/pdf-to-word");
    expect(resolveJobOwnerKey(req, null)).toBe("guest:hashed-ip:anonymous");
  });

  it("asserts matching owner keys only", () => {
    expect(assertJobOwner("user:1", "user:1")).toBe(true);
    expect(assertJobOwner("user:1", "user:2")).toBe(false);
    expect(assertJobOwner(undefined, "guest:hashed-ip:anonymous")).toBe(false);
  });
});
