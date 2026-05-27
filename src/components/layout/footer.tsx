import Link from "next/link";
import { FileText, Shield } from "lucide-react";

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

export function Footer() {
  return (
    <footer className="pd-site-footer border-t border-pd-border bg-pd-surface">
      <div className="pd-container py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--pd-radius-lg)] bg-pd-brand">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-pd-foreground">
                PDF <span className="text-pd-brand">Doctor</span>
              </span>
            </Link>
            <p className="pd-prose mt-4 text-sm text-pd-muted">
              Every PDF tool you need, right in your browser. Fast, free, and secure.
            </p>
            <div className="mt-4 flex items-start gap-2 text-xs text-pd-muted">
              <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pd-brand" />
              <span>Files are encrypted in transit and automatically deleted after 2 hours.</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-pd-foreground">PDF Tools</h3>
            <ul className="mt-4 space-y-2.5">
              {toolLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-pd-muted transition-colors hover:text-pd-brand"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-pd-foreground">Company</h3>
            <ul className="mt-4 space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-pd-muted transition-colors hover:text-pd-brand"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-pd-foreground">Language</h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="?lang=en" className="text-sm text-pd-muted hover:text-pd-brand">
                  English
                </Link>
              </li>
              <li>
                <Link href="?lang=hi" className="text-sm text-pd-muted hover:text-pd-brand">
                  Hindi
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-pd-border pt-8 sm:flex-row">
          <p className="text-sm text-pd-muted">
            © {new Date().getFullYear()} PDF Doctor. All rights reserved.
          </p>
          <p className="text-xs text-pd-muted">Enterprise-ready PDF tools for everyone.</p>
        </div>
      </div>
    </footer>
  );
}
