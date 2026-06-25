"use client";

import { useState, useEffect } from "react";
import { Trash2, RefreshCw, Clock, HardDrive, FileX, Loader2, CheckCircle } from "lucide-react";

interface CleanupStats {
  pendingFiles: number;
  totalDeleted?: number;
  totalStorageUsed: string;
  lastCleanup: string | null;
}

export default function AdminCleanupPage() {
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/cleanup");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    setCleaning(true);
    setCleanResult(null);
    try {
      const res = await fetch("/api/admin/cleanup", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const failedNote = data.failed ? ` (${data.failed} failed)` : "";
        setCleanResult(`${data.cleanedCount ?? data.cleaned ?? 0} files cleaned from storage.${failedNote}`);
        await fetchStats();
      } else {
        setCleanResult("Cleanup failed. Please try again.");
      }
    } catch {
      setCleanResult("Cleanup failed. Please try again.");
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-pd-muted" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-pd-foreground mb-8">File Cleanup</h1>

      <div className="grid gap-6 sm:grid-cols-3 mb-8">
        <div className="rounded-2xl bg-pd-surface p-6 shadow-sm border border-pd-border">
          <FileX className="h-8 w-8 text-amber-600 mb-3" />
          <p className="text-sm text-pd-muted">Pending Deletion</p>
          <p className="text-3xl font-bold text-pd-foreground">{stats?.pendingFiles ?? 0}</p>
          <p className="text-xs text-pd-muted mt-1">Files with expired retention</p>
        </div>
        <div className="rounded-2xl bg-pd-surface p-6 shadow-sm border border-pd-border">
          <HardDrive className="h-8 w-8 text-pd-brand mb-3" />
          <p className="text-sm text-pd-muted">Storage Cleanup</p>
          <p className="text-3xl font-bold text-pd-foreground">{stats?.totalDeleted ?? 0}</p>
          <p className="text-xs text-pd-muted mt-1">{stats?.totalStorageUsed ?? "Marked deleted in DB"}</p>
        </div>
        <div className="rounded-2xl bg-pd-surface p-6 shadow-sm border border-pd-border">
          <Clock className="h-8 w-8 text-green-600 mb-3" />
          <p className="text-sm text-pd-muted">Last Checked</p>
          <p className="text-lg font-bold text-pd-foreground">{stats?.lastCleanup ?? "Just now"}</p>
          <p className="text-xs text-pd-muted mt-1">Cron job runs every hour</p>
        </div>
      </div>

      <div className="rounded-2xl bg-pd-surface p-6 shadow-sm mb-6 border border-pd-border">
        <h2 className="font-semibold text-pd-foreground mb-4">Manual Cleanup</h2>
        <p className="text-sm text-pd-muted mb-4">
          Run cleanup now to delete expired files from Supabase Storage and mark them deleted in the database.
        </p>

        {cleanResult && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" /> {cleanResult}
          </div>
        )}

        <button
          onClick={runCleanup}
          disabled={cleaning}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
        >
          {cleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          {cleaning ? "Cleaning..." : "Run Cleanup Now"}
        </button>
      </div>

      <div className="rounded-2xl bg-pd-surface p-6 shadow-sm border border-pd-border">
        <h2 className="font-semibold text-pd-foreground mb-4 flex items-center gap-2">
          <RefreshCw className="h-5 w-5" /> Auto-Cleanup Status
        </h2>
        <div className="space-y-3 text-sm text-pd-muted">
          <p><span className="font-medium text-pd-foreground">Schedule:</span> Every 1 hour via Vercel Cron</p>
          <p><span className="font-medium text-pd-foreground">Retention:</span> Files auto-delete after plan retention period</p>
          <p><span className="font-medium text-pd-foreground">Endpoint:</span> <code className="bg-pd-background px-2 py-0.5 rounded text-xs border border-pd-border">/api/cron/cleanup</code></p>
          <p><span className="font-medium text-pd-foreground">Auth:</span> <code className="bg-pd-background px-2 py-0.5 rounded text-xs border border-pd-border">Authorization: Bearer $CRON_SECRET</code></p>
        </div>
      </div>
    </div>
  );
}
