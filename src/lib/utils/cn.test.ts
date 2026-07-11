import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("merges tailwind classes and drops conflicts", () => {
    expect(cn("px-2", "px-4", false && "hidden", "text-sm")).toBe("px-4 text-sm");
  });

  it("handles conditional class lists", () => {
    expect(cn("base", { active: true, disabled: false })).toBe("base active");
  });
});
