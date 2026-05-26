"use client";

import { useState, useEffect } from "react";
import { IndianRupee, TrendingUp, CheckCircle2, XCircle, Filter } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Payment {
  id: string;
  user_email: string;
  amount: number;
  status: "completed" | "failed" | "pending";
  method: string;
  created_at: string;
}

interface PaymentStats {
  totalRevenue: number;
  thisMonth: number;
  successfulCount: number;
  failedCount: number;
}

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    thisMonth: 0,
    successfulCount: 0,
    failedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch("/api/admin/payments");
        if (res.ok) {
          const json = await res.json();
          setPayments(json.payments || []);
          if (json.stats) setStats(json.stats);
        }
      } catch {
        // Keep empty
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const filteredPayments =
    statusFilter === "All"
      ? payments
      : payments.filter((p) => p.status === statusFilter.toLowerCase());

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Payments & Revenue</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
              <div className="h-4 w-24 rounded bg-gray-200 mb-3" />
              <div className="h-7 w-32 rounded bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="animate-pulse rounded-2xl bg-white border border-gray-100 shadow-sm p-6 h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Payments & Revenue</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <IndianRupee className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Total Revenue</p>
              <p className="text-lg font-bold text-gray-900">
                ₹{stats.totalRevenue.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">This Month</p>
              <p className="text-lg font-bold text-gray-900">
                ₹{stats.thisMonth.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Successful</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.successfulCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Failed</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.failedCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-xl border border-gray-200 bg-white pl-3 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="All">All Payments</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-12 text-center">
          <IndianRupee className="mx-auto h-10 w-10 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No payments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter === "All"
              ? "No payment records available yet."
              : `No ${statusFilter.toLowerCase()} payments found.`}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 font-medium text-gray-500">Payment ID</th>
                  <th className="px-4 py-3 font-medium text-gray-500">User</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="hidden px-4 py-3 font-medium text-gray-500 sm:table-cell">Method</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {payment.id.slice(0, 12)}...
                    </td>
                    <td className="px-4 py-3 text-gray-700">{payment.user_email}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          statusColors[payment.status]
                        )}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 capitalize sm:table-cell">
                      {payment.method}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(payment.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
