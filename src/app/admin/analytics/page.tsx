"use client";

import { useState, useEffect } from "react";
import { StatCard, StatCardSkeleton } from "@/components/admin/stat-card";
import { cn } from "@/lib/utils/cn";
import { Users, Brain, HardDrive, Trophy, Clock } from "lucide-react";

interface AnalyticsData {
  dateRange: { from: string; to: string };
  toolUsage: { tool: string; count: number; percentage: number }[];
  dailyActiveUsers: { date: string; count: number }[];
  aiStats: { totalCalls: number; totalTokens: number; totalCost: number; avgPerUser: number };
  fileSizeDistribution: { range: string; count: number }[];
  popularTools: { rank: number; tool: string; uses: number }[];
  peakHours: { hour: string; count: number }[];
}

const mockAnalytics: AnalyticsData = {
  dateRange: { from: "2026-05-15", to: "2026-05-22" },
  toolUsage: [
    { tool: "Merge PDF", count: 4520, percentage: 28 },
    { tool: "Compress PDF", count: 3810, percentage: 24 },
    { tool: "PDF to Word", count: 2930, percentage: 18 },
    { tool: "Split PDF", count: 2100, percentage: 13 },
    { tool: "JPG to PDF", count: 1840, percentage: 11 },
    { tool: "Protect PDF", count: 920, percentage: 6 },
  ],
  dailyActiveUsers: [
    { date: "May 15", count: 1200 },
    { date: "May 16", count: 1350 },
    { date: "May 17", count: 1100 },
    { date: "May 18", count: 1480 },
    { date: "May 19", count: 1600 },
    { date: "May 20", count: 950 },
    { date: "May 21", count: 870 },
  ],
  aiStats: { totalCalls: 2450, totalTokens: 12500000, totalCost: 45.80, avgPerUser: 3.2 },
  fileSizeDistribution: [
    { range: "0-1 MB", count: 4200 },
    { range: "1-5 MB", count: 3100 },
    { range: "5-10 MB", count: 1800 },
    { range: "10-25 MB", count: 900 },
    { range: "25-50 MB", count: 350 },
    { range: "50+ MB", count: 120 },
  ],
  popularTools: [
    { rank: 1, tool: "Merge PDF", uses: 4520 },
    { rank: 2, tool: "Compress PDF", uses: 3810 },
    { rank: 3, tool: "PDF to Word", uses: 2930 },
    { rank: 4, tool: "Split PDF", uses: 2100 },
    { rank: 5, tool: "JPG to PDF", uses: 1840 },
  ],
  peakHours: [
    { hour: "6 AM", count: 120 },
    { hour: "8 AM", count: 340 },
    { hour: "10 AM", count: 580 },
    { hour: "12 PM", count: 620 },
    { hour: "2 PM", count: 710 },
    { hour: "4 PM", count: 650 },
    { hour: "6 PM", count: 480 },
    { hour: "8 PM", count: 380 },
    { hour: "10 PM", count: 250 },
    { hour: "12 AM", count: 90 },
  ],
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("2026-05-15");
  const [dateTo, setDateTo] = useState("2026-05-22");

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?from=${dateFrom}&to=${dateTo}`);
        if (res.ok) {
          setData(await res.json());
        } else {
          setData(mockAnalytics);
        }
      } catch {
        setData(mockAnalytics);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [dateFrom, dateTo]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-pd-foreground">Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const maxDAU = Math.max(...data.dailyActiveUsers.map((d) => d.count));
  const maxFileSize = Math.max(...data.fileSizeDistribution.map((d) => d.count));
  const maxPeakHour = Math.max(...data.peakHours.map((d) => d.count));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-pd-foreground">Analytics</h2>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 px-3 rounded-lg border border-pd-border text-sm text-pd-muted focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20"
          />
          <span className="text-pd-muted">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 px-3 rounded-lg border border-pd-border text-sm text-pd-muted focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="AI Total Calls" value={data.aiStats.totalCalls.toLocaleString()} icon={Brain} />
        <StatCard label="Total Tokens Used" value={`${(data.aiStats.totalTokens / 1_000_000).toFixed(1)}M`} icon={Brain} />
        <StatCard label="AI Cost (USD)" value={`$${data.aiStats.totalCost.toFixed(2)}`} icon={Brain} />
        <StatCard label="Avg AI/User" value={data.aiStats.avgPerUser.toFixed(1)} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6">
          <h3 className="text-base font-semibold text-pd-foreground mb-4">Tool-wise Usage Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-pd-border">
                  <th className="text-left text-xs font-semibold text-pd-muted uppercase py-2">Tool</th>
                  <th className="text-left text-xs font-semibold text-pd-muted uppercase py-2">Usage</th>
                  <th className="text-right text-xs font-semibold text-pd-muted uppercase py-2">Count</th>
                  <th className="text-right text-xs font-semibold text-pd-muted uppercase py-2">%</th>
                </tr>
              </thead>
              <tbody>
                {data.toolUsage.map((tool) => (
                  <tr key={tool.tool} className="border-b border-pd-border">
                    <td className="py-2.5 text-sm text-pd-muted font-medium">{tool.tool}</td>
                    <td className="py-2.5 w-40">
                      <div className="h-2.5 bg-pd-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pd-brand rounded-full"
                          style={{ width: `${tool.percentage}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 text-sm text-pd-muted text-right">{tool.count.toLocaleString()}</td>
                    <td className="py-2.5 text-sm text-pd-muted text-right">{tool.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6">
          <h3 className="text-base font-semibold text-pd-foreground mb-4">Daily Active Users</h3>
          <div className="flex items-end gap-3 h-48">
            {data.dailyActiveUsers.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-pd-muted">{day.count.toLocaleString()}</span>
                <div
                  className="w-full bg-green-500 rounded-t-lg transition-all hover:bg-green-600"
                  style={{ height: `${(day.count / maxDAU) * 100}%`, minHeight: "8px" }}
                />
                <span className="text-[10px] text-pd-muted truncate w-full text-center">{day.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6">
          <h3 className="text-base font-semibold text-pd-foreground mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Most Popular Tools
          </h3>
          <div className="space-y-3">
            {data.popularTools.map((tool) => (
              <div key={tool.rank} className="flex items-center gap-3">
                <span className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  tool.rank === 1 ? "bg-amber-100 text-amber-700" :
                  tool.rank === 2 ? "bg-pd-border text-pd-muted" :
                  tool.rank === 3 ? "bg-orange-100 text-orange-700" :
                  "bg-pd-background text-pd-muted"
                )}>
                  {tool.rank}
                </span>
                <span className="text-sm text-pd-muted flex-1">{tool.tool}</span>
                <span className="text-sm font-medium text-pd-muted">{tool.uses.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6">
          <h3 className="text-base font-semibold text-pd-foreground mb-4 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-pd-brand" />
            File Size Distribution
          </h3>
          <div className="space-y-3">
            {data.fileSizeDistribution.map((bucket) => (
              <div key={bucket.range} className="flex items-center gap-3">
                <span className="text-xs text-pd-muted w-16 shrink-0">{bucket.range}</span>
                <div className="flex-1 h-5 bg-pd-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pd-brand rounded-full"
                    style={{ width: `${(bucket.count / maxFileSize) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-pd-muted w-10 text-right">{bucket.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6">
          <h3 className="text-base font-semibold text-pd-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-pd-brand" />
            Peak Usage Hours
          </h3>
          <div className="space-y-2">
            {data.peakHours.map((hour) => (
              <div key={hour.hour} className="flex items-center gap-3">
                <span className="text-xs text-pd-muted w-12 shrink-0">{hour.hour}</span>
                <div className="flex-1 h-4 bg-pd-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pd-brand rounded-full"
                    style={{ width: `${(hour.count / maxPeakHour) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-pd-muted w-8 text-right">{hour.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
