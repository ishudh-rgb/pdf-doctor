import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Shield, Zap, Users, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About PDF Doctor",
  description:
    "Learn about PDF Doctor — the free, secure online PDF toolkit trusted by thousands. Our mission is to make PDF tools accessible to everyone.",
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              About PDF Doctor
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              We believe working with PDFs should be simple, fast, and
              accessible to everyone — no expensive software or steep learning
              curves required.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 sm:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                PDF Doctor was created to solve a simple problem: everyday PDF
                tasks shouldn&apos;t require desktop software, subscriptions, or
                technical knowledge. Whether you need to merge a few documents
                for work, compress a file for email, or get an AI-powered
                summary of a lengthy report, PDF Doctor handles it right in
                your browser.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Built for Everyone
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                From students and freelancers to small business owners and
                enterprise teams, PDF Doctor is designed for anyone who works
                with documents. Our free tier covers everyday needs, while Pro
                unlocks advanced features like AI summarization, larger file
                support, and priority processing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Why Choose PDF Doctor?
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Process PDFs in seconds, not minutes. Optimized for speed without compromising quality.",
              },
              {
                icon: Shield,
                title: "Privacy First",
                desc: "Files auto-delete after 2 hours. We never read, share, or sell your data.",
              },
              {
                icon: FileText,
                title: "12+ PDF Tools",
                desc: "Merge, split, compress, convert, edit, sign, protect, unlock, scan, and summarize.",
              },
              {
                icon: Users,
                title: "Free to Start",
                desc: "5 free uses per day with no signup required. Upgrade to Pro only when you need more.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <item.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-blue-100">
            Try PDF Doctor for free — no signup needed for basic tools.
          </p>
          <Link
            href="/#tools"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-semibold text-blue-600 shadow-lg transition hover:bg-blue-50"
          >
            Explore PDF Tools
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
