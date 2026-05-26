"use client";

import { useState, useEffect } from "react";
import { Trash2, RefreshCw, Clock, HardDrive, FileX, Loader2, CheckCircle } from "lucide-react";

interface CleanupStats {
  pendingFiles: number;
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
        setCleanResult(`${data.cleanedCount ?? 0} files cleaned up successfully.`);
        await fetchStats();
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">File Cleanup</h1>

      <div className="grid gap-6 sm:grid-cols-3 mb-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <FileX className="h-8 w-8 text-amber-600 mb-3" />
          <p className="text-sm text-gray-500">Pending Deletion</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.pendingFiles ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">Files with expired retention</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <HardDrive className="h-8 w-8 text-blue-600 mb-3" />
          <p className="text-sm text-gray-500">Storage Used</p>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalStorageUsed ?? "0 MB"}</p>
          <p className="text-xs text-gray-400 mt-1">Total file storage</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <Clock className="h-8 w-8 text-green-600 mb-3" />
          <p className="text-sm text-gray-500">Last Cleanup</p>
          <p className="text-lg font-bold text-gray-900">{stats?.lastCleanup ?? "Never"}</p>
          <p className="text-xs text-gray-400 mt-1">Cron job runs every hour</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Manual Cleanup</h2>
        <p className="text-sm text-gray-600 mb-4">
          Run cleanup now to delete all files that have exceeded the 2-hour retention period.
          This operation marks expired files as deleted in the database.
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

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <RefreshCw className="h-5 w-5" /> Auto-Cleanup Status
        </h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p><span className="font-medium text-gray-900">Schedule:</span> Every 1 hour via Vercel Cron</p>
          <p><span className="font-medium text-gray-900">Retention:</span> Files auto-delete after 2 hours</p>
          <p><span className="font-medium text-gray-900">Endpoint:</span> <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">/api/cron/cleanup</code></p>
          <p className="text-xs text-gray-400 mt-4">
            The cleanup job marks expired files as deleted in the database.
            Supabase Storage lifecycle policies can be configured separately for physical file removal.
          </p>
        </div>
      </div>
    </div>
  );
}
