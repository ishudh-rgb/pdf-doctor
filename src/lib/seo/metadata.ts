import type { Metadata } from "next";
import { APP_DESCRIPTION, APP_NAME, APP_URL } from "@/config/constants";
import { getToolSEO } from "@/config/tools";
import { buildLanguageAlternates } from "@/lib/seo/language-alternates";

const OG_IMAGE = "/opengraph-image";

export function stripBrandFromTitle(title: string): string {
  return title
    .replace(/\s*\|\s*Only4PDF\s*$/i, "")
    .replace(/\s*\|\s*OnlyMyPDF\s*$/i, "")
    .trim();
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${APP_URL}${normalized === "/" ? "" : normalized}`;
}

type PageMetadataOptions = {
  title: string;
  description?: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description = APP_DESCRIPTION,
  path,
  keywords,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const pageTitle = stripBrandFromTitle(title);
  const alternates = buildLanguageAlternates(path);
  const fullTitle = `${pageTitle} | ${APP_NAME}`;

  return {
    title: pageTitle,
    description,
    keywords,
    alternates,
    openGraph: {
      title: fullTitle,
      description,
      url: alternates.canonical,
      type: "website",
      siteName: APP_NAME,
      locale: "en_US",
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${APP_NAME} — Free Online PDF Tools`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
  };
}

export function buildToolMetadata(slug: string): Metadata {
  const seo = getToolSEO(slug);
  const toolTitle = seo?.title ?? slug.replace(/-/g, " ");
  const description =
    seo?.metaDescription ??
    `Use ${toolTitle} online for free with ${APP_NAME}. Fast, secure, and browser-based.`;

  return buildPageMetadata({
    title: toolTitle,
    description,
    path: `/${slug}`,
    keywords: [toolTitle, "PDF tool", "online PDF", APP_NAME],
  });
}

export const NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};
