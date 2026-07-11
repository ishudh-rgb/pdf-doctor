import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { jsonApiError } from "./api-error";

describe("api-error", () => {
  it("returns generic message and correlation id", async () => {
    const request = new NextRequest("http://localhost/api/auth/login", {
      headers: { "x-correlation-id": "corr-test-123" },
    });

    const response = jsonApiError(
      request,
      new Error("secret path C:\\Users\\admin\\file.pdf"),
      500,
      "Login failed"
    );
    const body = await response.json();

    expect(body.error).toBe("Login failed");
    expect(body.correlationId).toBe("corr-test-123");
    expect(body.error).not.toContain("C:\\Users");
    expect(response.headers.get("x-correlation-id")).toBe("corr-test-123");
  });
});
