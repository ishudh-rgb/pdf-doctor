import { createBrowserClient } from "@supabase/ssr";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDc1MzY4MDAsImV4cCI6MTk2MzExMjgwMH0.placeholder";

function isValidSupabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      !url.includes("your_supabase")
    );
  } catch {
    return false;
  }
}

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const url = isValidSupabaseUrl(rawUrl) ? rawUrl! : PLACEHOLDER_URL;
  const key =
    rawKey && rawKey.length > 20 && !rawKey.includes("your_supabase")
      ? rawKey
      : PLACEHOLDER_KEY;

  return createBrowserClient(url, key);
}

export function isSupabaseConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    isValidSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !!key &&
    key.length > 20 &&
    !key.includes("your_supabase")
  );
}
