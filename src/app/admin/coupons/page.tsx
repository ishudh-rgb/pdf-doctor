"use client";

import { useState, useEffect } from "react";
import { Plus, X, Ticket, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number;
  uses: number;
  valid_until: string;
  is_active: boolean;
}

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    discount_percent: 10,
    max_uses: -1,
    valid_until: "",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function fetchCoupons() {
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const json = await res.json();
        setCoupons(json.coupons || []);
      }
    } catch {
      // Keep empty
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.code.trim()) {
      setToast({ type: "error", message: "Coupon code is required." });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const json = await res.json();
        setCoupons((prev) => [json.coupon, ...prev]);
        setShowForm(false);
        setFormData({ code: "", discount_percent: 10, max_uses: -1, valid_until: "" });
        setToast({ type: "success", message: "Coupon created successfully!" });
      } else {
        setToast({ type: "error", message: "Failed to create coupon." });
      }
    } catch {
      setToast({ type: "error", message: "Failed to create coupon." });
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(coupon: Coupon) {
    setTogglingId(coupon.id);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
        );
      }
    } catch {
      // Silently handle
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-pd-foreground">Coupon Codes</h2>
        <div className="animate-pulse rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-24 rounded bg-pd-border" />
                <div className="h-4 w-16 rounded bg-pd-border/60" />
                <div className="h-4 w-20 rounded bg-pd-border/60" />
                <div className="h-4 w-24 rounded bg-pd-border/60" />
                <div className="h-4 w-16 rounded bg-pd-border/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-pd-foreground">Coupon Codes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-pd-brand px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-pd-brand-hover"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Create Coupon"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6"
        >
          <h3 className="text-base font-semibold text-pd-foreground mb-4">New Coupon</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-pd-muted mb-1.5">
                Coupon Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE20"
                  className="flex-1 rounded-xl border border-pd-border px-3 py-2 text-sm font-mono uppercase text-pd-foreground placeholder:text-pd-muted focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, code: generateCode() })}
                  className="shrink-0 rounded-xl border border-pd-border px-3 py-2 text-xs font-medium text-pd-muted transition hover:bg-pd-background"
                >
                  Auto
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-pd-muted mb-1.5">
                Discount %
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
                className="w-full rounded-xl border border-pd-border px-3 py-2 text-sm text-pd-foreground focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-pd-muted mb-1.5">
                Max Uses (-1 = unlimited)
              </label>
              <input
                type="number"
                min={-1}
                value={formData.max_uses}
                onChange={(e) => setFormData({ ...formData, max_uses: Number(e.target.value) })}
                className="w-full rounded-xl border border-pd-border px-3 py-2 text-sm text-pd-foreground focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-pd-muted mb-1.5">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full rounded-xl border border-pd-border px-3 py-2 text-sm text-pd-foreground focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-green-700 disabled:opacity-50"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Coupon
            </button>
          </div>
        </form>
      )}

      {coupons.length === 0 ? (
        <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-12 text-center">
          <Ticket className="mx-auto h-10 w-10 text-pd-muted" />
          <h3 className="mt-4 text-lg font-semibold text-pd-foreground">No coupons yet</h3>
          <p className="mt-1 text-sm text-pd-muted">
            Create your first coupon code to offer discounts.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-pd-border bg-pd-background/50">
                  <th className="px-4 py-3 font-medium text-pd-muted">Code</th>
                  <th className="px-4 py-3 font-medium text-pd-muted">Discount</th>
                  <th className="px-4 py-3 font-medium text-pd-muted">Uses / Max</th>
                  <th className="hidden px-4 py-3 font-medium text-pd-muted sm:table-cell">Valid Until</th>
                  <th className="px-4 py-3 font-medium text-pd-muted">Status</th>
                  <th className="px-4 py-3 font-medium text-pd-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pd-border">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="transition-colors hover:bg-pd-background">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-pd-foreground">
                      {coupon.code}
                    </td>
                    <td className="px-4 py-3 text-pd-muted">
                      {coupon.discount_percent}%
                    </td>
                    <td className="px-4 py-3 text-pd-muted">
                      {coupon.uses} / {coupon.max_uses === -1 ? "∞" : coupon.max_uses}
                    </td>
                    <td className="hidden px-4 py-3 text-pd-muted sm:table-cell">
                      {coupon.valid_until
                        ? new Date(coupon.valid_until).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        : "No expiry"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          coupon.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-pd-border text-pd-muted"
                        )}
                      >
                        {coupon.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(coupon)}
                        disabled={togglingId === coupon.id}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
                          coupon.is_active
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        )}
                      >
                        {togglingId === coupon.id ? "..." : coupon.is_active ? "Deactivate" : "Activate"}
                      </button>
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
