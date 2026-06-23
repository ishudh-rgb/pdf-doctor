import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    // Large PDF uploads — no practical cap for local/dev; increase if needed via env
    proxyClientMaxBodySize: "1024mb",
  },
  webpack: (config, { dev }) => {
    // Avoid webpack pack-file cache OOM on Windows after heavy PDF tool builds (~2gb .next/cache)
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

export default nextConfig;
