import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import { UserBlockedError } from "@/lib/auth/plan-access";
import {
  isUserBlockedError,
  userBlockedResponse,
} from "@/lib/server/user-blocked-http";

describe("user-blocked-http", () => {
  it("detects UserBlockedError instances", () => {
    expect(isUserBlockedError(new UserBlockedError())).toBe(true);
    expect(isUserBlockedError(new Error("nope"))).toBe(false);
  });

  it("returns 403 JSON for blocked users", () => {
    const res = userBlockedResponse(new UserBlockedError("Account suspended"));
    expect(res).toBeInstanceOf(NextResponse);
    expect(res?.status).toBe(403);
  });

  it("returns null for unrelated errors", () => {
    expect(userBlockedResponse(new Error("other"))).toBeNull();
  });
});
