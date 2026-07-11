import { afterEach, describe, expect, it } from "vitest";
import { isSupabaseConfigured } from "./server";
describe("isSupabaseConfigured", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("returns false for placeholder env", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://your_supabase.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "your_supabase_anon_key";
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("returns false for invalid URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "abcdefghijklmnopqrstuvwxyz";
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("returns true for valid-looking env", () => {

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "abcdefghijklmnopqrstuvwxyz123456";

    expect(isSupabaseConfigured()).toBe(true);

  });

});
