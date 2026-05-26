import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LanguageProvider } from "@/i18n";
import { LangSync } from "@/components/i18n/lang-sync";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "PDF Doctor - Every PDF Tool You Need",
    template: "%s | PDF Doctor",
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
    "PDF Doctor",
  ],
  openGraph: {
    title: "PDF Doctor - Every PDF Tool You Need",
    description:
      "Free online PDF tools to compress, convert, merge, split, edit, and sign PDFs.",
    type: "website",
    siteName: "PDF Doctor",
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
    <html lang="en" className={`${inter.variable} ${notoSansDevanagari.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <LanguageProvider>
          <LangSync />
          <AuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
