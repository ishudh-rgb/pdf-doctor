import { stripLocalePrefix, withLocalePrefix } from "@/lib/i18n/locale-path";
import { absoluteUrl } from "@/lib/seo/metadata";

/** hreflang: English canonical path + dedicated `/hi` prefix for Hindi. */
export function buildLanguageAlternates(path: string) {
  const basePath = stripLocalePrefix(path.split("?")[0] ?? path);
  const canonical = absoluteUrl(basePath);
  const hindi = absoluteUrl(withLocalePrefix(basePath, "hi"));

  return {
    canonical,
    languages: {
      en: canonical,
      hi: hindi,
      "x-default": canonical,
    },
  };
}
