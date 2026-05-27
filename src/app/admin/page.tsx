"use client";

import { useState, useEffect } from "react";
import { StatCard, StatCardSkeleton } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Crown,
  FileCheck,
  IndianRupee,
  Activity,
  Zap,
  Trash2,
  Megaphone,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface DashboardData {
  stats: {
    totalUsers: number;
    proUsers: number;
    filesProcessedToday: number;
    revenueThisMonth: number;
    usersTrend: number;
    proTrend: number;
    fileTrend: number;
    revenueTrend: number;
  };
  dailyUsage: { date: string; count: number }[];
  toolPopularity: { tool: string; count: number }[];
  recentActivity: { id: string; user: string; action: string; time: string }[];
  systemHealth: {
    database: "healthy" | "degraded" | "down";
    storage: "healthy" | "degraded" | "down";
    api: "healthy" | "degraded" | "down";
    queue: "healthy" | "degraded" | "down";
  };
}

const mockData: DashboardData = {
  stats: {
    totalUsers: 12847,
    proUsers: 1243,
    filesProcessedToday: 3421,
    revenueThisMonth: 185600,
    usersTrend: 12.5,
    proTrend: 8.3,
    fileTrend: -2.1,
    revenueTrend: 15.7,
  },
  dailyUsage: [
    { date: "Mon", count: 2400 },
    { date: "Tue", count: 3100 },
    { date: "Wed", count: 2800 },
    { date: "Thu", count: 3400 },
    { date: "Fri", count: 3900 },
    { date: "Sat", count: 2200 },
    { date: "Sun", count: 1800 },
  ],
  toolPopularity: [
    { tool: "Merge PDF", count: 4520 },
    { tool: "Compress PDF", count: 3810 },
    { tool: "PDF to Word", count: 2930 },
    { tool: "Split PDF", count: 2100 },
    { tool: "JPG to PDF", count: 1840 },
    { tool: "Protect PDF", count: 920 },
  ],
  recentActivity: [
    { id: "1", user: "user@example.com", action: "Upgraded to Pro", time: "2 min ago" },
    { id: "2", user: "john@company.com", action: "Processed 5 files (Merge PDF)", time: "5 min ago" },
    { id: "3", user: "sara@startup.io", action: "Payment completed - ₹299", time: "12 min ago" },
    { id: "4", user: "dev@test.com", action: "Account created", time: "18 min ago" },
    { id: "5", user: "admin@pdfdoctor.com", action: "Ran cleanup job", time: "1 hour ago" },
  ],
  systemHealth: {
    database: "healthy",
    storage: "healthy",
    api: "healthy",
    queue: "healthy",
  },
};

const healthColors = {
  healthy: "text-green-600 bg-green-50",
  degraded: "text-amber-600 bg-amber-50",
  down: "text-red-600 bg-red-50",
};

const healthIcons = {
  healthy: CheckCircle2,
  degraded: AlertCircle,
  down: AlertCircle,
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setData(mockData);
        }
      } catch {
        setData(mockData);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  async function handleQuickAction(action: string) {
    setActionLoading(action);
    try {
      await fetch(`/api/admin/${action}`, { method: "POST" });
    } catch {
      // Silently handle
    } finally {
      setActionLoading(null);
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-pd-foreground">Dashboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6 h-72 animate-pulse">
            <div className="h-5 w-32 bg-pd-border rounded mb-4" />
            <div className="h-full bg-pd-background rounded-xl" />
          </div>
          <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6 h-72 animate-pulse">
            <div className="h-5 w-32 bg-pd-border rounded mb-4" />
            <div className="h-full bg-pd-background rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const maxUsage = Math.max(...data.dailyUsage.map((d) => d.count));
  const maxPopularity = Math.max(...data.toolPopularity.map((d) => d.count));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-pd-foreground">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={data.stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={{ value: data.stats.usersTrend, label: "vs last month" }}
        />
        <StatCard
          label="Pro Users"
          value={data.stats.proUsers.toLocaleString()}
          icon={Crown}
          trend={{ value: data.stats.proTrend, label: "vs last month" }}
        />
        <StatCard
          label="Files Processed Today"
          value={data.stats.filesProcessedToday.toLocaleString()}
          icon={FileCheck}
          trend={{ value: data.stats.fileTrend, label: "vs yesterday" }}
        />
        <StatCard
          label="Revenue This Month"
          value={`₹${data.stats.revenueThisMonth.toLocaleString()}`}
          icon={IndianRupee}
          trend={{ value: data.stats.revenueTrend, label: "vs last month" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6">
          <h3 className="text-base font-semibold text-pd-foreground mb-4">Daily Usage (This Week)</h3>
          <div className="flex items-end gap-3 h-48">
            {data.dailyUsage.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-pd-muted">{day.count.toLocaleString()}</span>
                <div
                  className="w-full bg-pd-brand rounded-t-lg transition-all hover:bg-pd-brand-hover"
                  style={{ height: `${(day.count / maxUsage) * 100}%`, minHeight: "8px" }}
                />
                <span className="text-xs text-pd-muted">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6">
          <h3 className="text-base font-semibold text-pd-foreground mb-4">Tool Popularity</h3>
          <div className="space-y-3">
            {data.toolPopularity.map((tool) => (
              <div key={tool.tool} className="flex items-center gap-3">
                <span className="text-sm text-pd-muted w-28 truncate shrink-0">{tool.tool}</span>
                <div className="flex-1 h-6 bg-pd-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pd-brand rounded-full transition-all"
                    style={{ width: `${(tool.count / maxPopularity) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-pd-muted w-12 text-right">{tool.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6">
          <h3 className="text-base font-semibold text-pd-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 py-2 border-b border-pd-border last:border-0">
                <div className="h-8 w-8 rounded-full bg-pd-brand-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="h-4 w-4 text-pd-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-pd-foreground">{activity.action}</p>
                  <p className="text-xs text-pd-muted truncate">{activity.user}</p>
                </div>
                <span className="text-xs text-pd-muted shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6">
            <h3 className="text-base font-semibold text-pd-foreground mb-4">System Health</h3>
            <div className="space-y-3">
              {Object.entries(data.systemHealth).map(([service, status]) => {
                const StatusIcon = healthIcons[status];
                return (
                  <div key={service} className="flex items-center justify-between">
                    <span className="text-sm text-pd-muted capitalize">{service}</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${healthColors[status]}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6">
            <h3 className="text-base font-semibold text-pd-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                loading={actionLoading === "cleanup"}
                onClick={() => handleQuickAction("cleanup")}
              >
                <Trash2 className="h-4 w-4" />
                Run Cleanup
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                loading={actionLoading === "toggle-ads"}
                onClick={() => handleQuickAction("toggle-ads")}
              >
                <Megaphone className="h-4 w-4" />
                Toggle Ads
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                loading={actionLoading === "toggle-maintenance"}
                onClick={() => handleQuickAction("toggle-maintenance")}
              >
                <Wrench className="h-4 w-4" />
                Toggle Maintenance
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
