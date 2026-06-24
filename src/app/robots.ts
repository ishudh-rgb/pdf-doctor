import type { MetadataRoute } from "next";
import { APP_URL } from "@/config/constants";
import { NOINDEX_ROUTE_PREFIXES } from "@/lib/seo/routes";

const PRIVATE_PATHS = ["/api/", ...NOINDEX_ROUTE_PREFIXES];

/** AI answer-engine crawlers — explicitly allowed on public content. */
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "Google-Extended",
  "anthropic-ai",
  "ClaudeBot",
  "PerplexityBot",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "Applebot-Extended",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
