"use client";

import { Upload, Cpu, Download } from "lucide-react";
import { useTranslation } from "@/i18n";

export function WorkflowVisual() {
  const { t } = useTranslation();

  const steps = [
    {
      icon: Upload,
      title: t("landing.workflowUpload"),
      desc: t("landing.workflowUploadDesc"),
      color: "from-blue-500 to-indigo-600",
      bg: "bg-blue-50",
      ring: "ring-blue-100",
    },
    {
      icon: Cpu,
      title: t("landing.workflowProcess"),
      desc: t("landing.workflowProcessDesc"),
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
      ring: "ring-violet-100",
    },
    {
      icon: Download,
      title: t("landing.workflowDownload"),
      desc: t("landing.workflowDownloadDesc"),
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50",
      ring: "ring-emerald-100",
    },
  ];

  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute left-[16.67%] right-[16.67%] top-[2.75rem] hidden h-0.5 bg-gradient-to-r from-blue-200 via-violet-300 to-emerald-200 md:block"
      />

      <div className="grid gap-8 md:grid-cols-3 md:gap-6">
        {steps.map((step, i) => (
          <div key={step.title} className="relative flex flex-col items-center text-center">
            <div
              className={`relative z-10 flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-lg shadow-indigo-500/15 ring-4 ${step.ring}`}
            >
              <step.icon className="h-8 w-8 text-white" strokeWidth={1.75} />
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700 shadow-md">
                {i + 1}
              </span>
            </div>

            <div className={`mt-5 w-full rounded-2xl border border-slate-100 ${step.bg} p-5`}>
              <h3 className="font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
