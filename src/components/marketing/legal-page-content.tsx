"use client";

import { MarketingPageShell } from "@/components/layout/marketing-page-shell";

interface LegalPageContentProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageContent({ title, lastUpdated, children }: LegalPageContentProps) {
  return (
    <MarketingPageShell
      title={title}
      description={`Last updated: ${lastUpdated}`}
      eyebrow="Legal"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: title }]}
    >
      <div className="prose prose-sm max-w-none text-pd-muted [&_h2]:text-pd-foreground [&_a]:text-pd-brand [&_strong]:text-pd-foreground">
        {children}
      </div>
    </MarketingPageShell>
  );
}
