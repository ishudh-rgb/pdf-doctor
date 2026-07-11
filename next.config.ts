import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const maxBodyMb = Number(process.env.MAX_UPLOAD_BODY_MB) || 110;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
  /** Mirror server file-size env to client so SSR and browser marketing text match. */
  env: {
    NEXT_PUBLIC_MAX_FREE_FILE_SIZE_MB:
      process.env.NEXT_PUBLIC_MAX_FREE_FILE_SIZE_MB ??
      process.env.MAX_FREE_FILE_SIZE_MB ??
      "25",
    NEXT_PUBLIC_MAX_PRO_FILE_SIZE_MB:
      process.env.NEXT_PUBLIC_MAX_PRO_FILE_SIZE_MB ??
      process.env.MAX_PRO_FILE_SIZE_MB ??
      "200",
    NEXT_PUBLIC_BILLING_MODE: process.env.BILLING_MODE ?? "",
    NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID:
      process.env.NEXT_PUBLIC_RAZORPAY_PRO_MONTHLY_PLAN_ID ??
      process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID ??
      "",
    NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID:
      process.env.NEXT_PUBLIC_RAZORPAY_PRO_YEARLY_PLAN_ID ??
      process.env.RAZORPAY_PRO_YEARLY_PLAN_ID ??
      "",
    NEXT_PUBLIC_STATUS_PAGE_URL: process.env.NEXT_PUBLIC_STATUS_PAGE_URL ?? "",
  },
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    proxyClientMaxBodySize: `${maxBodyMb}mb`,
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.supabase.in",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  serverExternalPackages: [
    "sharp",
    "pdf-parse",
    "archiver",
    "muhammara",
    "puppeteer",
    "docx",
    "exceljs",
    "pptxgenjs",
    "pdfjs-dist",
    "@napi-rs/canvas",
  ],
};

const sentryEnabled = Boolean(process.env.SENTRY_DSN);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
      automaticVercelMonitors: true,
    })
  : nextConfig;
