import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";
import { listAdminAuditLogs } from "@/lib/admin/audit-log";
import { toSafeApiError } from "@/lib/server/safe-error";

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (admin instanceof Response) return admin;
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const offset = (page - 1) * limit;

    const { logs, total } = await listAdminAuditLogs(limit, offset);

    return NextResponse.json({ logs, total, page, limit });
  } catch (err) {
    const message = toSafeApiError(err, "Failed to fetch audit logs");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
