import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LanguageProvider } from "@/i18n";
import { LangSync } from "@/components/i18n/lang-sync";
import { HindiFontLoader } from "@/components/i18n/hindi-font-loader";
import { DesignPreviewProvider } from "@/components/design/design-preview-provider";
import { LogoPreviewProvider } from "@/components/providers/logo-preview-provider";
import { HeroVariantProvider } from "@/components/marketing/hero-variant-provider";
import { DevPreviewOverlays } from "@/components/layout/dev-preview-overlays";
import {
  DEFAULT_BRAND_THEME,
  DEFAULT_LAYOUT_STYLE,
  LAYOUT_BODY_CLASS,
} from "@/config/design-system";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "OnlyMyPDF - Every PDF Tool You Need",
    template: "%s | OnlyMyPDF",
  },
  description:
    "Free online PDF tools to compress, convert, merge, split, edit, and sign PDFs. Fast, secure, and easy to use — right in your browser.",
  keywords: [
    "PDF tools",
    "compress PDF",
    "merge PDF",
    "convert PDF",
    "edit PDF",
    "sign PDF",
    "PDF to Word",
    "free PDF editor",
    "online PDF tools",
    "OnlyMyPDF",
  ],
  openGraph: {
    title: "OnlyMyPDF - Every PDF Tool You Need",
    description:
      "Free online PDF tools to compress, convert, merge, split, edit, and sign PDFs.",
    type: "website",
    siteName: "OnlyMyPDF",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-brand-theme={DEFAULT_BRAND_THEME}
      data-layout-style={DEFAULT_LAYOUT_STYLE}
      className={`${inter.variable} ${plusJakarta.variable} ${LAYOUT_BODY_CLASS[DEFAULT_LAYOUT_STYLE]} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a href="#main-content" className="pd-skip-link">
          Skip to main content
        </a>
        <LogoPreviewProvider>
          <DesignPreviewProvider>
            <HeroVariantProvider>
              <LanguageProvider>
                <LangSync />
                <HindiFontLoader />
                <AuthProvider>
                  <Header />
                  <main id="main-content" className="flex-1">
                    {children}
                  </main>
                  <Footer />
                  <DevPreviewOverlays />
                </AuthProvider>
              </LanguageProvider>
            </HeroVariantProvider>
          </DesignPreviewProvider>
        </LogoPreviewProvider>
      </body>
    </html>
  );
}
