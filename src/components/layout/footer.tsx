import Link from "next/link";
import { FileText, Shield, Sparkles } from "lucide-react";

const toolLinks = [
  { name: "Compress PDF", href: "/compress-pdf" },
  { name: "Merge PDF", href: "/merge-pdf" },
  { name: "Split PDF", href: "/split-pdf" },
  { name: "PDF to Word", href: "/pdf-to-word" },
  { name: "Word to PDF", href: "/word-to-pdf" },
  { name: "JPG to PDF", href: "/jpg-to-pdf" },
  { name: "Edit PDF", href: "/edit-pdf" },
  { name: "Sign PDF", href: "/sign-pdf" },
];

const companyLinks = [
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
  { name: "FAQ", href: "/faq" },
];

const languageLinks = [
  { name: "English", href: "?lang=en" },
  { name: "Hindi", href: "?lang=hi" },
];

export function Footer() {
  return (
    <footer className="section-dark relative overflow-hidden border-t border-white/10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 90%, rgba(99,102,241,0.5) 0, transparent 40%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                PDF <span className="text-indigo-300">Doctor</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-indigo-100/70">
              Every PDF tool you need, right in your browser. Fast, free, and
              secure.
            </p>
            <div className="mt-5 flex items-start gap-2 text-xs text-indigo-200/60">
              <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Files are encrypted in transit and automatically deleted after 2
                hours.
              </span>
            </div>
            <Link
              href="/ai-pdf-summarizer"
              className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Try AI Summarizer
            </Link>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-sm font-semibold text-white">PDF Tools</h3>
            <ul className="mt-4 space-y-2.5">
              {toolLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-indigo-100/60 transition-colors hover:text-white"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-4 space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-indigo-100/60 transition-colors hover:text-white"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Language */}
          <div>
            <h3 className="text-sm font-semibold text-white">Language</h3>
            <ul className="mt-4 space-y-2.5">
              {languageLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-indigo-100/60 transition-colors hover:text-white"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-center text-sm text-indigo-200/50">
            &copy; {new Date().getFullYear()} PDF Doctor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
