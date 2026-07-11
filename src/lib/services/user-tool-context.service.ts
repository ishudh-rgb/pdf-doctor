import { getUserProfile } from "@/lib/db/queries";

import { getCachedAdminSettings } from "@/lib/db/admin-settings-cache";

import { resolveMaxFileSizeMB } from "@/lib/admin/effective-limits";

import { isActivePro } from "@/lib/auth/plan-access";

import { resolveProAccessForUser } from "@/lib/enterprise/org-access.service";



export type ToolUserContext = {

  settings: Record<string, unknown>;

  profile: Awaited<ReturnType<typeof getUserProfile>> | null;

  isPro: boolean;

  maxSizeMB: number;

};



export async function resolveToolUserContext(

  userId: string | null

): Promise<ToolUserContext> {

  const settings = await getCachedAdminSettings();



  if (!userId) {

    return {

      settings,

      profile: null,

      isPro: false,

      maxSizeMB: resolveMaxFileSizeMB(settings, false),

    };

  }



  const profile = await getUserProfile(userId);

  let isPro = isActivePro(profile);

  try {

    const access = await resolveProAccessForUser(userId);

    isPro = access.isPro;

  } catch {

    // keep individual plan result

  }



  return {

    settings,

    profile,

    isPro,

    maxSizeMB: resolveMaxFileSizeMB(settings, isPro),

  };

}

