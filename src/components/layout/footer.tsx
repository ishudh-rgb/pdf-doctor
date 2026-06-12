import Link from "next/link";
import {
  FileText,
  Shield,
  Minimize2,
  Layers,
  Scissors,
  FileDown,
  FileUp,
  ImageIcon,
  PenTool,
  Mail,
  MapPin,
  Globe,
  Heart,
  ArrowUpRight,
} from "lucide-react";

const toolLinks = [
  { name: "Compress PDF", href: "/compress-pdf", icon: Minimize2, color: "text-orange-500" },
  { name: "Merge PDF", href: "/merge-pdf", icon: Layers, color: "text-blue-500" },
  { name: "Split PDF", href: "/split-pdf", icon: Scissors, color: "text-violet-500" },
  { name: "PDF to Word", href: "/pdf-to-word", icon: FileDown, color: "text-emerald-500" },
  { name: "Word to PDF", href: "/word-to-pdf", icon: FileUp, color: "text-cyan-500" },
  { name: "JPG to PDF", href: "/jpg-to-pdf", icon: ImageIcon, color: "text-pink-500" },
  { name: "Sign PDF", href: "/sign-pdf", icon: PenTool, color: "text-rose-500" },
];

const companyLinks = [
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
  { name: "FAQ", href: "/faq" },
  { name: "Pricing", href: "/pricing" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
      {/* Decorative blobs */}
      <div className="absolute -left-20 top-10 h-60 w-60 rounded-full bg-blue-400/5 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-60 w-60 rounded-full bg-violet-400/5 blur-3xl" />
      <div className="absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-rose-400/5 blur-3xl" />

      <div className="pd-container relative py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-200/50 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Only<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">4</span>PDF
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-gray-500">
              Every PDF tool you need, right in your browser. Fast, free, and secure. Trusted by 10,000+ users across 50+ countries.
            </p>

            {/* Security badge */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-[11px] font-medium text-emerald-700">
                256-bit encrypted · Auto-delete after 2 hrs
              </span>
            </div>

            {/* Contact info */}
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[12px] text-gray-400">
                <Mail className="h-3.5 w-3.5" />
                <span>support@only4pdf.in</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-gray-400">
                <MapPin className="h-3.5 w-3.5" />
                <span>India · Serving globally</span>
              </div>
            </div>
          </div>

          {/* Tools column */}
          <div className="lg:col-span-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <div className="h-1 w-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
              PDF Tools
            </h3>
            <ul className="mt-4 space-y-1.5">
              {toolLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="group/link flex items-center gap-2 rounded-md px-1.5 py-1 text-[13px] text-gray-600 transition-colors hover:bg-gray-100/80 hover:text-gray-900"
                  >
                    <link.icon className={`h-3.5 w-3.5 ${link.color}`} />
                    <span>{link.name}</span>
                    <ArrowUpRight className="ml-auto h-3 w-3 text-gray-300 opacity-0 transition-opacity group-hover/link:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div className="lg:col-span-2">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <div className="h-1 w-4 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
              Company
            </h3>
            <ul className="mt-4 space-y-1.5">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="group/link flex items-center gap-2 rounded-md px-1.5 py-1 text-[13px] text-gray-600 transition-colors hover:bg-gray-100/80 hover:text-gray-900"
                  >
                    <span>{link.name}</span>
                    <ArrowUpRight className="ml-auto h-3 w-3 text-gray-300 opacity-0 transition-opacity group-hover/link:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Language + Newsletter column */}
          <div className="lg:col-span-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <div className="h-1 w-4 rounded-full bg-gradient-to-r from-rose-500 to-pink-500" />
              Language
            </h3>
            <div className="mt-4 flex gap-2">
              <Link
                href="?lang=en"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <Globe className="h-3.5 w-3.5 text-blue-500" />
                English
              </Link>
              <Link
                href="?lang=hi"
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
              >
                <Globe className="h-3.5 w-3.5 text-orange-500" />
                हिंदी
              </Link>
            </div>

            {/* Quick stats */}
            <div className="mt-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Why Only4PDF?</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-lg font-extrabold text-blue-600">12+</p>
                  <p className="text-[10px] text-gray-400">PDF Tools</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-emerald-600">100%</p>
                  <p className="text-[10px] text-gray-400">Free to Use</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-violet-600">10K+</p>
                  <p className="text-[10px] text-gray-400">Happy Users</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-rose-600">50+</p>
                  <p className="text-[10px] text-gray-400">Countries</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 sm:flex-row">
          <p className="text-[13px] text-gray-400">
            © {new Date().getFullYear()} Only4PDF. All rights reserved.
          </p>
          <p className="flex items-center gap-1 text-[12px] text-gray-400">
            Made with <Heart className="h-3 w-3 fill-rose-500 text-rose-500" /> in India for the world
          </p>
        </div>
      </div>
    </footer>
  );
}
