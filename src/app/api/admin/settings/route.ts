import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";
import { guardMutationOrigin } from "@/lib/server/mutation-origin";
import {
  canonicalAdminSettingKey,
  isAllowedAdminSettingKey,
  normalizeAdminSettingValue,
} from "@/lib/admin/settings-allowlist";
import { updateAdminSetting } from "@/lib/db/queries";
import { toSafeApiError } from "@/lib/server/safe-error";
import { logAdminAction } from "@/lib/admin/audit-log";
import { getGuestUsageKey } from "@/lib/server/client-ip";

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (admin instanceof Response) return admin;
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serviceClient = await createServiceClient();
    const { data, error } = await serviceClient.from("admin_settings").select("*");

    if (error) throw error;

    return NextResponse.json({ settings: data ?? [] });
  } catch (err) {
    const message = toSafeApiError(err, "Failed to fetch settings");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const originBlocked = guardMutationOrigin(request);
    if (originBlocked) return originBlocked;

    const admin = await verifyAdmin(request);
    if (admin instanceof Response) return admin;
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { key, value } = await request.json();

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    if (!isAllowedAdminSettingKey(key)) {
      return NextResponse.json({ error: "Setting key is not allowed" }, { status: 400 });
    }

    const canonicalKey = canonicalAdminSettingKey(key);
    const normalizedValue = normalizeAdminSettingValue(key, value);

    await updateAdminSetting(canonicalKey, normalizedValue);

    await logAdminAction({
      adminId: admin.id,
      adminEmail: admin.email ?? "admin",
      action: "settings.update",
      targetType: "admin_settings",
      targetId: canonicalKey,
      payload: { value: normalizedValue },
      ipHash: getGuestUsageKey(request),
    });

    return NextResponse.json({
      setting: { key: canonicalKey, value: normalizedValue },
    });
  } catch (err) {
    const message = toSafeApiError(err, "Failed to update setting");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
