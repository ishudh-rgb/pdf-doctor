import { describe, expect, it } from "vitest";
import { HeavyJobCapacityError } from "@/lib/server/conversion-semaphore";
import {
  heavyJobCapacityResponse,
  isHeavyJobCapacityError,
} from "@/lib/server/heavy-job-http";

describe("heavyJobCapacityResponse", () => {
  it("returns 503 with the busy message for capacity errors", async () => {
    const error = new HeavyJobCapacityError(
      "Server is busy processing other files. Please try again in a moment."
    );
    const response = heavyJobCapacityResponse(error);

    expect(response).not.toBeNull();
    expect(response?.status).toBe(503);
    const body = await response!.json();
    expect(body.error).toBe(
      "Server is busy processing other files. Please try again in a moment."
    );
  });

  it("returns null for unrelated errors", () => {
    expect(heavyJobCapacityResponse(new Error("boom"))).toBeNull();
    expect(isHeavyJobCapacityError(new Error("boom"))).toBe(false);
  });
});

describe("toSafeApiError for capacity messages", () => {
  it("passes through whitelisted busy messages", async () => {
    const { toSafeApiError } = await import("@/lib/server/safe-error");
    const message = toSafeApiError(
      new HeavyJobCapacityError(
        "Server is busy processing other files. Please try again in a moment."
      )
    );
    expect(message).toBe(
      "Server is busy processing other files. Please try again in a moment."
    );
  });
});
