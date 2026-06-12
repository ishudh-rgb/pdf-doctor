"use client";

import Link from "next/link";
import { FileText, Shield, Zap, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingPageShell } from "@/components/layout/marketing-page-shell";

export function AboutPageContent() {
  return (
    <MarketingPageShell
      title="About Only4PDF"
      description="We believe working with PDFs should be simple, fast, and accessible to everyone — no expensive software or steep learning curves required."
      eyebrow="Company"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
    >
      <div className="grid gap-12 sm:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold text-pd-foreground">Our Mission</h2>
          <p className="mt-4 leading-relaxed text-pd-muted">
            Only4PDF was created to solve a simple problem: everyday PDF tasks shouldn&apos;t
            require desktop software, subscriptions, or technical knowledge.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-pd-foreground">Built for Everyone</h2>
          <p className="mt-4 leading-relaxed text-pd-muted">
            From students and freelancers to small business owners and enterprise teams, Only4PDF
            is designed for anyone who works with documents.
          </p>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold text-pd-foreground">Why Choose Only4PDF?</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Zap, title: "Lightning Fast", desc: "Process PDFs in seconds without compromising quality." },
            { icon: Shield, title: "Privacy First", desc: "Files auto-delete after 2 hours. We never sell your data." },
            { icon: FileText, title: "12+ PDF Tools", desc: "Merge, split, compress, convert, edit, sign, and more." },
            { icon: Users, title: "Free to Start", desc: "5 free uses per day with no signup required." },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-pd-border bg-pd-surface p-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-pd-brand-muted text-pd-brand">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-pd-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-pd-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl bg-pd-brand p-8 text-center text-white sm:p-12">
        <h2 className="text-2xl font-bold sm:text-3xl">Ready to Get Started?</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/85">
          Try Only4PDF for free — no signup needed for basic tools.
        </p>
        <Link href="/#tools" className="mt-6 inline-block">
          <Button size="lg" variant="secondary" className="bg-white text-pd-brand hover:bg-white/90">
            Explore PDF Tools
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>
    </MarketingPageShell>
  );
}
