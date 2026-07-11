import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getExternalStatusPageUrl } from "@/lib/ops/status-page";
import { StatusPageContent } from "@/components/marketing/status-page-content";

export const metadata: Metadata = buildPageMetadata({
  title: "System Status",
  description: "OnlyMyPDF service status, uptime, and incident history.",
  path: "/status",
});

export default function StatusPage() {
  const externalUrl = getExternalStatusPageUrl();

  return (
    <div className="pd-container py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-pd-foreground">System Status</h1>
        <p className="mt-2 text-sm text-pd-muted">
          Live health for OnlyMyPDF tools and API. For SLA details see{" "}
          <Link href="/sla" className="text-pd-brand hover:underline">
            Service Level
          </Link>
          .
        </p>

        {externalUrl ? (
          <div className="mt-6 rounded-2xl border border-pd-border bg-pd-surface p-5">
            <p className="text-sm text-pd-muted">
              Our public status page is hosted externally for incident history and subscriptions.
            </p>
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-pd-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-pd-brand-hover"
            >
              Open status page ↗
            </a>
          </div>
        ) : null}

        <StatusPageContent externalStatusUrl={externalUrl} />

        <p className="mt-8 text-xs text-pd-muted">
          Operators: configure <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_STATUS_PAGE_URL</code>{" "}
          (Better Stack, Instatus, etc.) and point your monitor at{" "}
          <code className="rounded bg-slate-100 px-1">/api/health</code>. See{" "}
          <code className="rounded bg-slate-100 px-1">docs/STATUS_PAGE.md</code>.
        </p>
      </div>
    </div>
  );
}
