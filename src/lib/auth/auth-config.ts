export function isValidSupabaseUrl(url: string | undefined): boolean {
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

export function isSupabaseConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    isValidSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    !!key &&
    key.length > 20 &&
    !key.includes("your_supabase")
  );
}

export function isLocalDevAuthEnabled(): boolean {
  return process.env.NODE_ENV === "development" && !isSupabaseConfigured();
}
