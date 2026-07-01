export const LOCALE_COOKIE = "pd_locale";
export const HI_PREFIX = "/hi";

/** Strip `/hi` prefix from pathname (e.g. `/hi/pricing` → `/pricing`). */
export function stripLocalePrefix(pathname: string): string {
  if (pathname === HI_PREFIX) return "/";
  if (pathname.startsWith(`${HI_PREFIX}/`)) {
    const rest = pathname.slice(HI_PREFIX.length);
    return rest.length > 0 ? rest : "/";
  }
  return pathname;
}

/** Add `/hi` prefix for Hindi URLs. */
export function withLocalePrefix(pathname: string, locale: "en" | "hi"): string {
  const base = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === "en") return stripLocalePrefix(base);
  const stripped = stripLocalePrefix(base);
  return stripped === "/" ? HI_PREFIX : `${HI_PREFIX}${stripped}`;
}

export function pathnameHasHindiPrefix(pathname: string): boolean {
  return pathname === HI_PREFIX || pathname.startsWith(`${HI_PREFIX}/`);
}

export function localeFromPathname(pathname: string): "en" | "hi" {
  return pathnameHasHindiPrefix(pathname) ? "hi" : "en";
}
