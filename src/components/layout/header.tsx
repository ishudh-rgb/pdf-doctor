"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  ChevronDown,
  Menu,
  X,
  Minimize2,
  Scissors,
  FileDown,
  FileUp,
  FileImage,
  PenLine,
  PenTool,
  Lock,
  Unlock,
  Sparkles,
  ScanLine,
  ArrowRightLeft,
  ImageIcon,
  Table,
  Presentation,
  FileSpreadsheet,
  Stamp,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/common/language-switch";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useTranslation } from "@/i18n";

interface ToolLink {
  name: string;
  href: string;
  icon: React.ReactNode;
  color: string;
}

interface ToolCategory {
  title: string;
  tools: ToolLink[];
}

const toolIconClass = "text-pd-brand bg-pd-brand-muted";

const megaMenuCategories: ToolCategory[] = [
  {
    title: "Organize PDF",
    tools: [
      { name: "Merge PDF", href: "/merge-pdf", icon: <FileText className="h-4 w-4" />, color: toolIconClass },
      { name: "Split PDF", href: "/split-pdf", icon: <Scissors className="h-4 w-4" />, color: toolIconClass },
      { name: "Rotate PDF", href: "/rotate-pdf", icon: <RotateCw className="h-4 w-4" />, color: toolIconClass },
    ],
  },
  {
    title: "Optimize PDF",
    tools: [
      { name: "Compress PDF", href: "/compress-pdf", icon: <Minimize2 className="h-4 w-4" />, color: toolIconClass },
    ],
  },
  {
    title: "Convert from PDF",
    tools: [
      { name: "PDF to Word", href: "/pdf-to-word", icon: <FileDown className="h-4 w-4" />, color: toolIconClass },
      { name: "PDF to Excel", href: "/pdf-to-excel", icon: <Table className="h-4 w-4" />, color: toolIconClass },
      { name: "PDF to PowerPoint", href: "/pdf-to-ppt", icon: <Presentation className="h-4 w-4" />, color: toolIconClass },
    ],
  },
  {
    title: "Convert to PDF",
    tools: [
      { name: "Word to PDF", href: "/word-to-pdf", icon: <FileUp className="h-4 w-4" />, color: toolIconClass },
      { name: "Excel to PDF", href: "/excel-to-pdf", icon: <FileSpreadsheet className="h-4 w-4" />, color: toolIconClass },
      { name: "PowerPoint to PDF", href: "/ppt-to-pdf", icon: <Presentation className="h-4 w-4" />, color: toolIconClass },
      { name: "JPG to PDF", href: "/jpg-to-pdf", icon: <ImageIcon className="h-4 w-4" />, color: toolIconClass },
    ],
  },
  {
    title: "Edit & Sign",
    tools: [
      { name: "Edit PDF", href: "/edit-pdf", icon: <PenLine className="h-4 w-4" />, color: toolIconClass },
      { name: "Sign PDF", href: "/sign-pdf", icon: <PenTool className="h-4 w-4" />, color: toolIconClass },
      { name: "Add Watermark", href: "/add-watermark", icon: <Stamp className="h-4 w-4" />, color: toolIconClass },
    ],
  },
  {
    title: "Security",
    tools: [
      { name: "Protect PDF", href: "/protect-pdf", icon: <Lock className="h-4 w-4" />, color: toolIconClass },
      { name: "Unlock PDF", href: "/unlock-pdf", icon: <Unlock className="h-4 w-4" />, color: toolIconClass },
    ],
  },
  {
    title: "AI Tools",
    tools: [
      { name: "AI PDF Summarizer", href: "/ai-pdf-summarizer", icon: <Sparkles className="h-4 w-4" />, color: toolIconClass },
    ],
  },
  {
    title: "Scan",
    tools: [
      { name: "PDF Scanner", href: "/pdf-scanner", icon: <ScanLine className="h-4 w-4" />, color: toolIconClass },
    ],
  },
];

const navLinks = [
  { name: "Compress", href: "/compress-pdf" },
  { name: "Convert", href: "/convert" },
  { name: "Merge", href: "/merge-pdf" },
  { name: "Edit", href: "/edit-pdf" },
  { name: "Sign", href: "/sign-pdf" },
  { name: "AI PDF", href: "/ai-pdf-summarizer" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = React.useState(false);
  const megaMenuRef = React.useRef<HTMLDivElement>(null);
  const { user, loading, signOut } = useAuthContext();
  const { t } = useTranslation();

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        megaMenuRef.current &&
        !megaMenuRef.current.contains(e.target as Node)
      ) {
        setMegaMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header className="pd-site-header sticky top-0 z-40 w-full border-b border-pd-border bg-pd-surface/95 backdrop-blur-md">
      <TrustStrip className="pd-trust-strip hidden sm:flex" />
      <div className="pd-container flex h-[var(--pd-header-height)] items-center justify-between">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--pd-radius-lg)] bg-pd-brand shadow-sm">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="pd-logo-text text-xl font-bold text-pd-foreground">
            PDF <span className="text-pd-brand">Doctor</span>
          </span>
        </Link>

        <nav className="pd-nav-links hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-pd-muted transition-colors hover:bg-pd-brand-muted hover:text-pd-brand"
            >
              {link.name}
            </Link>
          ))}

          <div ref={megaMenuRef} className="relative">
            <button
              onClick={() => setMegaMenuOpen((prev) => !prev)}
              className={cn(
                "flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                megaMenuOpen
                  ? "bg-pd-brand-muted text-pd-brand"
                  : "text-pd-muted hover:bg-pd-brand-muted hover:text-pd-brand"
              )}
            >
              All Tools
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  megaMenuOpen && "rotate-180"
                )}
              />
            </button>

            {megaMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-[640px] animate-fade-in rounded-2xl border border-pd-border bg-pd-surface p-6 shadow-lg">
                <div className="grid grid-cols-3 gap-6">
                  {megaMenuCategories.map((category) => (
                    <div key={category.title}>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-pd-muted">
                        {category.title}
                      </h3>
                      <div className="space-y-1">
                        {category.tools.map((tool) => (
                          <Link
                            key={tool.name}
                            href={tool.href}
                            onClick={() => setMegaMenuOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-pd-foreground transition-colors hover:bg-pd-background"
                          >
                            <span
                              className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-lg",
                                tool.color
                              )}
                            >
                              {tool.icon}
                            </span>
                            {tool.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="pd-header-cta hidden items-center gap-3 lg:flex">
          <LanguageSwitch />
          <Link
            href="/pricing"
            className="text-sm font-medium text-pd-muted transition-colors hover:text-pd-brand"
          >
            {t("nav.pricing")}
          </Link>
          {!loading && user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  {t("nav.dashboard")}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                {t("nav.logout")}
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                {t("nav.login")}
              </Button>
            </Link>
          )}
          <Link href="/pricing">
            <Button size="sm">Get Pro</Button>
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="cursor-pointer rounded-lg p-2 text-pd-muted hover:bg-pd-brand-muted lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Full-screen Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-pd-surface lg:hidden">
          <div className="flex h-[var(--pd-header-height)] items-center justify-between border-b border-pd-border px-4">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--pd-radius-lg)] bg-pd-brand">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-pd-foreground">
                PDF <span className="text-pd-brand">Doctor</span>
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="cursor-pointer rounded-lg p-2 text-pd-muted hover:bg-pd-background"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="h-[calc(100vh-var(--pd-header-height))] overflow-y-auto px-4 py-6">
            <div className="space-y-6">
              {megaMenuCategories.map((category) => (
                <div key={category.title}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-pd-muted">
                    {category.title}
                  </h3>
                  <div className="space-y-1">
                    {category.tools.map((tool) => (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-pd-foreground transition-colors hover:bg-pd-background"
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg",
                            tool.color
                          )}
                        >
                          {tool.icon}
                        </span>
                        {tool.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 space-y-3 border-t border-pd-border pt-6">
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-pd-foreground hover:bg-pd-background"
              >
                Pricing
              </Link>
              <div className="flex items-center gap-3">
                <LanguageSwitch />
              </div>
              <div className="flex gap-3 pt-2">
                {!loading && user ? (
                  <>
                    <Link href="/dashboard" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="gradient"
                      className="flex-1"
                      onClick={() => {
                        void signOut();
                        setMobileOpen(false);
                      }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link href="/pricing" className="flex-1" onClick={() => setMobileOpen(false)}>
                      <Button className="w-full">Get Pro</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
