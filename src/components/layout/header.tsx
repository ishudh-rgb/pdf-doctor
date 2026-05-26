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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "@/components/common/language-switch";
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

const megaMenuCategories: ToolCategory[] = [
  {
    title: "Organize PDF",
    tools: [
      { name: "Merge PDF", href: "/merge-pdf", icon: <FileText className="h-4 w-4" />, color: "text-blue-600 bg-blue-50" },
      { name: "Split PDF", href: "/split-pdf", icon: <Scissors className="h-4 w-4" />, color: "text-purple-600 bg-purple-50" },
    ],
  },
  {
    title: "Optimize PDF",
    tools: [
      { name: "Compress PDF", href: "/compress-pdf", icon: <Minimize2 className="h-4 w-4" />, color: "text-green-600 bg-green-50" },
    ],
  },
  {
    title: "Convert from PDF",
    tools: [
      { name: "PDF to Word", href: "/pdf-to-word", icon: <FileDown className="h-4 w-4" />, color: "text-blue-600 bg-blue-50" },
      { name: "PDF to Excel", href: "/pdf-to-excel", icon: <Table className="h-4 w-4" />, color: "text-green-700 bg-green-50" },
      { name: "PDF to PowerPoint", href: "/pdf-to-ppt", icon: <Presentation className="h-4 w-4" />, color: "text-orange-700 bg-orange-50" },
    ],
  },
  {
    title: "Convert to PDF",
    tools: [
      { name: "Word to PDF", href: "/word-to-pdf", icon: <FileUp className="h-4 w-4" />, color: "text-red-600 bg-red-50" },
      { name: "Excel to PDF", href: "/excel-to-pdf", icon: <FileSpreadsheet className="h-4 w-4" />, color: "text-green-700 bg-green-50" },
      { name: "PowerPoint to PDF", href: "/ppt-to-pdf", icon: <Presentation className="h-4 w-4" />, color: "text-orange-700 bg-orange-50" },
      { name: "JPG to PDF", href: "/jpg-to-pdf", icon: <ImageIcon className="h-4 w-4" />, color: "text-orange-600 bg-orange-50" },
    ],
  },
  {
    title: "Edit & Sign",
    tools: [
      { name: "Edit PDF", href: "/edit-pdf", icon: <PenLine className="h-4 w-4" />, color: "text-indigo-600 bg-indigo-50" },
      { name: "Sign PDF", href: "/sign-pdf", icon: <PenTool className="h-4 w-4" />, color: "text-pink-600 bg-pink-50" },
      { name: "Add Watermark", href: "/add-watermark", icon: <Stamp className="h-4 w-4" />, color: "text-cyan-700 bg-cyan-50" },
    ],
  },
  {
    title: "Security",
    tools: [
      { name: "Protect PDF", href: "/protect-pdf", icon: <Lock className="h-4 w-4" />, color: "text-red-600 bg-red-50" },
      { name: "Unlock PDF", href: "/unlock-pdf", icon: <Unlock className="h-4 w-4" />, color: "text-emerald-600 bg-emerald-50" },
    ],
  },
  {
    title: "AI Tools",
    tools: [
      { name: "AI PDF Summarizer", href: "/ai-pdf-summarizer", icon: <Sparkles className="h-4 w-4" />, color: "text-violet-600 bg-violet-50" },
    ],
  },
  {
    title: "Scan",
    tools: [
      { name: "PDF Scanner", href: "/pdf-scanner", icon: <ScanLine className="h-4 w-4" />, color: "text-cyan-600 bg-cyan-50" },
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 shadow-md shadow-indigo-500/20">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">
            PDF <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Doctor</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
            >
              {link.name}
            </Link>
          ))}

          {/* All Tools Mega Menu */}
          <div ref={megaMenuRef} className="relative">
            <button
              onClick={() => setMegaMenuOpen((prev) => !prev)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                megaMenuOpen
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
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

            {/* Mega Menu Dropdown */}
            {megaMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-[640px] rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl animate-fade-in">
                <div className="grid grid-cols-3 gap-6">
                  {megaMenuCategories.map((category) => (
                    <div key={category.title}>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {category.title}
                      </h3>
                      <div className="space-y-1">
                        {category.tools.map((tool) => (
                          <Link
                            key={tool.name}
                            href={tool.href}
                            onClick={() => setMegaMenuOpen(false)}
                            className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
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

        {/* Right Side Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitch />
          <Link
            href="/pricing"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-700"
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
            <Button variant="gradient" size="sm">
              Get Pro
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="cursor-pointer rounded-lg p-2 text-slate-600 hover:bg-indigo-50 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Full-screen Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-white lg:hidden">
          <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              onClick={() => setMobileOpen(false)}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                PDF <span className="text-indigo-600">Doctor</span>
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="overflow-y-auto px-4 py-6 h-[calc(100vh-4rem)]">
            <div className="space-y-6">
              {megaMenuCategories.map((category) => (
                <div key={category.title}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {category.title}
                  </h3>
                  <div className="space-y-1">
                    {category.tools.map((tool) => (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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

            <div className="mt-8 space-y-3 border-t border-gray-200 pt-6">
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                      <Button variant="gradient" className="w-full">
                        Get Pro
                      </Button>
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
