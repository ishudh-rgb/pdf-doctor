import { cn } from "@/lib/utils/cn";
import { PrivacyBadge } from "@/components/common/privacy-badge";
import { ToolPageShell } from "@/components/layout/tool-page-shell";

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

interface ToolPageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  relatedTools?: RelatedTool[];
  faqs?: FAQ[];
  seoContent?: React.ReactNode;
  className?: string;
  preview?: React.ReactNode;
}

export function ToolPageLayout({
  title,
  description,
  children,
  relatedTools,
  faqs,
  seoContent,
  className,
  preview,
}: ToolPageLayoutProps) {
  return (
    <ToolPageShell
      title={title}
      description={description}
      className={className}
      preview={preview}
      relatedTools={relatedTools}
      faqs={faqs}
      seoContent={seoContent}
    >
      {children}
    </ToolPageShell>
  );
}

/** Standalone privacy section for pages not using full shell */
export function ToolPrivacySection() {
  return (
    <section className="bg-pd-surface py-6">
      <div className="flex justify-center">
        <PrivacyBadge />
      </div>
    </section>
  );
}
