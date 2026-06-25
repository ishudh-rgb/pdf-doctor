import { getApiUser } from "@/lib/auth/get-api-user";

/** Resolves the current user on tool API routes (Supabase or local-dev session). */
export async function getToolRequestUserId(): Promise<string | null> {
  const user = await getApiUser();
  return user?.id ?? null;
}
