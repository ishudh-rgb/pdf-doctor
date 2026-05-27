"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { PrivacyBadge } from "@/components/common/privacy-badge";
import { useDesignPreview } from "@/components/design/design-preview-provider";
import type { LayoutStyleId } from "@/config/design-system";

interface RelatedTool {
  name: string;
  href: string;
  icon: React.ReactNode;
  iconColor: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface ToolPageShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  relatedTools?: RelatedTool[];
  faqs?: FAQ[];
  seoContent?: React.ReactNode;
  className?: string;
  preview?: React.ReactNode;
}

function ToolHero({
  layout,
  title,
  description,
}: {
  layout: LayoutStyleId;
  title: string;
  description: string;
}) {
  if (layout === "A") {
    return (
      <section className="border-b border-pd-border bg-pd-surface py-6">
        <div className="pd-container">
          <h1 className="text-2xl font-bold text-pd-foreground sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-pd-muted sm:text-base">{description}</p>
        </div>
      </section>
    );
  }

  if (layout === "C") {
    return (
      <section className="bg-pd-brand py-10 text-white sm:py-14">
        <div className="pd-container text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-xl text-white/85">{description}</p>
        </div>
      </section>
    );
  }

  if (layout === "D") {
    return (
      <section className="pd-section pt-8">
        <div className="pd-container max-w-xl">
          <div className="rounded-2xl border border-pd-border bg-pd-surface p-6 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-pd-foreground">{title}</h1>
            <p className="mt-2 text-sm text-pd-muted">{description}</p>
          </div>
        </div>
      </section>
    );
  }

  if (layout === "B") {
    return (
      <section className="mesh-section border-b border-pd-border py-10 sm:py-12">
        <div className="pd-container">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-3xl font-bold text-pd-foreground sm:text-4xl">{title}</h1>
              <p className="mt-3 text-lg text-pd-muted">{description}</p>
            </div>
            <div className="hidden rounded-xl border border-pd-border bg-pd-surface p-4 text-sm text-pd-muted lg:block">
              Upload your file on the left, preview results on the right.
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Layout E
  return (
    <section className="relative overflow-hidden bg-pd-background py-10 text-center sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-pd-brand/10 blur-3xl"
      />
      <div className="pd-container relative">
        <h1 className="text-3xl font-bold text-pd-foreground sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-pd-muted sm:text-lg">{description}</p>
      </div>
    </section>
  );
}

function Workspace({
  layout,
  children,
  preview,
}: {
  layout: LayoutStyleId;
  children: React.ReactNode;
  preview?: React.ReactNode;
}) {
  const useSplit = (layout === "B" || layout === "E") && preview;

  if (useSplit) {
    return (
      <section className="bg-pd-background py-8 sm:py-12">
        <div className="pd-container">
          <div className="pd-tool-grid grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
            <div className="rounded-2xl border border-pd-border bg-pd-surface p-6 shadow-sm sm:p-8">
              {children}
            </div>
            <div className="rounded-2xl border border-pd-border bg-pd-surface p-4 shadow-sm sm:p-6">
              {preview}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const widthClass =
    layout === "D" ? "max-w-xl" : layout === "A" ? "max-w-5xl" : "max-w-3xl";

  return (
    <section className="bg-pd-background py-8 sm:py-12">
      <div className={cn("pd-container space-y-6", widthClass)}>
        <div className="rounded-2xl border border-pd-border bg-pd-surface p-6 shadow-sm sm:p-8">
          {children}
        </div>
        {preview && (
          <div className="rounded-2xl border border-pd-border bg-pd-surface p-4 shadow-sm sm:p-6">
            {preview}
          </div>
        )}
      </div>
    </section>
  );
}

export function ToolPageShell({
  title,
  description,
  children,
  relatedTools,
  faqs,
  seoContent,
  className,
  preview,
}: ToolPageShellProps) {
  const { layoutStyle } = useDesignPreview();

  return (
    <div className={cn("flex flex-col", className)}>
      <ToolHero layout={layoutStyle} title={title} description={description} />
      <Workspace layout={layoutStyle} preview={preview}>
        {children}
      </Workspace>

      <section className="bg-pd-surface py-6">
        <div className="flex justify-center">
          <PrivacyBadge />
        </div>
      </section>

      {relatedTools && relatedTools.length > 0 && (
        <section className="mesh-section py-12">
          <div className="pd-container max-w-5xl">
            <h2 className="mb-6 text-center text-xl font-semibold text-pd-foreground">
              Related Tools
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="tool-card-glow flex flex-col items-center gap-2 rounded-2xl border border-pd-border bg-pd-surface p-4 shadow-sm"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl bg-pd-brand-muted text-pd-brand",
                      tool.iconColor
                    )}
                  >
                    {tool.icon}
                  </span>
                  <span className="text-sm font-medium text-pd-foreground">{tool.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {faqs && faqs.length > 0 && (
        <section className="bg-pd-surface py-12">
          <div className="pd-container max-w-3xl">
            <h2 className="mb-6 text-center text-xl font-semibold text-pd-foreground">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-pd-border bg-pd-background p-5"
                >
                  <h3 className="text-sm font-semibold text-pd-foreground">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-pd-muted">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {seoContent && (
        <section className="bg-pd-background py-12">
          <div className="prose prose-sm mx-auto max-w-3xl px-4 text-pd-muted">{seoContent}</div>
        </section>
      )}
    </div>
  );
}
