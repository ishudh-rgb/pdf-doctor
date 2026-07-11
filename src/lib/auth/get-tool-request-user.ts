import type { NextRequest } from "next/server";
import { getApiUser } from "@/lib/auth/get-api-user";
import { resolveToolRequestAuth } from "@/lib/auth/resolve-tool-request-auth";

/** Resolves the current user on tool API routes (session, API key, or local-dev). */
export async function getToolRequestUserId(request?: NextRequest): Promise<string | null> {
  if (request) {
    const auth = await resolveToolRequestAuth(request);
    return auth.userId;
  }
  const user = await getApiUser();
  return user?.id ?? null;
}

export async function getToolRequestAuth(request: NextRequest) {
  return resolveToolRequestAuth(request, { requireWrite: true });
}
