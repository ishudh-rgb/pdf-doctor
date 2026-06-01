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
  /** Desktop 2-column workspace from first paint (avoids layout jump when preview mounts) */
  splitWorkspace?: boolean;
  previewPlaceholder?: string;
  /** Full-width tool workspace (page grid, editor-style tools) */
  fullWidthWorkspace?: boolean;
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
      <section className="border-b border-pd-border bg-pd-surface py-4">
        <div className="pd-container">
          <h1 className="text-xl font-bold text-pd-foreground sm:text-2xl">{title}</h1>
          <p className="mt-0.5 text-sm text-pd-muted">{description}</p>
        </div>
      </section>
    );
  }

  if (layout === "C") {
    return (
      <section className="bg-pd-brand py-6 text-white sm:py-8">
        <div className="pd-container text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/85">{description}</p>
        </div>
      </section>
    );
  }

  if (layout === "D") {
    return (
      <section className="py-5 sm:py-6">
        <div className="pd-container max-w-xl">
          <div className="rounded-xl border border-pd-border bg-pd-surface p-5 text-center shadow-sm">
            <h1 className="text-xl font-bold text-pd-foreground">{title}</h1>
            <p className="mt-1 text-sm text-pd-muted">{description}</p>
          </div>
        </div>
      </section>
    );
  }

  if (layout === "B") {
    return null;
  }

  // Layout E
  return (
    <section className="relative overflow-hidden bg-pd-background py-6 text-center sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-pd-brand/10 blur-3xl"
      />
      <div className="pd-container relative">
        <h1 className="text-2xl font-bold text-pd-foreground sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-pd-muted">{description}</p>
      </div>
    </section>
  );
}

function Workspace({
  layout,
  title,
  description,
  children,
  preview,
  splitWorkspace,
  previewPlaceholder,
  fullWidthWorkspace,
}: {
  layout: LayoutStyleId;
  title: string;
  description: string;
  children: React.ReactNode;
  preview?: React.ReactNode;
  splitWorkspace?: boolean;
  previewPlaceholder?: string;
  fullWidthWorkspace?: boolean;
}) {
  const inlineHeader = layout === "B";
  const useSplit = splitWorkspace || Boolean(preview);

  if (fullWidthWorkspace) {
    return (
      <section className="bg-pd-background py-3 sm:py-4">
        <div className="pd-container mx-auto w-full max-w-7xl">
          {inlineHeader && (
            <header className="mb-3">
              <h1 className="text-lg font-bold text-pd-foreground sm:text-xl">{title}</h1>
              <p className="mt-0.5 text-sm text-pd-muted">{description}</p>
            </header>
          )}
          <div className="pd-tool-workspace w-full">{children}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-pd-background py-3 sm:py-4">
      <div className="pd-container">
        <div className={cn("mx-auto w-full", useSplit ? "max-w-6xl" : "max-w-lg")}>
          <div
            className={cn(
              useSplit && "grid gap-3 lg:grid-cols-2 lg:items-stretch lg:gap-4"
            )}
          >
            <div className="flex min-h-0 flex-col rounded-xl border border-pd-border bg-pd-surface p-4 shadow-sm sm:p-4">
              {inlineHeader && (
                <header className="mb-3 border-b border-pd-border pb-2.5">
                  <h1 className="text-lg font-bold text-pd-foreground sm:text-xl">{title}</h1>
                  <p className="mt-0.5 text-sm text-pd-muted">{description}</p>
                </header>
              )}
              <div className="pd-tool-workspace w-full">{children}</div>
              <footer className="mt-3 flex justify-center border-t border-pd-border pt-2.5">
                <PrivacyBadge />
              </footer>
            </div>

            {useSplit && (
              <aside
                className="hidden min-h-0 lg:flex lg:flex-col"
                aria-label="Live preview"
              >
                <div className="flex min-h-0 flex-1 flex-col">
                  {preview ?? (
                    <div className="flex h-full min-h-[12rem] flex-1 items-center justify-center rounded-xl border border-dashed border-pd-border bg-pd-brand-muted/30 px-4 py-6 text-center text-sm text-pd-muted">
                      {previewPlaceholder ?? "Upload a file to see live preview"}
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>
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
  splitWorkspace,
  previewPlaceholder,
  fullWidthWorkspace,
}: ToolPageShellProps) {
  const { layoutStyle } = useDesignPreview();

  return (
    <div className={cn("flex flex-col", className)}>
      <ToolHero layout={layoutStyle} title={title} description={description} />
      <Workspace
        layout={layoutStyle}
        title={title}
        description={description}
        preview={preview}
        splitWorkspace={splitWorkspace}
        previewPlaceholder={previewPlaceholder}
        fullWidthWorkspace={fullWidthWorkspace}
      >
        {children}
      </Workspace>

      {relatedTools && relatedTools.length > 0 && (
        <section className="mesh-section py-6 sm:py-8">
          <div className="pd-container max-w-5xl">
            <h2 className="mb-4 text-center text-lg font-semibold text-pd-foreground">
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
        <section className="bg-pd-surface py-8 sm:py-10">
          <div className="pd-container max-w-3xl">
            <h2 className="mb-4 text-center text-lg font-semibold text-pd-foreground">
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
        <section className="bg-pd-background py-8 sm:py-10">
          <div className="prose prose-sm mx-auto max-w-3xl px-4 text-pd-muted">{seoContent}</div>
        </section>
      )}
    </div>
  );
}
