import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/auth/verify-admin";
import { storedAmountInInr } from "@/lib/payment/payment-amount";

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (admin instanceof Response) return admin;
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const serviceClient = await createServiceClient();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: payments, error } = await serviceClient
      .from("payments")
      .select("id, user_id, amount, status, payment_method, created_at, razorpay_payment_id")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const userIds = [...new Set((payments ?? []).map((p) => p.user_id).filter(Boolean))];
    const emailByUser = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await serviceClient
        .from("user_profiles")
        .select("id, email")
        .in("id", userIds as string[]);
      for (const p of profiles ?? []) {
        emailByUser.set(p.id, p.email);
      }
    }

    const completed = (payments ?? []).filter((p) => p.status === "completed");
    const failed = (payments ?? []).filter((p) => p.status === "failed");
    const thisMonth = completed.filter((p) => p.created_at && p.created_at >= monthStart.toISOString());

    const stats = {
      totalRevenue: Math.round(
        completed.reduce((s, p) => s + storedAmountInInr(Number(p.amount)), 0)
      ),
      thisMonth: Math.round(
        thisMonth.reduce((s, p) => s + storedAmountInInr(Number(p.amount)), 0)
      ),
      successfulCount: completed.length,
      failedCount: failed.length,
    };

    return NextResponse.json({
      stats,
      payments: (payments ?? []).map((p) => ({
        id: p.id,
        user_email: p.user_id ? emailByUser.get(p.user_id) ?? "Unknown" : "Unknown",
        amount: Math.round(storedAmountInInr(Number(p.amount))),
        status: p.status === "processing" ? "pending" : p.status,
        method: p.payment_method ?? "razorpay",
        created_at: p.created_at,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch payments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
