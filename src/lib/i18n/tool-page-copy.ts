import { slugToToolKey } from "@/lib/dashboard/tool-key";

export function toolI18nBaseKey(slug: string): string {
  return slugToToolKey(slug).replace(/\.name$/, "");
}

export function resolveLocalizedToolTitle(
  slug: string,
  t: (key: string) => string,
  fallback: string
): string {
  const base = toolI18nBaseKey(slug);
  const localized = t(`${base}.name`);
  return localized === `${base}.name` ? fallback : localized;
}

export function resolveLocalizedToolDescription(
  slug: string,
  t: (key: string) => string,
  fallback: string
): string {
  const base = toolI18nBaseKey(slug);
  const long = t(`${base}.longDescription`);
  if (long !== `${base}.longDescription`) return long;
  const short = t(`${base}.description`);
  return short !== `${base}.description` ? short : fallback;
}
