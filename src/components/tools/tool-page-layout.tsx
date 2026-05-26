import { cn } from "@/lib/utils/cn";
import { PrivacyBadge } from "@/components/common/privacy-badge";

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
}

export function ToolPageLayout({
  title,
  description,
  children,
  relatedTools,
  faqs,
  seoContent,
  className,
}: ToolPageLayoutProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Hero */}
      <section className="relative overflow-hidden mesh-hero py-12 text-center sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-indigo-200/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
            {description}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-slate-50/80 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            {children}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-white py-6">
        <div className="flex justify-center">
          <PrivacyBadge />
        </div>
      </section>

      {/* Related Tools */}
      {relatedTools && relatedTools.length > 0 && (
        <section className="mesh-section py-12">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-6 text-center text-xl font-semibold text-slate-900">
              Related Tools
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {relatedTools.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.href}
                  className="tool-card-glow flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      tool.iconColor
                    )}
                  >
                    {tool.icon}
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {tool.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs && faqs.length > 0 && (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="mb-6 text-center text-xl font-semibold text-slate-900">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
                >
                  <h3 className="text-sm font-semibold text-slate-900">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SEO Content */}
      {seoContent && (
        <section className="bg-slate-50 py-12">
          <div className="prose prose-sm prose-slate mx-auto max-w-3xl px-4">
            {seoContent}
          </div>
        </section>
      )}
    </div>
  );
}
