import type { NextRequest } from "next/server";
import { getApiUser } from "@/lib/auth/get-api-user";
import {
  apiKeyHasWriteScope,
  validateApiKeyFromRequest,
  type ValidatedApiKey,
} from "@/lib/auth/api-key-auth";

export type ToolRequestAuth = {
  userId: string | null;
  authMethod: "session" | "api_key" | "none";
  apiKey?: ValidatedApiKey;
  organizationId?: string | null;
};

export async function resolveToolRequestAuth(
  request: NextRequest,
  options?: { requireWrite?: boolean }
): Promise<ToolRequestAuth> {
  const apiKey = await validateApiKeyFromRequest(request);
  if (apiKey) {
    if (options?.requireWrite && !apiKeyHasWriteScope(apiKey.scopes)) {
      return { userId: null, authMethod: "none" };
    }
    return {
      userId: apiKey.userId,
      authMethod: "api_key",
      apiKey,
      organizationId: apiKey.organizationId,
    };
  }

  const user = await getApiUser();
  if (user) {
    return { userId: user.id, authMethod: "session" };
  }

  return { userId: null, authMethod: "none" };
}
