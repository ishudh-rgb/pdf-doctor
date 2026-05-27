"use client";

import Link from "next/link";
import {
  Crown,
  FileText,
  Layers,
  Scissors,
  Minimize2,
  Sparkles,
  Download,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/i18n";
import { DashboardCard, DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

const quickAccessTools = [
  { slug: "merge-pdf", icon: Layers, nameKey: "tools.mergePdf.name" },
  { slug: "split-pdf", icon: Scissors, nameKey: "tools.splitPdf.name" },
  { slug: "compress-pdf", icon: Minimize2, nameKey: "tools.compressPdf.name" },
  { slug: "pdf-to-word", icon: FileText, nameKey: "tools.pdfToWord.name" },
  { slug: "word-to-pdf", icon: FileText, nameKey: "tools.wordToPdf.name" },
  { slug: "ai-pdf-summarizer", icon: Sparkles, nameKey: "tools.aiPdfSummarizer.name" },
];

type JobStatus = "completed" | "processing" | "failed";

const recentJobs: {
  id: string;
  toolKey: string;
  fileName: string;
  date: string;
  status: JobStatus;
  downloadable: boolean;
}[] = [
  { id: "1", toolKey: "tools.mergePdf.name", fileName: "merged-report.pdf", date: "Today, 2:30 PM", status: "completed", downloadable: true },
  { id: "2", toolKey: "tools.compressPdf.name", fileName: "presentation.pdf", date: "Today, 1:15 PM", status: "processing", downloadable: false },
  { id: "3", toolKey: "tools.pdfToWord.name", fileName: "contract.docx", date: "Today, 11:00 AM", status: "completed", downloadable: true },
  { id: "4", toolKey: "tools.splitPdf.name", fileName: "chapter-3.pdf", date: "Yesterday, 4:45 PM", status: "failed", downloadable: false },
  { id: "5", toolKey: "tools.compressPdf.name", fileName: "photos.pdf", date: "Yesterday, 9:20 AM", status: "completed", downloadable: false },
];

export default function DashboardPage() {
  const { t } = useTranslation();

  const statusConfig: Record<JobStatus, { label: string; className: string }> = {
    completed: { label: t("dashboard.completed"), className: "bg-pd-brand-muted text-pd-brand" },
    processing: { label: t("dashboard.processing"), className: "bg-amber-100 text-amber-700" },
    failed: { label: t("dashboard.failed"), className: "bg-red-100 text-red-700" },
  };

  return (
    <DashboardShell title={t("dashboard.title")} subtitle={t("dashboard.welcomeBackSimple")}>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard>
          <p className="text-sm font-medium text-pd-muted">{t("dashboard.currentPlan")}</p>
          <div className="mt-2">
            <span className="inline-flex rounded-full bg-pd-brand-muted px-2.5 py-0.5 text-xs font-semibold text-pd-brand">
              {t("dashboard.freePlan")}
            </span>
          </div>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pd-brand hover:text-pd-brand-hover"
          >
            <Crown className="h-3.5 w-3.5" />
            {t("dashboard.upgradeToPro")}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </DashboardCard>

        <DashboardCard>
          <p className="text-sm font-medium text-pd-muted">{t("dashboard.todaysUsage")}</p>
          <p className="mt-2 text-lg font-semibold text-pd-foreground">
            {t("dashboard.filesProcessed", { used: "3", total: "5" })}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-pd-border">
            <div className="h-full w-[60%] rounded-full bg-pd-brand" />
          </div>
        </DashboardCard>

        <DashboardCard>
          <p className="text-sm font-medium text-pd-muted">{t("dashboard.aiSummaries")}</p>
          <p className="mt-2 text-lg font-semibold text-pd-foreground">
            {t("dashboard.summariesUsed", { used: "1", total: "3" })}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-pd-border">
            <div className="h-full w-[33%] rounded-full bg-pd-brand" />
          </div>
        </DashboardCard>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-pd-foreground">{t("dashboard.quickAccess")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickAccessTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.slug}
                href={`/${tool.slug}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-pd-border bg-pd-surface p-4 text-center shadow-sm transition hover:border-pd-brand/40 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pd-brand-muted text-pd-brand transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium text-pd-foreground">{t(tool.nameKey)}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-pd-foreground">{t("dashboard.recentJobs")}</h2>
        <div className="overflow-hidden rounded-2xl border border-pd-border bg-pd-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-pd-border bg-pd-background">
                  <th className="px-4 py-3 font-medium text-pd-muted">{t("dashboard.tool")}</th>
                  <th className="px-4 py-3 font-medium text-pd-muted">{t("dashboard.fileName")}</th>
                  <th className="hidden px-4 py-3 font-medium text-pd-muted sm:table-cell">{t("dashboard.date")}</th>
                  <th className="px-4 py-3 font-medium text-pd-muted">{t("dashboard.status")}</th>
                  <th className="px-4 py-3 font-medium text-pd-muted">{t("dashboard.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pd-border">
                {recentJobs.map((job) => {
                  const status = statusConfig[job.status];
                  return (
                    <tr key={job.id} className="transition-colors hover:bg-pd-background/80">
                      <td className="px-4 py-3 font-medium text-pd-foreground">{t(job.toolKey)}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-pd-muted">{job.fileName}</td>
                      <td className="hidden px-4 py-3 text-pd-muted sm:table-cell">{job.date}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {job.status === "completed" && job.downloadable ? (
                          <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
                            <Download className="h-3.5 w-3.5" />
                            {t("dashboard.download")}
                          </Button>
                        ) : job.status === "completed" && !job.downloadable ? (
                          <span className="inline-flex items-center gap-1 text-xs text-pd-muted">
                            <Clock className="h-3.5 w-3.5" />
                            {t("dashboard.expired")}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
