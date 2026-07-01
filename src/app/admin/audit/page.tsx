"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollText, Loader2 } from "lucide-react";

type AuditRow = {
  id: string;
  admin_email: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/audit?limit=50");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load audit logs");
      setLogs(json.logs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-pd-foreground">
          <ScrollText className="h-7 w-7 text-pd-brand" />
          Audit log
        </h1>
        <p className="mt-1 text-sm text-pd-muted">
          Recent admin actions: user changes, settings, coupons, and cleanup runs.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-pd-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading audit entries…
        </div>
      ) : logs.length === 0 ? (
        <p className="rounded-xl border border-pd-border bg-pd-surface px-4 py-8 text-center text-sm text-pd-muted">
          No audit entries yet. Actions will appear here after admin changes.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-pd-border bg-pd-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-pd-border bg-pd-background text-xs uppercase tracking-wide text-pd-muted">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id} className="border-b border-pd-border/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-pd-muted">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">{row.admin_email}</td>
                  <td className="px-4 py-3 font-medium">{row.action}</td>
                  <td className="px-4 py-3 text-pd-muted">
                    {row.target_type ? `${row.target_type}:${row.target_id ?? "—"}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
