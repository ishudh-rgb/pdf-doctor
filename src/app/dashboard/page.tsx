"use client";

import Link from "next/link";
import {
  UserCircle,
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

const quickAccessTools = [
  { slug: "merge-pdf", icon: Layers, color: "bg-emerald-100 text-emerald-600", nameKey: "tools.mergePdf.name" },
  { slug: "split-pdf", icon: Scissors, color: "bg-blue-100 text-blue-600", nameKey: "tools.splitPdf.name" },
  { slug: "compress-pdf", icon: Minimize2, color: "bg-orange-100 text-orange-600", nameKey: "tools.compressPdf.name" },
  { slug: "pdf-to-word", icon: FileText, color: "bg-indigo-100 text-indigo-600", nameKey: "tools.pdfToWord.name" },
  { slug: "word-to-pdf", icon: FileText, color: "bg-red-100 text-red-600", nameKey: "tools.wordToPdf.name" },
  { slug: "ai-pdf-summarizer", icon: Sparkles, color: "bg-violet-100 text-violet-600", nameKey: "tools.aiPdfSummarizer.name" },
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
    completed: { label: t("dashboard.completed"), className: "bg-emerald-100 text-emerald-700" },
    processing: { label: t("dashboard.processing"), className: "bg-amber-100 text-amber-700" },
    failed: { label: t("dashboard.failed"), className: "bg-red-100 text-red-700" },
  };

  return (
    <section className="relative min-h-screen mesh-hero">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-violet-200/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4 rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
            <UserCircle className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("dashboard.title")}</h1>
            <p className="text-sm text-slate-500">{t("dashboard.welcomeBackSimple")}</p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{t("dashboard.currentPlan")}</p>
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {t("dashboard.freePlan")}
              </span>
            </div>
            <Link
              href="/pricing"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <Crown className="h-3.5 w-3.5" />
              {t("dashboard.upgradeToPro")}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{t("dashboard.todaysUsage")}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {t("dashboard.filesProcessed", { used: "3", total: "5" })}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{t("dashboard.aiSummaries")}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {t("dashboard.summariesUsed", { used: "1", total: "3" })}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-[33%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{t("dashboard.quickAccess")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quickAccessTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.slug}
                  href={`/${tool.slug}`}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                      tool.color
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-slate-700">{t(tool.nameKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{t("dashboard.recentJobs")}</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-4 py-3 font-medium text-slate-500">{t("dashboard.tool")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500">{t("dashboard.fileName")}</th>
                    <th className="hidden px-4 py-3 font-medium text-slate-500 sm:table-cell">
                      {t("dashboard.date")}
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-500">{t("dashboard.status")}</th>
                    <th className="px-4 py-3 font-medium text-slate-500">{t("dashboard.action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentJobs.map((job) => {
                    const status = statusConfig[job.status];
                    return (
                      <tr key={job.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-900">{t(job.toolKey)}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">{job.fileName}</td>
                        <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{job.date}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                              status.className
                            )}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {job.status === "completed" && job.downloadable ? (
                            <button className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100">
                              <Download className="h-3.5 w-3.5" />
                              {t("dashboard.download")}
                            </button>
                          ) : job.status === "completed" && !job.downloadable ? (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
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
      </div>
    </section>
  );
}
