import { absoluteUrl } from "@/lib/seo/metadata";

/** Hindi is applied client-side via language switcher; alternate URL uses ?lang=hi. */
export function buildLanguageAlternates(path: string) {
  const canonical = absoluteUrl(path);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const hiUrl =
    normalizedPath === "/"
      ? `${canonical}?lang=hi`
      : `${canonical}${canonical.includes("?") ? "&" : "?"}lang=hi`;

  return {
    canonical,
    languages: {
      en: canonical,
      hi: hiUrl,
      "x-default": canonical,
    },
  };
}
