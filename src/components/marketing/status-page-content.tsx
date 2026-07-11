"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

type HealthPayload = {
  status?: string;
  timestamp?: string;
};

export function StatusPageContent({ externalStatusUrl }: { externalStatusUrl: string | null }) {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = (await res.json()) as HealthPayload;
        if (!cancelled) {
          setHealth(data);
          setError(!res.ok);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const isDegraded = health?.status === "degraded";

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border border-pd-border bg-pd-surface p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-pd-muted">Current status</h2>
        {loading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-pd-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking…
          </p>
        ) : error || isDegraded ? (
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            Degraded or unreachable — we are investigating.
          </p>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            All systems operational
          </p>
        )}
        {health?.timestamp && (
          <p className="mt-2 text-xs text-pd-muted">
            Last checked: {new Date(health.timestamp).toLocaleString()}
          </p>
        )}
      </div>

      {!externalStatusUrl && (
        <p className="text-sm text-pd-muted">
          Subscribe to updates: set up Better Stack or Instatus and add{" "}
          <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_STATUS_PAGE_URL</code> to your deployment.
        </p>
      )}
    </div>
  );
}
