import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasApiKeyHeader } from "@/lib/auth/api-key-auth";
import { resolveToolRequestAuth } from "@/lib/auth/resolve-tool-request-auth";
import { getToolRequestUserId } from "@/lib/auth/get-tool-request-user";

export type MutationToolAuth = {
  userId: string | null;
  denied: NextResponse | null;
};

/** Session or API key (write scope required when key is used). */
export async function resolveMutationToolUser(
  request: NextRequest
): Promise<MutationToolAuth> {
  if (hasApiKeyHeader(request)) {
    const auth = await resolveToolRequestAuth(request, { requireWrite: true });
    if (!auth.userId) {
      return {
        userId: null,
        denied: NextResponse.json(
          { error: "Invalid or unauthorized API key." },
          { status: 401 }
        ),
      };
    }
    return { userId: auth.userId, denied: null };
  }

  const userId = await getToolRequestUserId(request);
  return { userId, denied: null };
}
