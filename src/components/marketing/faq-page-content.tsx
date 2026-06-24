"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";
import { FAQ_CATEGORIES } from "@/config/faq-data";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  name: string;
  questions: FaqItem[];
}

const faqData: FaqCategory[] = FAQ_CATEGORIES;

export function FaqPageContent() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  function toggleItem(key: string) {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <MarketingPageShell
      title="Frequently Asked Questions"
      description="Find answers to common questions about OnlyMyPDF."
      eyebrow="Help center"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
    >
      <p className="mb-8 text-center text-sm text-pd-muted">
        Can&apos;t find what you&apos;re looking for?{" "}
        <Link href="/contact" className="font-medium text-pd-brand hover:underline">
          Contact us
        </Link>
        .
      </p>

      <div className="space-y-10">
        {faqData.map((category) => (
          <section key={category.name}>
            <h2 className="text-lg font-semibold text-pd-foreground">{category.name}</h2>
            <div className="mt-4 divide-y divide-pd-border rounded-2xl border border-pd-border bg-pd-surface">
              {category.questions.map((item) => {
                const key = `${category.name}-${item.question}`;
                const isOpen = openItems[key] ?? false;
                return (
                  <div key={key}>
                    <button
                      type="button"
                      onClick={() => toggleItem(key)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-pd-foreground transition-colors hover:bg-pd-background"
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-pd-muted transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4">
                        <p className="text-sm leading-relaxed text-pd-muted">{item.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </MarketingPageShell>
  );
}
