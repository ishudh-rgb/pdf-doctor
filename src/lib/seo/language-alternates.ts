import { absoluteUrl } from "@/lib/seo/metadata";

/** English-only hreflang until dedicated /hi/ routes exist. */
export function buildLanguageAlternates(path: string) {
  const canonical = absoluteUrl(path);

  return {
    canonical,
    languages: {
      en: canonical,
      "x-default": canonical,
    },
  };
}
